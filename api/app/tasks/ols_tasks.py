from datastew.integrations.ols import OlsClient

from app.database import PostgresClient


def import_ols_ontology_task(ontology_id: str):
    with PostgresClient() as client:
        task = OlsClient(client.vectorizer, ontology_id)
        task.process_to_repository(client)
