import os
from typing import cast

from datastew.embedding.vectorizer import SupportedModel
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL
POSTGRES_USER = os.getenv("POSTGRES_USER", "testuser")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "testpass")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "testdb")
CONNECTION_STRING = (
    f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

# Vectorizer
raw_model_name = os.getenv("MODEL_NAME", "nomic-embed-text")
MODEL_NAME = cast(SupportedModel, raw_model_name)
HUGGING_FACE_API_KEY = os.getenv("HF_KEY", None)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

# Keycloak Auth
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "myrealm")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "kitsune-api")
KEYCLOAK_ISSUER = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
KEYCLOAK_CERTS_URL = f"{KEYCLOAK_ISSUER}/protocol/openid-connect/certs"

# Application Metadata
APP_VERSION = "0.0.3"  # This string will be replaced by CI
APP_TITLE = "KITSUNE"
APP_DESCRIPTION = (
    "<div id=info-text><h1>Introduction</h1>"
    "KITSUNE uses vector embeddings from variable descriptions to suggest mappings for datasets based on "
    "their semantic similarity. Mappings are stored with their vector representations in a knowledge "
    "base, where they can be used for subsequent harmonization tasks, potentially improving the following "
    "suggestions with each iteration. Models for the computation as well as databases for storage are "
    "meant to be configurable and extendable to adapt the tool for specific use-cases.</div>"
    "<div id=db-plot><h1>Current DB state</h1>"
    "<p>Showing 2D Visualization of DB entries up to a limit of 1000 entries</p>"
    '<a href="/visualization">Click here to view visualization</a></div>'
)

CONTACT_INFO = {
    "name": "Dr. Marc Jacobs",
    "email": "marc.jacobs@scai.fraunhofer.de",
}

LICENSE_INFO = {
    "name": "Apache 2.0",
    "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
}

# Swagger UI Configuration
SWAGGER_UI_OAUTH_CONFIG = {
    "clientId": KEYCLOAK_CLIENT_ID,
    "appName": f"{APP_TITLE} API",
    "usePkceWithAuthorizationCodeGrant": True,
}
