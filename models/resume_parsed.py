from pydantic import BaseModel, Field
from models.user_profile import Education, WorkExperience, Certificate, Award, Training
from models.portfolio import Portfolio


class ParsedResume(BaseModel):
    name: str = Field(default="", description="이름")
    email: str = Field(default="", description="이메일")
    phone: str = Field(default="", description="전화번호")
    github: str = Field(default="", description="GitHub URL")
    linkedin: str = Field(default="", description="LinkedIn URL")
    blog: str = Field(default="", description="블로그 URL")
    summary: str = Field(default="", description="자기소개 요약")
    education: list[Education] = Field(default_factory=list, description="학력")
    work_experience: list[WorkExperience] = Field(default_factory=list, description="경력")
    certificates: list[Certificate] = Field(default_factory=list, description="자격증")
    awards: list[Award] = Field(default_factory=list, description="수상")
    trainings: list[Training] = Field(default_factory=list, description="교육 이수")
    portfolios: list[Portfolio] = Field(default_factory=list, description="포트폴리오/경력 프로젝트")
