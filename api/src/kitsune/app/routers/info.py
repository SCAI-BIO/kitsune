from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text

from kitsune.app.config import APP_VERSION
from kitsune.app.database import PostgresClient
from kitsune.app.dependencies import get_client

router = APIRouter(prefix="", tags=["info"])


@router.get("/version")
def get_current_version():
    return APP_VERSION


@router.get("/health")
def health_check(client: Annotated[PostgresClient, Depends(get_client)]):
    health_status = {"status": "healthy", "database": "unreachable", "vectorizer": "offline"}
    try:
        client.db_session.execute(text("SELECT 1"))
        health_status["database"] = "online"

        if client.vectorizer:
            health_status["vectorizer"] = "online"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["error"] = str(e)

    return health_status
