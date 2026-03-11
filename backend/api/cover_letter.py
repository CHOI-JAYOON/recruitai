from fastapi import APIRouter, Header, Query
from pydantic import BaseModel
from agents.cover_letter_agent import CoverLetterAgent
from models.cover_letter import CoverLetterQuestion
from services.openai_client import get_openai_client
from services.cover_letter_history_storage import CoverLetterHistoryStorage
from services.profile_storage import ProfileStorage

router = APIRouter()
history_storage = CoverLetterHistoryStorage()
profile_storage = ProfileStorage()


class AnswerRequest(BaseModel):
    question: str
    max_length: int = 500
    job_description: str = ""
    username: str = ""
    primary_resume: dict | None = None
    primary_career_desc: dict | None = None


class RefineRequest(BaseModel):
    question: str
    max_length: int = 500
    job_description: str = ""
    username: str = ""
    current_answer: str
    chat_history: list[dict]
    primary_resume: dict | None = None
    primary_career_desc: dict | None = None


class SaveRequest(BaseModel):
    username: str
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
def generate_answer(req: AnswerRequest, x_api_key: str = Header(...)):
    client = get_openai_client(x_api_key)
    agent = CoverLetterAgent(client)
    q = CoverLetterQuestion(question=req.question, max_length=req.max_length)
    resume_text = _load_resume_text(req.username)

    answer = agent.answer_question(
        question=q,
        job_description=req.job_description,
        resume_text=resume_text,
        primary_resume=req.primary_resume,
        primary_career_desc=req.primary_career_desc,
    )
    return answer.model_dump()


@router.post("/refine")
def refine_answer(req: RefineRequest, x_api_key: str = Header(...)):
    client = get_openai_client(x_api_key)
    agent = CoverLetterAgent(client)
    resume_text = _load_resume_text(req.username)

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
def save_cover_letter(req: SaveRequest):
    record = history_storage.save(req.username, {
        "company": req.company,
        "job_description": req.job_description,
        "answers": req.answers,
    })
    return record


@router.get("/history")
def get_history(username: str = Query(...)):
    return history_storage.load(username)


class UpdateRequest(BaseModel):
    username: str
    company: str | None = None
    job_description: str | None = None
    answers: list[dict] | None = None


@router.put("/history/{record_id}")
def update_history(record_id: str, req: UpdateRequest):
    updated_fields = {}
    if req.company is not None:
        updated_fields["company"] = req.company
    if req.job_description is not None:
        updated_fields["job_description"] = req.job_description
    if req.answers is not None:
        updated_fields["answers"] = req.answers
    result = history_storage.update(req.username, record_id, updated_fields)
    if result is None:
        return {"success": False, "message": "기록을 찾을 수 없습니다."}
    return result


@router.delete("/history/{record_id}")
def delete_history(record_id: str, username: str = Query(...)):
    deleted = history_storage.delete(username, record_id)
    if not deleted:
        return {"success": False, "message": "기록을 찾을 수 없습니다."}
    return {"success": True}
