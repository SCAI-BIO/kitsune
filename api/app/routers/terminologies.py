from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.database import PostgresClient
from app.dependencies import get_client

router = APIRouter(prefix="/terminologies", tags=["terminologies"])


@router.get("/")
def get_all_terminologies(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_all_terminologies()


@router.put("/{short_name}")
def create_terminology(short_name: str, name: str, client: Annotated[PostgresClient, Depends(get_client)]):
    try:
        client.add_terminology(name=name, short_name=short_name)
        return {"message": f"Terminology {short_name} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create terminology: {str(e)}")
