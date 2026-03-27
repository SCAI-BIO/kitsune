from datastew.integrations.ols import OlsClient

from app.database import PostgresClient


def import_snomed_ct_task():
    with PostgresClient() as client:
        task = OlsClient(client.vectorizer, "SNOMED CT", "snomed")
        task.process_to_repository(client)


def import_ols_terminology_task(terminology_id: str):
    with PostgresClient() as client:
        task = OlsClient(client.vectorizer, terminology_id, terminology_id)
        task.process_to_repository(client)
