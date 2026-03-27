from typing import Optional

from pydantic import BaseModel


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
