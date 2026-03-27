from fastapi import APIRouter, HTTPException, UploadFile
from starlette.background import BackgroundTasks

from app.schemas import ObjectSchema
from app.tasks.file_tasks import import_jsonl_task
from app.tasks.ols_tasks import import_ols_terminology_task, import_snomed_ct_task

router = APIRouter(prefix="/imports", tags=["imports"])


@router.put("/terminology", description="Import a terminology from OLS.")
def import_terminology(background_tasks: BackgroundTasks, terminology_id: str):
    background_tasks.add_task(import_ols_terminology_task, terminology_id)
    return {"message": f"{terminology_id} import started in the background"}


@router.put("/terminology/snomed", description="Import whole SNOMED CT from OLS.")
def import_snomed_ct(background_tasks: BackgroundTasks):
    background_tasks.add_task(import_snomed_ct_task)
    return {"message": "SNOMED CT import started in the background"}


@router.put("/jsonl", description="Import a JSONL file following the Weaviate schema")
def import_jsonl(background_tasks: BackgroundTasks, object_type: ObjectSchema, file: UploadFile):
    if not file.filename or not file.filename.endswith(".jsonl"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only JSONL files are accepted.")

    file_content = file.file.read()
    background_tasks.add_task(import_jsonl_task, file_content, object_type)
    return {"message": "JSONL import started in the background"}
