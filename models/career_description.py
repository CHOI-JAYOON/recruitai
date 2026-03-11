from pydantic import BaseModel, Field


class CareerDescriptionEntry(BaseModel):
    company: str = Field(description="회사명")
    position: str = Field(description="직책/직무")
    period: str = Field(description="근무 기간")
    description: str = Field(description="지원 직무에 맞게 최적화된 업무 설명")
    key_achievements: list[str] = Field(default_factory=list, description="핵심 성과 목록")
    relevant_projects: list[str] = Field(default_factory=list, description="관련 프로젝트 설명")


class CareerDescription(BaseModel):
    summary: str = Field(description="경력 요약 (3-5줄)")
    target_role: str = Field(description="지원 직무")
    entries: list[CareerDescriptionEntry] = Field(default_factory=list)
