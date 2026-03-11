from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from agents.interview_coach_agent import InterviewCoachAgent
from models.interview import InterviewQuestion
from services.openai_client import get_openai_client
from services.storage import StorageService
from services.interview_history_storage import InterviewHistoryStorage

router = APIRouter()
storage = StorageService()
history_storage = InterviewHistoryStorage()


class GenQuestionsRequest(BaseModel):
    job_description: str
    count: int = 7
    cover_letter_answers: list[dict] | None = None
    resume_summary: str | None = None
    career_description: dict | None = None


class EvalRequest(BaseModel):
    question: InterviewQuestion
    user_answer: str


class SaveSessionRequest(BaseModel):
    username: str
    job_description: str = ""
    questions: list[dict] = []
    feedbacks: list[dict] = []
    avg_score: float = 0


@router.post("/generate-questions")
def generate_questions(req: GenQuestionsRequest, x_api_key: str = Header(...)):
    portfolios = storage.load_all()
    client = get_openai_client(x_api_key)
    agent = InterviewCoachAgent(client)
    questions = agent.generate_questions(
        portfolios, req.job_description, req.count,
        req.cover_letter_answers, req.resume_summary,
        req.career_description,
    )
    return [q.model_dump() for q in questions]


@router.post("/evaluate")
def evaluate_answer(req: EvalRequest, x_api_key: str = Header(...)):
    portfolios = storage.load_all()
    client = get_openai_client(x_api_key)
    agent = InterviewCoachAgent(client)
    feedback = agent.evaluate_answer(req.question, req.user_answer, portfolios)
    return feedback.model_dump()


@router.post("/save-session")
def save_session(req: SaveSessionRequest):
    record = {
        "job_description": req.job_description,
        "questions": req.questions,
        "feedbacks": req.feedbacks,
        "avg_score": req.avg_score,
    }
    saved = history_storage.save(req.username, record)
    return saved


@router.get("/history")
def get_history(username: str):
    return history_storage.load(username)


@router.delete("/history/{record_id}")
def delete_history(record_id: str, username: str):
    deleted = history_storage.delete(username, record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
    return {"message": "삭제됨"}
