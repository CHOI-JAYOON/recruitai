from fastapi import APIRouter, UploadFile, File
from models.user_profile import UserProfile
from services.profile_storage import ProfileStorage
import base64
import os

router = APIRouter()
profile_storage = ProfileStorage()


@router.get("/{username}")
def get_profile(username: str):
    return profile_storage.load(username)


@router.put("/{username}")
def save_profile(username: str, profile: UserProfile):
    profile_storage.save(username, profile)
    return {"message": "저장됨"}


@router.post("/{username}/photo")
async def upload_photo(username: str, file: UploadFile = File(...)):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode()
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
    data_url = f"data:{mime};base64,{b64}"
    profile_data = profile_storage.load(username)
    profile = UserProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
    profile.photo_url = data_url
    profile_storage.save(username, profile)
    return {"photo_url": data_url}
