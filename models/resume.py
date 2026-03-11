from pydantic import BaseModel, Field


class PersonalInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    github: str = ""
    linkedin: str = ""
    summary: str = Field(default="", description="자기소개 요약")


class TailoredEntry(BaseModel):
    portfolio_id: str
    tailored_description: str
    tailored_achievements: list[str]


class TailoredResume(BaseModel):
    summary: str = Field(description="지원 직무에 맞춘 전문 요약")
    entries: list[TailoredEntry]


class ResumeRequest(BaseModel):
    personal_info: PersonalInfo
    selected_portfolio_ids: list[str]
    target_role: str = Field(description="지원 직무")
    output_format: str = Field(default="docx", description="'docx' or 'pdf'")
