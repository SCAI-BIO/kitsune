from contextlib import asynccontextmanager

from datastew.repository import PostgreSQLRepository
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.database import engine
from app.routers import (
    concepts,
    imports,
    mappings,
    terminologies,
    vectorizers,
    visualization,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    PostgreSQLRepository.setup_database(engine)
    yield


app = FastAPI(
    title="KITSUNE",
    lifespan=lifespan,
    description="<div id=info-text><h1>Introduction</h1>"
    "KITSUNE uses vector embeddings from variable descriptions to suggest mappings for datasets based on "
    "their semantic similarity. Mappings are stored with their vector representations in a knowledge "
    "base, where they can be used for subsequent harmonization tasks, potentially improving the following "
    "suggestions with each iteration. Models for the computation as well as databases for storage are "
    "meant to be configurable and extendable to adapt the tool for specific use-cases.</div>"
    "<div id=db-plot><h1>Current DB state</h1>"
    "<p>Showing 2D Visualization of DB entries up to a limit of 1000 entries</p>"
    '<a href="/visualization">Click here to view visualization</a></div>',
    version="0.0.3",
    terms_of_service="https://www.scai.fraunhofer.de/",
    contact={
        "name": "Dr. Marc Jacobs",
        "email": "marc.jacobs@scai.fraunhofer.de",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
    openapi_extra={
        "info": {
            "x-logo": {
                "url": "https://example.com/logo.png",
                "altText": "Your API Logo",
            }
        }
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/version", tags=["info"])
def get_current_version():
    return app.version


app.include_router(visualization.router)
app.include_router(vectorizers.router)
app.include_router(terminologies.router)
app.include_router(concepts.router)
app.include_router(mappings.router)
app.include_router(imports.router)


@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/docs")


@app.get("/v1", include_in_schema=False)
def v1_redirect():
    return RedirectResponse(url="/docs")
