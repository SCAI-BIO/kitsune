from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.database import PostgresClient
from app.dependencies import get_client

router = APIRouter(prefix="", tags=["info"])


@router.get("/version", operation_id="get_current_version")
def get_current_version():
    from app.config import APP_VERSION

    return APP_VERSION


@router.get("/health", operation_id="health_check")
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
