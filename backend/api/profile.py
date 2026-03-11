from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Depends
from models.user_profile import UserProfile
from services.profile_storage import ProfileStorage
from services.file_parser import extract_text
from services.openai_client import get_openai_client
from services.jwt_service import get_current_user
from agents.resume_parser_agent import ResumeParserAgent
import base64
import os

router = APIRouter()
profile_storage = ProfileStorage()

MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5MB
MAX_RESUME_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_RESUME_EXTS = {"pdf", "docx", "txt"}


@router.get("/{username}")
def get_profile(username: str, current_user: dict = Depends(get_current_user)):
    if username != current_user["username"]:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return profile_storage.load(username)


@router.put("/{username}")
def save_profile(username: str, profile: UserProfile, current_user: dict = Depends(get_current_user)):
    if username != current_user["username"]:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    profile_storage.save(username, profile)
    return {"message": "저장됨"}


@router.post("/{username}/photo")
async def upload_photo(username: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if username != current_user["username"]:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    # File extension validation
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail=f"허용된 이미지 형식: {', '.join(ALLOWED_IMAGE_EXTS)}")
    contents = await file.read()
    # File size validation
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=413, detail="이미지 파일은 5MB 이하여야 합니다.")
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
    b64 = base64.b64encode(contents).decode()
    data_url = f"data:{mime};base64,{b64}"
    profile_data = profile_storage.load(username)
    profile = UserProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
    profile.photo_url = data_url
    profile_storage.save(username, profile)
    return {"photo_url": data_url}


@router.post("/{username}/parse-resume")
async def parse_resume(
    username: str,
    file: UploadFile = File(...),
    x_api_key: str = Header(...),
    current_user: dict = Depends(get_current_user),
):
    if username != current_user["username"]:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    # File extension validation
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_RESUME_EXTS:
        raise HTTPException(status_code=400, detail=f"허용된 파일 형식: {', '.join(ALLOWED_RESUME_EXTS)}")
    contents = await file.read()
    # File size validation
    if len(contents) > MAX_RESUME_SIZE:
        raise HTTPException(status_code=413, detail="파일은 10MB 이하여야 합니다.")
    try:
        text = extract_text(contents, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=400, detail="파일에서 텍스트를 추출할 수 없습니다.")

    max_chars = 20000
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n[이하 생략 - 텍스트가 너무 길어 앞부분만 분석합니다]"

    client = get_openai_client(x_api_key)
    agent = ResumeParserAgent(client)
    result = agent.parse(text)
    return result.model_dump()
