from typing import Annotated

from datastew.visualisation import get_plot_for_current_database_state
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse

from app.database import PostgresClient
from app.dependencies import get_client

router = APIRouter(prefix="/visualization", tags=["visualization"])

db_plot_html = None


@router.get("/", response_class=HTMLResponse, operation_id="serve_visualization")
def serve_visualization(client: Annotated[PostgresClient, Depends(get_client)]):
    global db_plot_html
    if not db_plot_html:
        db_plot_html = get_plot_for_current_database_state(client)
    return db_plot_html


@router.patch("/")
def update_visualization(client: Annotated[PostgresClient, Depends(get_client)]):
    global db_plot_html
    db_plot_html = get_plot_for_current_database_state(client)
    return {"message": "DB visualization plot has been updated successfully"}
