from typing import Annotated

from fastapi import APIRouter, Depends

from kitsune.app.database import PostgresClient
from kitsune.app.dependencies import get_client

router = APIRouter(prefix="/vectorizers", tags=["vectorizers"])


@router.get("/")
def get_all_vectorizers(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_all_vectorizers()
