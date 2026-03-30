from typing import Optional

from pydantic import BaseModel, ConfigDict


class MappingCreate(BaseModel):
    text: str
    embedding: Optional[list[float]] = None
    vectorizer: Optional[str] = None
    concept_id: int


class MappingUpdate(BaseModel):
    text: Optional[str] = None
    embedding: Optional[list[float]] = None
    vectorizer: Optional[str] = None
    concept_id: Optional[int] = None


class MappingRead(BaseModel):
    id: int
    concept_id: int
    text: str
    vectorizer: str
    embedding: list[float]

    model_config = ConfigDict(from_attributes=True)
