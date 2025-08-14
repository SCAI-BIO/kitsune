from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import get_client
from app.models import PostgresClient

router = APIRouter(prefix="/models", tags=["models"], dependencies=[Depends(get_client)])


@router.get("/")
async def get_all_models(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_all_sentence_embedders()
