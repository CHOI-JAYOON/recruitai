from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from services.application_storage import ApplicationStorage

router = APIRouter()
storage = ApplicationStorage()


class ApplicationCreate(BaseModel):
    username: str
    company: str
    position: str
    status: str = "지원예정"
    url: str = ""
    notes: str = ""
    applied_date: str = ""
    resume_id: str = ""
    cover_letter_id: str = ""


class ApplicationUpdate(BaseModel):
    username: str
    company: str | None = None
    position: str | None = None
    status: str | None = None
    url: str | None = None
    notes: str | None = None
    applied_date: str | None = None
    resume_id: str | None = None
    cover_letter_id: str | None = None


@router.get("")
def list_applications(username: str = Query(...)):
    return storage.load(username)


@router.post("")
def create_application(req: ApplicationCreate):
    record = req.model_dump(exclude={"username"})
    return storage.save(req.username, record)


@router.put("/{app_id}")
def update_application(app_id: str, req: ApplicationUpdate):
    updates = req.model_dump(exclude={"username"}, exclude_none=True)
    result = storage.update(req.username, app_id, updates)
    if not result:
        raise HTTPException(404, "기록을 찾을 수 없습니다.")
    return result


@router.delete("/{app_id}")
def delete_application(app_id: str, username: str = Query(...)):
    if not storage.delete(username, app_id):
        raise HTTPException(404, "기록을 찾을 수 없습니다.")
    return {"ok": True}
