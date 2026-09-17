from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.database import PostgresClient
from app.dependencies import get_client, get_current_user_payload
from app.schemas import TerminologyCreate, TerminologyUpdate

router = APIRouter(prefix="/terminologies", tags=["terminologies"])


@router.get("/")
def get_all_terminologies(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_all_terminologies()


@router.post("/")
def create_terminology(
    payload: TerminologyCreate,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    try:
        client.add_terminology(name=payload.name, short_name=payload.short_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create terminology: {e}") from e

    return {"message": f"Terminology {payload.short_name} created successfully"}


@router.get("/{id}")
def get_terminology(id: int, client: Annotated[PostgresClient, Depends(get_client)]):
    term = client.get_terminology(id)
    if not term:
        raise HTTPException(status_code=404, detail="Terminology not found")
    return term


@router.patch("/{id}")
def update_terminology(
    id: int,
    payload: TerminologyUpdate,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    try:
        updated = client.edit_terminology(id=id, **update_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update failed: {e}") from e

    if not updated:
        raise HTTPException(status_code=404, detail="Terminology not found")

    return {"message": f"Terminology '{id}' updated successfully"}


@router.delete("/{id}")
def delete_terminology(
    id: int,
    client: Annotated[PostgresClient, Depends(get_client)],
    user: Annotated[dict, Depends(get_current_user_payload)],
):
    target = client.get_terminology(id)
    if not target:
        raise HTTPException(status_code=404, detail="Terminology not found")

    try:
        client.delete_terminology(id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Delete failed: {e}") from e

    return {"message": f"Terminology {id} deleted successfully"}
