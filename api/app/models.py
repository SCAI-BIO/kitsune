import logging
import os
from enum import Enum

from datastew.embedding import Vectorizer
from datastew.repository import PostgreSQLRepository
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "testuser")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "testpass")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "testdb")
MODEL_NAME = os.getenv("MODEL_NAME", "nomic-embed-text")
HUGGING_FACE_API_KEY = os.getenv("HF_KEY", None)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
logger = logging.getLogger("uvicorn.info")
connection_string = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"


class ObjectSchema(Enum):
    TERMINOLOGY = "terminology"
    CONCEPT = "concept"
    MAPPING = "mapping"


class PostgresClient(PostgreSQLRepository):
    def __init__(self):
        super().__init__(
            connection_string=connection_string,
            vectorizer=Vectorizer(MODEL_NAME, api_key=HUGGING_FACE_API_KEY, host=OLLAMA_URL),
        )

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.session.close()
