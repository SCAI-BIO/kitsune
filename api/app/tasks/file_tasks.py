import os
import tempfile

from datastew.io.importer import Importer

from app.database import PostgresClient
from app.schemas import ObjectSchema


def import_jsonl_task(file: bytes, object_type: ObjectSchema):
    with PostgresClient() as client:
        with tempfile.NamedTemporaryFile(delete=False, mode="wb") as temp_file:
            temp_file.write(file)
            file_path = temp_file.name

        try:
            importer = Importer(repository=client)
            importer.import_from_jsonl(file_path, object_type.value)
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)
