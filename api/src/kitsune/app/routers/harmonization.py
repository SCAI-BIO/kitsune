import json
import os
import tempfile
from typing import Annotated

from datastew.io.source import DataDictionarySource
from datastew.repository.model import MappingResult
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)

from kitsune.app.database import PostgresClient
from kitsune.app.dependencies import get_client, get_client_instance

router = APIRouter(prefix="/harmonization", tags=["harmonization"])


@router.post("/")
def get_closest_mappings_for_text(
    client: Annotated[PostgresClient, Depends(get_client)],
    text: Annotated[str, Form()],
    terminology_name: Annotated[str, Form()] = "OHDSI",
    vectorizer: Annotated[str, Form()] = "nomic-embed-text",
    limit: Annotated[int, Form()] = 5,
    offset: Annotated[int, Form()] = 0,
):
    try:
        embedding = client.vectorizer.get_embedding(text)
        page = client.get_closest_mappings(
            embedding=embedding,
            similarities=True,
            terminology_name=terminology_name,
            vectorizer=vectorizer,
            limit=limit,
            offset=offset,
        )

        return [result.to_dict() for result in page.items if isinstance(result, MappingResult)]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get closest mappings: {e}") from e


@router.post("/dict", description="Get mappings for a data dictionary source.")
def get_closest_mappings_for_dictionary(
    client: Annotated[PostgresClient, Depends(get_client)],
    file: Annotated[UploadFile, File()],
    vectorizer: Annotated[str, Form()] = "nomic-embed-text",
    terminology_name: Annotated[str, Form()] = "OHDSI",
    variable_field: Annotated[str, Form()] = "variable",
    description_field: Annotated[str, Form()] = "description",
    limit: Annotated[int, Form()] = 1,
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file was provided. Please upload a valid file.")

    file_extension = os.path.splitext(file.filename)[1].lower()
    if not file_extension:
        raise HTTPException(status_code=400, detail="The uploaded file must have a valid extension.")

    tmp_file_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            tmp_file_path = tmp_file.name
            tmp_file.write(file.file.read())

        data_dict_source = DataDictionarySource(tmp_file_path, variable_field, description_field)
        df = data_dict_source.to_dataframe()

        descriptions = df["description"].to_list()
        variables = df["variable"].to_list()

        embeddings = client.vectorizer.get_embeddings(descriptions)

        response = []
        for variable, description, embedding in zip(variables, descriptions, embeddings, strict=True):
            page = client.get_closest_mappings(
                embedding=embedding,
                similarities=True,
                terminology_name=terminology_name,
                vectorizer=vectorizer,
                limit=limit,
            )
            mappings_list = [result.to_dict() for result in page.items if isinstance(result, MappingResult)]

            response.append({"variable": variable, "description": description, "mappings": mappings_list})

        return response

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Failed to process dictionary: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


@router.websocket("/dict/ws")
async def websocket_closest_mappings_for_dictionary(websocket: WebSocket):
    await websocket.accept()
    tmp_file_path = None

    try:
        byte_file_data = await websocket.receive_bytes()
        meta = await websocket.receive_text()

        metadata = json.loads(meta)
        model = metadata.get("model", "nomic-embed-text")
        terminology_name = metadata.get("terminology_name", "OHDSI")
        variable_field = metadata.get("variable_field", "variable")
        description_field = metadata.get("description_field", "description")
        limit = metadata.get("limit", 1)
        file_extension = metadata.get("file_extension", "").lower()

        # Map supported extensions to fixed suffixes.
        extension_map = {".csv": ".csv", ".tsv": ".tsv", ".xlsx": ".xlsx"}

        if file_extension not in extension_map:
            raise ValueError(f"Unsupported file extension: {file_extension}")

        safe_suffix = extension_map[file_extension]

        with tempfile.NamedTemporaryFile(delete=False, suffix=safe_suffix) as tmp_file:
            tmp_file_path = tmp_file.name
            tmp_file.write(byte_file_data)

        data_dict_source = DataDictionarySource(tmp_file_path, variable_field, description_field)
        df = data_dict_source.to_dataframe()

        await websocket.send_json({"type": "metadata", "expected_total": len(df)})

        variables = df["variable"].to_list()
        descriptions = df["description"].to_list()

        with get_client_instance() as client:
            embeddings = client.vectorizer.get_embeddings(descriptions)

            for variable, description, embedding in zip(variables, descriptions, embeddings, strict=True):
                page = client.get_closest_mappings(
                    embedding=embedding,
                    similarities=True,
                    terminology_name=terminology_name,
                    vectorizer=model,
                    limit=limit,
                )

                mappings_list = [result.to_dict() for result in page.items if isinstance(result, MappingResult)]

                await websocket.send_json(
                    {"type": "result", "variable": variable, "description": description, "mappings": mappings_list}
                )

        await websocket.close()

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except ValueError as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()
    finally:
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)
