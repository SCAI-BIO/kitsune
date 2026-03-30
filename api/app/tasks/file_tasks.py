import os
import tempfile

from datastew.io.importer import Importer

from app.database import PostgresClient
from app.schemas import ObjectSchema


def import_jsonl_task(file: bytes, object_type: ObjectSchema, generate_embeddings: bool = False):
    with PostgresClient() as client:
        with tempfile.NamedTemporaryFile(delete=False, mode="wb") as temp_file:
            temp_file.write(file)
            file_path = temp_file.name

        try:
            importer = Importer(repository=client)
            importer.import_from_jsonl(
                jsonl_path=file_path, object_type=object_type.value, generate_embeddings=generate_embeddings
            )
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)
