from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ObjectSchema(Enum):
    TERMINOLOGY = "terminology"
    CONCEPT = "concept"
    MAPPING = "mapping"


class TerminologyCreate(BaseModel):
    name: str
    short_name: str


class TerminologyUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None


class ConceptCreate(BaseModel):
    concept_identifier: str
    pref_label: str
    terminology_id: int


class ConceptUpdate(BaseModel):
    concept_identifier: Optional[str]
    pref_label: Optional[str]
    terminology_id: Optional[int]
