from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class Portfolio(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str = Field(default="", description="소유자 username")
    title: str = Field(description="프로젝트 제목")
    company: str = Field(default="", description="회사명 (경력 타입 전용)")
    type: str = Field(default="portfolio", description="portfolio 또는 career")
    category: str = Field(default="개인 프로젝트", description="세부 카테고리")
    period: str = Field(default="", description="기간, 예: '2023.03 - 2023.12'")
    role: str = Field(default="", description="역할/내가 한 일")
    description: str = Field(default="", description="프로젝트 상세 설명")
    tech_stack: list[str] = Field(default_factory=list, description="사용 기술")
    achievements: list[str] = Field(default_factory=list, description="주요 성과")
    links: list[str] = Field(default_factory=list, description="관련 URL")
    team_size: str = Field(default="", description="팀 규모 (예: 5명)")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ParsedPortfolios(BaseModel):
    portfolios: list[Portfolio] = Field(description="파싱된 포트폴리오 목록")
