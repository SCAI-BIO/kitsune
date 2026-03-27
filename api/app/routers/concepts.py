from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.database import PostgresClient
from app.dependencies import get_client

router = APIRouter(prefix="/concepts", tags=["concepts"])


@router.get("/")
def get_all_concepts(client: Annotated[PostgresClient, Depends(get_client)], limit: int = 10, offset: int = 0):
    return client.get_concepts(limit=limit, offset=offset).items


@router.get("/total-number")
def get_total_number_of_concepts(client: Annotated[PostgresClient, Depends(get_client)]):
    return client.get_concepts(limit=1).total_count


@router.get("/{identifier}")
def get_concept(identifier: str, client: Annotated[PostgresClient, Depends(get_client)]):
    try:
        return client.get_concept_by_identifier(identifier)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get concept with id {identifier}: {str(e)}")


@router.put("/{identifier}")
def create_concept(
    identifier: str, concept_name: str, terminology_name: str, client: Annotated[PostgresClient, Depends(get_client)]
):
    try:
        terminology = client.get_terminology_by_name(terminology_name)
        client.add_concept(terminology_id=terminology.id, pref_label=concept_name, concept_identifier=identifier)
        return {"message": f"Concept {identifier} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create concept: {str(e)}")


@router.put("/{identifier}/mappings")
def create_concept_and_attach_mapping(
    identifier: str,
    pref_label: str,
    terminology_name: str,
    text: str,
    client: Annotated[PostgresClient, Depends(get_client)],
):
    try:
        terminology = client.get_terminology_by_name(terminology_name)
        concept = client.add_concept(
            terminology_id=terminology.id, pref_label=pref_label, concept_identifier=identifier
        )
        client.add_mapping(concept_id=concept.id, text=text)
        return {"message": f"Concept {id} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create concept: {str(e)}")
