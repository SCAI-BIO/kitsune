from app.database import PostgresClient


def get_client():
    with PostgresClient() as client:
        yield client


def get_client_instance() -> PostgresClient:
    return PostgresClient()
