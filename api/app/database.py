import logging

from datastew.embedding.vectorizer import Vectorizer
from datastew.repository import PostgreSQLRepository
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import CONNECTION_STRING, HUGGING_FACE_API_KEY, MODEL_NAME, OLLAMA_URL

logger = logging.getLogger("uvicorn.info")
engine = create_engine(CONNECTION_STRING)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
global_vectorizer = Vectorizer(MODEL_NAME, api_key=HUGGING_FACE_API_KEY, host=OLLAMA_URL)


class PostgresClient(PostgreSQLRepository):
    def __init__(self):
        self.db_session = SessionLocal()
        super().__init__(session=self.db_session, vectorizer=global_vectorizer)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        try:
            if exc_type is not None:
                self.db_session.rollback()
            else:
                self.db_session.commit()
        except Exception:
            self.db_session.rollback()
            raise
        finally:
            self.db_session.close()
