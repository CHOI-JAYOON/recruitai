from pydantic import BaseModel, Field


class WorkProject(BaseModel):
    name: str = ""
    description: str = ""
    period: str = ""


class Education(BaseModel):
    school_type: str = "대학교"  # 고등학교, 대학교, 대학원
    school: str = ""
    major: str = ""
    degree: str = ""
    start_date: str = ""
    end_date: str = ""
    gpa: str = ""
    gpa_scale: str = "4.5"


class WorkExperience(BaseModel):
    company: str = ""
    team: str = ""
    position: str = ""
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    description: str = ""
    projects: list[WorkProject] = []


class Certificate(BaseModel):
    name: str = ""
    issuer: str = ""
    date: str = ""


class Award(BaseModel):
    name: str = ""
    issuer: str = ""
    date: str = ""
    description: str = ""


class Training(BaseModel):
    name: str = ""
    institution: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""


class UserProfile(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    github: str = ""
    linkedin: str = ""
    blog: str = ""
    photo_url: str = Field(default="", description="증명사진 URL/base64")
    summary: str = Field(default="", description="자기소개 요약")
    resume_text: str = Field(default="", description="최종 이력서 텍스트")
    education: list[Education] = []
    work_experience: list[WorkExperience] = []
    certificates: list[Certificate] = []
    awards: list[Award] = []
    trainings: list[Training] = []
