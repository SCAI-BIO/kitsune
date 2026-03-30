from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.database import PostgresClient
from app.dependencies import get_client, get_current_user_payload
from app.schemas import MappingCreate, MappingUpdate
from app.schemas.maping import MappingRead

router = APIRouter(prefix="/mappings", tags=["mappings"])


@router.get("/total-number")
def get_total_number_of_mappings(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_mappings(limit=1).total_count


@router.get("/", response_model=list[MappingRead])
def get_all_mappings(
    client: Annotated[PostgresClient, Depends(get_client)],
    vectorizer: str = "nomic-embed-text",
    limit: int = 10,
    offset: int = 0,
):
    page = client.get_mappings(vectorizer=vectorizer, limit=limit, offset=offset)
    return page.items


@router.post("/")
def create_mapping(
    payload: MappingCreate,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    try:
        client.add_mapping(
            concept_id=payload.concept_id,
            text=payload.text,
            embedding=payload.embedding,
            vectorizer=payload.vectorizer,
        )
        return {"message": f"Mapping {payload.text} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create mapping: {str(e)}")


@router.get("/{id}", response_model=MappingRead)
def get_mapping(id: int, client: Annotated[PostgresClient, Depends(get_client)]):
    mapping = client.get_mapping(id)
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return mapping


@router.patch("/{id}")
def update_mapping(
    id: int,
    payload: MappingUpdate,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    try:
        updated = client.edit_mapping(id=id, **update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Mapping not found")
        return {"message": f"Mapping '{id}' updated succesffully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update failed: {str(e)}")


@router.delete("/{id}")
def delete_mapping(
    id: int,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    target = client.get_mapping(id)
    if not target:
        raise HTTPException(status_code=404, detail="Mapping not found")

    try:
        client.delete_mapping(id)
        return {"meesage": f"Mapping {id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")
