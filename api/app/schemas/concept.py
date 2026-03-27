from typing import Optional

from pydantic import BaseModel


class ConceptCreate(BaseModel):
    concept_identifier: str
    pref_label: str
    terminology_id: int


class ConceptUpdate(BaseModel):
    concept_identifier: Optional[str] = None
    pref_label: Optional[str] = None
    terminology_id: Optional[int] = None
