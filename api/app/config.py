import os
from typing import cast

from datastew.embedding.vectorizer import SupportedModel
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "testuser")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "testpass")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "testdb")
raw_model_name = os.getenv("MODEL_NAME", "nomic-embed-text")
MODEL_NAME = cast(SupportedModel, raw_model_name)
HUGGING_FACE_API_KEY = os.getenv("HF_KEY", None)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

CONNECTION_STRING = (
    f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)
