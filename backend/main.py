import os
import sys
from pathlib import Path

# Add project root to path so we can import agents, models, services, config
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import auth, portfolios, profile, resume, cover_letter, interview, applications, career_description

app = FastAPI(title="RecruitAI API", version="1.0.0", redirect_slashes=False)

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
# Add Vercel production domain from env
vercel_url = os.getenv("FRONTEND_URL", "")
if vercel_url:
    allowed_origins.append(vercel_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(portfolios.router, prefix="/api/portfolios", tags=["portfolios"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(cover_letter.router, prefix="/api/cover-letter", tags=["cover-letter"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(career_description.router, prefix="/api/career-description", tags=["career-description"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
