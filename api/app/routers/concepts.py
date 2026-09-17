from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.database import PostgresClient
from app.dependencies import get_client, get_current_user_payload
from app.schemas import ConceptCreate, ConceptUpdate

router = APIRouter(prefix="/concepts", tags=["concepts"])


@router.get("/total-number")
def get_total_number_of_concepts(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_concepts(limit=1).total_count


@router.get("/")
def get_all_concepts(client: Annotated[PostgresClient, Depends(get_client)], limit: int = 10, offset: int = 0):
    return client.get_concepts(limit=limit, offset=offset).items


@router.post("/")
def create_concept(
    payload: ConceptCreate,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    try:
        client.add_concept(
            terminology_id=payload.terminology_id,
            pref_label=payload.pref_label,
            concept_identifier=payload.concept_identifier,
        )
        return {"message": f"Concept {payload.concept_identifier} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create concept: {e}") from e


@router.get("/{id}")
def get_concept(id: int, client: Annotated[PostgresClient, Depends(get_client)]):
    try:
        concept = client.get_concept(id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get concept with id {id}: {e}") from e

    if concept is None:
        raise HTTPException(status_code=404, detail="Concept not found")

    return concept


@router.patch("/{id}")
def update_concept(
    id: int,
    payload: ConceptUpdate,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    try:
        updated = client.edit_concept(id=id, **update_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update failed: {e}") from e

    if not updated:
        raise HTTPException(status_code=404, detail="Concept not found")

    return {"message": f"Concept '{id}' updated succesfully"}


@router.delete("/{id}")
def delete_concept(
    id: int,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    target = client.get_concept(id)
    if not target:
        raise HTTPException(status_code=404, detail="Concept not found")

    try:
        client.delete_concept(id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Delete failed: {e}") from e

    return {"message": f"Concept {id} deleted succesfully"}
