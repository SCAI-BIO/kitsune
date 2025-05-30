from fastapi import APIRouter, Depends, HTTPException, UploadFile
from starlette.background import BackgroundTasks

from app.dependencies import get_client
from app.models import ObjectSchema
from app.tasks.import_tasks import (
    import_jsonl_task,
    import_ols_terminology_task,
    import_snomed_ct_task,
)

router = APIRouter(prefix="/imports", tags=["imports"], dependencies=[Depends(get_client)])


@router.put("/terminology", description="Import a terminology from OLS.")
async def import_terminology(
    background_tasks: BackgroundTasks,
    terminology_id: str,
    model: str = "sentence-transformers/all-mpnet-base-v2",
):
    background_tasks.add_task(import_ols_terminology_task, terminology_id, model)
    return {"message": f"{terminology_id} import started in the background"}


@router.put("/terminology/snomed", description="Import whole SNOMED CT from OLS.")
async def import_snomed_ct(
    background_tasks: BackgroundTasks,
    model: str = "sentence-transformers/all-mpnet-base-v2",
):
    background_tasks.add_task(import_snomed_ct_task, model)
    return {"message": "SNOMED CT import started in the background"}


@router.put("/jsonl", description="Import a JSONL file following the Weaviate schema")
async def import_jsonl(
    background_tasks: BackgroundTasks,
    object_type: ObjectSchema,
    file: UploadFile,
):
    if not file.filename or not file.filename.endswith(".jsonl"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only JSONL files are accepted.")
    background_tasks.add_task(import_jsonl_task, file.file.read(), object_type)
    return {"message": "JSONL import started in the background"}
