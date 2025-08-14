from typing import Annotated

from datastew.repository.model import Terminology
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_client
from app.models import PostgresClient

router = APIRouter(prefix="/terminologies", tags=["terminologies"], dependencies=[Depends(get_client)])


@router.get("/")
async def get_all_terminologies(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_all_terminologies()


@router.put("/{id}")
async def create_terminology(id: str, name: str, client: Annotated[PostgresClient, Depends(get_client)]):
    try:
        terminology = Terminology(name, id)
        client.store(terminology)
        return {"message": f"Terminology {id} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create terminology: {str(e)}")
