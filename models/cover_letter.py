from pydantic import BaseModel, Field


class CoverLetterQuestion(BaseModel):
    question: str
    max_length: int = Field(default=500, description="대략적인 글자 수 제한")


class CoverLetterAnswer(BaseModel):
    question: str
    answer: str
    relevant_portfolios: list[str] = Field(
        default_factory=list, description="참조된 포트폴리오 ID 목록"
    )
