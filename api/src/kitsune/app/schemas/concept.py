from pydantic import BaseModel


class ConceptCreate(BaseModel):
    concept_identifier: str
    pref_label: str
    terminology_id: int


class ConceptUpdate(BaseModel):
    concept_identifier: str | None = None
    pref_label: str | None = None
    terminology_id: int | None = None
