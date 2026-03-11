from urllib.parse import quote

from fastapi import APIRouter, Header, Query, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents.resume_writer_agent import ResumeWriterAgent
from services.openai_client import get_openai_client
from services.storage import StorageService
from services.profile_storage import ProfileStorage
from services.document_generator import DocumentGenerator
from services.resume_history_storage import ResumeHistoryStorage
from services.jwt_service import get_current_user
from models.resume import TailoredResume

router = APIRouter()
storage = StorageService()
profile_storage = ProfileStorage()
history_storage = ResumeHistoryStorage()


class GenerateRequest(BaseModel):
    selected_portfolio_ids: list[str]
    target_role: str


class DownloadFromHistoryRequest(BaseModel):
    history_id: str


@router.post("/generate")
def generate_resume(req: GenerateRequest, current_user: dict = Depends(get_current_user), x_api_key: str = Header(...)):
    username = current_user["username"]
    profile = profile_storage.load(username)
    portfolios = storage.get_by_ids(req.selected_portfolio_ids)
    client = get_openai_client(x_api_key)
    agent = ResumeWriterAgent(client)
    tailored = agent.tailor(portfolios, req.target_role, profile)
    result = tailored.model_dump()

    # Auto-save to history
    history_storage.save(username, {
        "target_role": req.target_role,
        "selected_portfolio_ids": req.selected_portfolio_ids,
        "summary": result.get("summary", ""),
        "entries": result.get("entries", []),
    })

    return result


@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    return history_storage.load(current_user["username"])


@router.delete("/history/{record_id}")
def delete_history(record_id: str, current_user: dict = Depends(get_current_user)):
    deleted = history_storage.delete(current_user["username"], record_id)
    if not deleted:
        return {"success": False, "message": "기록을 찾을 수 없습니다."}
    return {"success": True}


class RenameRequest(BaseModel):
    name: str


@router.put("/history/{record_id}")
def rename_history(record_id: str, req: RenameRequest, current_user: dict = Depends(get_current_user)):
    result = history_storage.update(current_user["username"], record_id, {"name": req.name})
    if not result:
        return {"success": False}
    return result


@router.post("/download")
def download_resume(req: GenerateRequest, current_user: dict = Depends(get_current_user), x_api_key: str = Header(...)):
    username = current_user["username"]
    profile = profile_storage.load(username)
    portfolios = storage.get_by_ids(req.selected_portfolio_ids)
    client = get_openai_client(x_api_key)
    agent = ResumeWriterAgent(client)
    tailored = agent.tailor(portfolios, req.target_role, profile)
    doc_gen = DocumentGenerator()
    buffer = doc_gen.generate_docx(profile, tailored, portfolios)
    filename = quote(f"{profile.name}_이력서.docx")
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
    portfolios = storage.get_by_ids(record["selected_portfolio_ids"])
    tailored = TailoredResume(**{
        "summary": record["summary"],
        "entries": record["entries"],
    })
    doc_gen = DocumentGenerator()
    buffer = doc_gen.generate_docx(profile, tailored, portfolios)
    filename = quote(f"{profile.name}_이력서.docx")
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )
