from urllib.parse import quote

from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents.career_description_agent import CareerDescriptionAgent
from services.openai_client import get_openai_client
from services.storage import StorageService
from services.profile_storage import ProfileStorage
from services.document_generator import DocumentGenerator
from services.career_desc_history_storage import CareerDescHistoryStorage
from services.jwt_service import get_current_user
from services.subscription import usage_tracker
from models.career_description import CareerDescription

router = APIRouter()
storage = StorageService()
profile_storage = ProfileStorage()
history_storage = CareerDescHistoryStorage()


class GenerateRequest(BaseModel):
    target_role: str
    selected_portfolio_ids: list[str] = []


class DownloadFromHistoryRequest(BaseModel):
    history_id: str


@router.post("/generate")
def generate_career_description(req: GenerateRequest, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    usage_tracker.check_and_increment(username, "career_desc", current_user["plan"], current_user["role"])
    profile = profile_storage.load(username)
    portfolios = storage.get_by_ids(req.selected_portfolio_ids) if req.selected_portfolio_ids else storage.list_all()
    client = get_openai_client()
    agent = CareerDescriptionAgent(client)
    result = agent.generate(profile, portfolios, req.target_role)
    result_dict = result.model_dump()

    # Auto-save to history
    history_storage.save(username, {
        "target_role": req.target_role,
        "selected_portfolio_ids": req.selected_portfolio_ids,
        "summary": result_dict["summary"],
        "entries": result_dict["entries"],
    })

    return result_dict


@router.post("/download")
def download_career_description(req: GenerateRequest, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    usage_tracker.check_and_increment(username, "career_desc", current_user["plan"], current_user["role"])
    profile = profile_storage.load(username)
    portfolios = storage.get_by_ids(req.selected_portfolio_ids) if req.selected_portfolio_ids else storage.list_all()
    client = get_openai_client()
    agent = CareerDescriptionAgent(client)
    result = agent.generate(profile, portfolios, req.target_role)

    doc_gen = DocumentGenerator()
    buffer = doc_gen.generate_career_desc_docx(profile, result, portfolios)

    filename = quote(f"{username}_경력기술서.docx")
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


@router.post("/download-from-history")
def download_from_history(req: DownloadFromHistoryRequest, current_user: dict = Depends(get_current_user)):
    """Download DOCX from saved history without re-calling OpenAI."""
    username = current_user["username"]
    records = history_storage.load(username)
    record = next((r for r in records if r["id"] == req.history_id), None)
    if not record:
        return {"detail": "기록을 찾을 수 없습니다."}

    profile = profile_storage.load(username)
    portfolios = storage.get_by_ids(record.get("selected_portfolio_ids", []))
    career_desc = CareerDescription(**{
        "summary": record.get("summary", ""),
        "target_role": record.get("target_role", ""),
        "entries": record.get("entries", []),
    })
    doc_gen = DocumentGenerator()
    buffer = doc_gen.generate_career_desc_docx(profile, career_desc, portfolios)
    filename = quote(f"{profile.name}_경력기술서.docx")
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    return history_storage.load(current_user["username"])


@router.delete("/history/{record_id}")
def delete_history(record_id: str, current_user: dict = Depends(get_current_user)):
    deleted = history_storage.delete(current_user["username"], record_id)
    if not deleted:
        return {"success": False}
    return {"success": True}


class RenameRequest(BaseModel):
    name: str


@router.put("/history/{record_id}")
def rename_history(record_id: str, req: RenameRequest, current_user: dict = Depends(get_current_user)):
    result = history_storage.update(current_user["username"], record_id, {"name": req.name})
    if not result:
        return {"success": False}
    return result
