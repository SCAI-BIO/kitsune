from pydantic import BaseModel, ConfigDict


class MappingCreate(BaseModel):
    text: str
    embedding: list[float] | None = None
    vectorizer: str | None = None
    concept_id: int


class MappingUpdate(BaseModel):
    text: str | None = None
    embedding: list[float] | None = None
    vectorizer: str | None = None
    concept_id: int | None = None


class MappingRead(BaseModel):
    id: int
    concept_id: int
    text: str
    vectorizer: str
    embedding: list[float]

    model_config = ConfigDict(from_attributes=True)
