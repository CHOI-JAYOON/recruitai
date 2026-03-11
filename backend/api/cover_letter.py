from fastapi import APIRouter, Header, Query, Depends
from pydantic import BaseModel
from agents.cover_letter_agent import CoverLetterAgent
from models.cover_letter import CoverLetterQuestion
from services.openai_client import get_openai_client
from services.cover_letter_history_storage import CoverLetterHistoryStorage
from services.profile_storage import ProfileStorage
from services.jwt_service import get_current_user

router = APIRouter()
history_storage = CoverLetterHistoryStorage()
profile_storage = ProfileStorage()


class AnswerRequest(BaseModel):
    question: str
    max_length: int = 500
    job_description: str = ""
    primary_resume: dict | None = None
    primary_career_desc: dict | None = None


class RefineRequest(BaseModel):
    question: str
    max_length: int = 500
    job_description: str = ""
    current_answer: str
    chat_history: list[dict]
    primary_resume: dict | None = None
    primary_career_desc: dict | None = None


class SaveRequest(BaseModel):
    company: str
    job_description: str = ""
    answers: list[dict]


def _load_resume_text(username: str) -> str:
    if not username:
        return ""
    try:
        profile = profile_storage.load(username)
        return profile.resume_text or ""
    except Exception:
        return ""


@router.post("/answer")
def generate_answer(req: AnswerRequest, current_user: dict = Depends(get_current_user), x_api_key: str = Header(...)):
    client = get_openai_client(x_api_key)
    agent = CoverLetterAgent(client)
    q = CoverLetterQuestion(question=req.question, max_length=req.max_length)
    resume_text = _load_resume_text(current_user["username"])

    answer = agent.answer_question(
        question=q,
        job_description=req.job_description,
        resume_text=resume_text,
        primary_resume=req.primary_resume,
        primary_career_desc=req.primary_career_desc,
    )
    return answer.model_dump()


@router.post("/refine")
def refine_answer(req: RefineRequest, current_user: dict = Depends(get_current_user), x_api_key: str = Header(...)):
    client = get_openai_client(x_api_key)
    agent = CoverLetterAgent(client)
    resume_text = _load_resume_text(current_user["username"])

    refined = agent.refine_answer(
        question=req.question,
        max_length=req.max_length,
        job_description=req.job_description,
        resume_text=resume_text,
        primary_resume=req.primary_resume,
        primary_career_desc=req.primary_career_desc,
        current_answer=req.current_answer,
        chat_history=req.chat_history,
    )
    return {"answer": refined}


@router.post("/save")
def save_cover_letter(req: SaveRequest, current_user: dict = Depends(get_current_user)):
    record = history_storage.save(current_user["username"], {
        "company": req.company,
        "job_description": req.job_description,
        "answers": req.answers,
    })
    return record


@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    return history_storage.load(current_user["username"])


class UpdateRequest(BaseModel):
    company: str | None = None
    job_description: str | None = None
    answers: list[dict] | None = None


@router.put("/history/{record_id}")
def update_history(record_id: str, req: UpdateRequest, current_user: dict = Depends(get_current_user)):
    updated_fields = {}
    if req.company is not None:
        updated_fields["company"] = req.company
    if req.job_description is not None:
        updated_fields["job_description"] = req.job_description
    if req.answers is not None:
        updated_fields["answers"] = req.answers
    result = history_storage.update(current_user["username"], record_id, updated_fields)
    if result is None:
        return {"success": False, "message": "기록을 찾을 수 없습니다."}
    return result


@router.delete("/history/{record_id}")
def delete_history(record_id: str, current_user: dict = Depends(get_current_user)):
    deleted = history_storage.delete(current_user["username"], record_id)
    if not deleted:
        return {"success": False, "message": "기록을 찾을 수 없습니다."}
    return {"success": True}
