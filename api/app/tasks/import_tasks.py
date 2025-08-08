import asyncio
import os
import tempfile

from datastew.embedding import Vectorizer
from datastew.process.ols import OLSTerminologyImportTask

from app.models import OLLAMA_URL, ObjectSchema, WeaviateClient


def import_snomed_ct_task(model: str = "nomic-embed-text"):
    with WeaviateClient() as client:
        embedding_model = Vectorizer(model, host=OLLAMA_URL)
        task = OLSTerminologyImportTask(embedding_model, "SNOMED CT", "snomed")
        task.process_to_weaviate(client)


def import_ols_terminology_task(terminology_id: str, model: str = "nomic-embed-text"):
    with WeaviateClient() as client:
        embedding_model = Vectorizer(model, host=OLLAMA_URL)
        task = OLSTerminologyImportTask(embedding_model, terminology_id, terminology_id)
        task.process_to_weaviate(client)


async def import_jsonl_task(file: bytes, object_type: ObjectSchema):
    with WeaviateClient() as client:
        with tempfile.NamedTemporaryFile(delete=False, mode="wb") as temp_file:
            temp_file.write(file)
            file_path = temp_file.name

        await asyncio.to_thread(client.import_from_jsonl, file_path, object_type.value)
        os.remove(file_path)
