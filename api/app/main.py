from contextlib import asynccontextmanager

from datastew.repository import PostgreSQLRepository
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.config import (
    APP_DESCRIPTION,
    APP_TITLE,
    APP_VERSION,
    CONTACT_INFO,
    LICENSE_INFO,
    SWAGGER_UI_OAUTH_CONFIG,
)
from app.database import engine
from app.routers import (
    concepts_router,
    harmonization_router,
    imports_router,
    info_router,
    mappings_router,
    terminologies_router,
    vectorizers_router,
    visualization_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    PostgreSQLRepository.setup_database(engine)
    yield


app = FastAPI(
    title=APP_TITLE,
    lifespan=lifespan,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    terms_of_service="https://www.scai.fraunhofer.de/",
    contact=CONTACT_INFO,
    license_info=LICENSE_INFO,
    swagger_ui_init_oauth=SWAGGER_UI_OAUTH_CONFIG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(info_router)
app.include_router(visualization_router)
app.include_router(vectorizers_router)
app.include_router(terminologies_router)
app.include_router(concepts_router)
app.include_router(mappings_router)
app.include_router(harmonization_router)
app.include_router(imports_router)


@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/docs")
