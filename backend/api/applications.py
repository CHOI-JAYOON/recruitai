from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from services.application_storage import ApplicationStorage
from services.jwt_service import get_current_user

router = APIRouter()
storage = ApplicationStorage()


class ApplicationCreate(BaseModel):
    company: str
    position: str
    status: str = "지원예정"
    url: str = ""
    notes: str = ""
    applied_date: str = ""
    resume_id: str = ""
    cover_letter_id: str = ""


class ApplicationUpdate(BaseModel):
    company: str | None = None
    position: str | None = None
    status: str | None = None
    url: str | None = None
    notes: str | None = None
    applied_date: str | None = None
    resume_id: str | None = None
    cover_letter_id: str | None = None


@router.get("")
def list_applications(current_user: dict = Depends(get_current_user)):
    return storage.load(current_user["username"])


@router.post("")
def create_application(req: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    record = req.model_dump()
    return storage.save(current_user["username"], record)


@router.put("/{app_id}")
def update_application(app_id: str, req: ApplicationUpdate, current_user: dict = Depends(get_current_user)):
    updates = req.model_dump(exclude_none=True)
    result = storage.update(current_user["username"], app_id, updates)
    if not result:
        raise HTTPException(404, "기록을 찾을 수 없습니다.")
    return result


@router.delete("/{app_id}")
def delete_application(app_id: str, current_user: dict = Depends(get_current_user)):
    if not storage.delete(current_user["username"], app_id):
        raise HTTPException(404, "기록을 찾을 수 없습니다.")
    return {"ok": True}
