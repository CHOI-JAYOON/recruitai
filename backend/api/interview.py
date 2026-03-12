from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from agents.interview_coach_agent import InterviewCoachAgent
from models.interview import InterviewQuestion
from services.openai_client import get_openai_client, get_user_openai_client
from services.auth import AuthService
from services.storage import StorageService
from services.interview_history_storage import InterviewHistoryStorage
from services.jwt_service import get_current_user
from services.subscription import usage_tracker

router = APIRouter()
storage = StorageService()
history_storage = InterviewHistoryStorage()
auth_service = AuthService()


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
    job_description: str = ""
    questions: list[dict] = []
    feedbacks: list[dict] = []
    avg_score: float = 0


@router.post("/generate-questions")
def generate_questions(req: GenQuestionsRequest, current_user: dict = Depends(get_current_user)):
    user_key = auth_service.get_user_api_key(current_user["username"])
    if user_key:
        client = get_user_openai_client(user_key)
    else:
        usage_tracker.check_and_increment(current_user["username"], "interview_set", current_user["plan"], current_user["role"])
        client = get_openai_client()
    portfolios = storage.load_all(username=current_user["username"])
    agent = InterviewCoachAgent(client)
    questions = agent.generate_questions(
        portfolios, req.job_description, req.count,
        req.cover_letter_answers, req.resume_summary,
        req.career_description,
    )
    return [q.model_dump() for q in questions]


@router.post("/evaluate")
def evaluate_answer(req: EvalRequest, current_user: dict = Depends(get_current_user)):
    user_key = auth_service.get_user_api_key(current_user["username"])
    if user_key:
        client = get_user_openai_client(user_key)
    else:
        usage_tracker.check_and_increment(current_user["username"], "interview_eval", current_user["plan"], current_user["role"])
        client = get_openai_client()
    portfolios = storage.load_all(username=current_user["username"])
    agent = InterviewCoachAgent(client)
    feedback = agent.evaluate_answer(req.question, req.user_answer, portfolios)
    return feedback.model_dump()


@router.post("/save-session")
def save_session(req: SaveSessionRequest, current_user: dict = Depends(get_current_user)):
    record = {
        "job_description": req.job_description,
        "questions": req.questions,
        "feedbacks": req.feedbacks,
        "avg_score": req.avg_score,
    }
    saved = history_storage.save(current_user["username"], record)
    return saved


@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    return history_storage.load(current_user["username"])


@router.delete("/history/{record_id}")
def delete_history(record_id: str, current_user: dict = Depends(get_current_user)):
    deleted = history_storage.delete(current_user["username"], record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
    return {"message": "삭제됨"}
