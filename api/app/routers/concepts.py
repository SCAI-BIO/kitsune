from typing import Annotated

from datastew.embedding import Vectorizer
from datastew.repository.model import Concept, Mapping
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_client
from app.models import OLLAMA_URL, WeaviateClient

router = APIRouter(prefix="/concepts", tags=["concepts"], dependencies=[Depends(get_client)])


@router.get("/")
async def get_all_concepts(client: Annotated[WeaviateClient, Depends(get_client)], limit: int = 10, offset: int = 0):
    return client.get_concepts(limit=limit, offset=offset).items


@router.get("/total-number")
async def get_total_number_of_concepts(client: Annotated[WeaviateClient, Depends(get_client)]):
    concept = client.client.collections.get("Concept")
    return concept.aggregate.over_all(total_count=True).total_count


@router.get("/{id}")
async def get_concept(id: str, client: Annotated[WeaviateClient, Depends(get_client)]):
    try:
        concept = client.get_concept(id)
        return concept
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get concept with id {id}: {str(e)}")


@router.put("/{id}")
async def create_concept(
    id: str, concept_name: str, terminology_name: str, client: Annotated[WeaviateClient, Depends(get_client)]
):
    try:
        terminology = client.get_terminology(terminology_name)
        concept = Concept(terminology, concept_name, id)
        client.store(concept)
        return {"message": f"Concept {id} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create concept: {str(e)}")


@router.put("/{id}/mappings")
async def create_concept_and_attach_mapping(
    id: str,
    concept_name: str,
    terminology_name: str,
    text: str,
    client: Annotated[WeaviateClient, Depends(get_client)],
    model: str = "nomic-embed-text",
):
    try:
        terminology = client.get_terminology(terminology_name)
        concept = Concept(terminology, concept_name, id)
        client.store(concept)
        if client.use_weaviate_vectorizer:
            mapping = Mapping(concept, text)
        else:
            embedding_model = Vectorizer(model, host=OLLAMA_URL)
            embedding = embedding_model.get_embedding(text)
            model_name = embedding_model.model_name
            mapping = Mapping(concept, text, list(embedding), model_name)
        client.store(mapping)
        return {"message": f"Concept {id} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create concept: {str(e)}")
