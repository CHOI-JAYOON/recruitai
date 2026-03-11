import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
CHROMA_DB_PATH = DATA_DIR / "chromadb"
PORTFOLIOS_JSON_PATH = DATA_DIR / "portfolios.json"
USERS_JSON_PATH = DATA_DIR / "users.json"
PROFILE_JSON_PATH = DATA_DIR / "profiles.json"
RESUME_HISTORY_JSON_PATH = DATA_DIR / "resume_history.json"
COVER_LETTER_HISTORY_JSON_PATH = DATA_DIR / "cover_letter_history.json"
APPLICATIONS_JSON_PATH = DATA_DIR / "applications.json"
CAREER_DESC_HISTORY_JSON_PATH = DATA_DIR / "career_desc_history.json"
INTERVIEW_HISTORY_JSON_PATH = DATA_DIR / "interview_history.json"

DEFAULT_MODEL = "gpt-4o"
EMBEDDING_MODEL = "text-embedding-3-small"

CHROMA_COLLECTION_NAME = "portfolios"

# OAuth
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID", "")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:5173/oauth/callback/kakao")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")
NAVER_REDIRECT_URI = os.getenv("NAVER_REDIRECT_URI", "http://localhost:5173/oauth/callback/naver")
