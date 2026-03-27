from typing import Optional

from pydantic import BaseModel


class TerminologyCreate(BaseModel):
    name: str
    short_name: str


class TerminologyUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
