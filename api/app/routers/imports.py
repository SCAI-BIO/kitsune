from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from starlette.background import BackgroundTasks

from app.dependencies import get_current_user_payload
from app.schemas import ObjectSchema
from app.tasks import import_jsonl_task, import_ols_ontology_task

router = APIRouter(prefix="/imports", tags=["imports"])


@router.post("/ols/{ontology_id}", description="Import a terminology from OLS.")
def import_terminology(
    background_tasks: BackgroundTasks,
    ontology_id: str,
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    background_tasks.add_task(import_ols_ontology_task, ontology_id)
    return {"message": f"{ontology_id} import started in the background"}


@router.post("/jsonl", description="Import a JSONL file following the Weaviate schema")
def import_jsonl(
    file: UploadFile,
    object_type: ObjectSchema,
    user: Annotated[dict, Depends(get_current_user_payload)],
    background_tasks: BackgroundTasks,
    generate_embeddings: bool = False,
):
    if not file.filename or not file.filename.endswith(".jsonl"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only JSONL files are accepted.")

    file_content = file.file.read()
    background_tasks.add_task(import_jsonl_task, file_content, object_type, generate_embeddings)
    return {"message": "JSONL import started in the background"}
