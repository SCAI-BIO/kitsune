from functools import cache
from urllib.parse import urlsplit

from datastew.embedding.vectorizer import SupportedModel
from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    """Environment-dependent application settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # PostgreSQL
    postgres_user: str = Field(default="testuser", validation_alias="POSTGRES_USER")
    postgres_password: SecretStr = Field(default=SecretStr("testpass"), validation_alias="POSTGRES_PASSWORD")
    postgres_host: str = Field(default="localhost", validation_alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, ge=1, le=65535, validation_alias="POSTGRES_PORT")
    postgres_db: str = Field(default="testdb", validation_alias="POSTGRES_DB")

    # Vectorizer
    model_name: SupportedModel = Field(default="nomic-embed-text", validation_alias="MODEL_NAME")
    hugging_face_api_key: SecretStr | None = Field(default=None, validation_alias="HF_KEY")
    ollama_url: str = Field(default="http://localhost:11434", validation_alias="OLLAMA_URL")

    # Keycloak authentication
    keycloak_url: str = Field(default="http://localhost:8080", validation_alias="KEYCLOAK_URL")
    keycloak_realm: str = Field(default="myrealm", validation_alias="KEYCLOAK_REALM")
    keycloak_client_id: str = Field(default="kitsune-api", validation_alias="KEYCLOAK_CLIENT_ID")

    # CORS
    allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:4200"], validation_alias="ALLOWED_ORIGINS"
    )

    @field_validator(
        "postgres_user",
        "postgres_host",
        "postgres_db",
        "keycloak_realm",
        "keycloak_client_id",
    )
    @classmethod
    def validate_non_empty_string(cls, value: str) -> str:
        """Strip string settings and reject empty values."""
        stripped_value = value.strip()

        if not stripped_value:
            raise ValueError("Setting cannot be empty")

        return stripped_value

    @field_validator("keycloak_url", "ollama_url")
    @classmethod
    def normalize_service_url(cls, value: str) -> str:
        """Validate service URLs and remove trailing slashes."""
        normalized_url = value.strip().rstrip("/")
        parsed_url = urlsplit(normalized_url)

        if parsed_url.scheme not in {"http", "https"} or not parsed_url.hostname:
            raise ValueError("Service URL must include an http:// or https:// scheme and a host")

        if parsed_url.query or parsed_url.fragment:
            raise ValueError("Service URL cannot contain a query string or fragment")

        return normalized_url

    @field_validator("allowed_origins")
    @classmethod
    def validate_allowed_origins(cls, origins: list[str]) -> list[str]:
        """Validate and normalize the configured CORS origins."""
        if not origins:
            raise ValueError("ALLOWED_ORIGINS must contain at least one origin")

        normalized_origins: list[str] = []

        for origin in origins:
            normalized_origin = origin.strip().rstrip("/")

            if normalized_origin == "*":
                raise ValueError("ALLOWED_ORIGINS cannot contain '*' while CORS credentials are enabled")

            parsed_origin = urlsplit(normalized_origin)

            if parsed_origin.scheme not in {"http", "https"} or not parsed_origin.hostname:
                raise ValueError(f"Invalid CORS origin: {origin!r}")

            if parsed_origin.username is not None or parsed_origin.password is not None:
                raise ValueError(f"CORS origins cannot contain credentials: {origin!r}")

            if parsed_origin.path or parsed_origin.query or parsed_origin.fragment:
                raise ValueError(f"CORS origins must contain only the scheme, host, and optional port: {origin!r}")

            if normalized_origin not in normalized_origins:
                normalized_origins.append(normalized_origin)

        return normalized_origins

    @property
    def database_url(self) -> URL:
        """Return the SQLAlchemy PostgreSQL connection URL."""
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password.get_secret_value(),
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )

    @property
    def keycloak_issuer(self) -> str:
        """Return the configured Keycloak issuer URL."""
        return f"{self.keycloak_url}/realms/{self.keycloak_realm}"

    @property
    def keycloak_certs_url(self) -> str:
        """Return the Keycloak JSON Web Key Set URL."""
        return f"{self.keycloak_issuer}/protocol/openid-connect/certs"


@cache
def get_settings() -> Settings:
    """Create and cache application settings."""
    return Settings()


settings = get_settings()

# PostgreSQL
DATABASE_URL = settings.database_url

# Compatibility exports for existing imports.
POSTGRES_USER = settings.postgres_user
POSTGRES_PASSWORD = settings.postgres_password.get_secret_value()
POSTGRES_HOST = settings.postgres_host
POSTGRES_PORT = settings.postgres_port
POSTGRES_DB = settings.postgres_db
CONNECTION_STRING = DATABASE_URL.render_as_string(hide_password=False)

# Vectorizer
MODEL_NAME = settings.model_name
HUGGING_FACE_API_KEY = (
    settings.hugging_face_api_key.get_secret_value() if settings.hugging_face_api_key is not None else None
)
OLLAMA_URL = settings.ollama_url

# Keycloak authentication
KEYCLOAK_URL = settings.keycloak_url
KEYCLOAK_REALM = settings.keycloak_realm
KEYCLOAK_CLIENT_ID = settings.keycloak_client_id
KEYCLOAK_ISSUER = settings.keycloak_issuer
KEYCLOAK_CERTS_URL = settings.keycloak_certs_url

# Application metadata
ALLOWED_ORIGINS = settings.allowed_origins
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

CONTACT_INFO = {"name": "Dr. Marc Jacobs", "email": "marc.jacobs@scai.fraunhofer.de"}
LICENSE_INFO = {"name": "Apache 2.0", "url": "https://www.apache.org/licenses/LICENSE-2.0.html"}

# Swagger UI configuration
SWAGGER_UI_OAUTH_CONFIG = {
    "clientId": KEYCLOAK_CLIENT_ID,
    "appName": f"{APP_TITLE} API",
    "usePkceWithAuthorizationCodeGrant": True,
}
