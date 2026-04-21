from typing import Annotated

from fastapi import APIRouter, Depends

from app.database import PostgresClient
from app.dependencies import get_client

router = APIRouter(prefix="/vectorizers", tags=["vectorizers"])


@router.get("/", operation_id="get_all_vectorizers")
def get_all_vectorizers(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_all_vectorizers()
