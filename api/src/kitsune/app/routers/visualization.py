from typing import Annotated

from datastew.visualisation import get_plot_for_current_database_state
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse

from kitsune.app.database import PostgresClient
from kitsune.app.dependencies import get_client

router = APIRouter(prefix="/visualization", tags=["visualization"])


@router.get("/", response_class=HTMLResponse)
def serve_visualization(request: Request, client: Annotated[PostgresClient, Depends(get_client)]):
    db_plot_html = getattr(request.app.state, "db_plot_html", None)

    if db_plot_html is None:
        db_plot_html = get_plot_for_current_database_state(client)
        request.app.state.db_plot_html = db_plot_html

    return db_plot_html


@router.patch("/")
def update_visualization(request: Request, client: Annotated[PostgresClient, Depends(get_client)]):
    request.app.state.db_plot_html = get_plot_for_current_database_state(client)

    return {"message": "DB visualization plot has been updated successfully"}
