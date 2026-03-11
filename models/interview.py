from pydantic import BaseModel, Field


class InterviewQuestion(BaseModel):
    question: str
    category: str = Field(
        description="'technical' (기술면접), 'behavioral' (인성면접), "
        "'situational' (상황면접), 'portfolio' (포트폴리오 기반), "
        "'resume' (이력서 기반), 'solution' (솔루션/비즈니스)"
    )
    difficulty: str = Field(description="'easy', 'medium', 'hard'")
    suggested_portfolio_id: str | None = Field(
        default=None, description="관련 포트폴리오 ID"
    )


class InterviewQuestionSet(BaseModel):
    questions: list[InterviewQuestion]


class InterviewFeedback(BaseModel):
    strengths: list[str]
    improvements: list[str]
    score: int = Field(ge=1, le=10)
    revised_answer: str = Field(description="개선된 모범 답변")


class InterviewSession(BaseModel):
    id: str = ""
    job_description: str = ""
    questions: list[dict] = Field(default_factory=list)
    feedbacks: list[dict] = Field(default_factory=list)
    avg_score: float = 0
    created_at: str = ""
