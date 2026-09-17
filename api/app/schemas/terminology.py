from pydantic import BaseModel


class TerminologyCreate(BaseModel):
    name: str
    short_name: str


class TerminologyUpdate(BaseModel):
    name: str | None = None
    short_name: str | None = None
