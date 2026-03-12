import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from services.auth import AuthService
from services.jwt_service import create_token, get_current_user
from services.subscription import usage_tracker
from slowapi import Limiter
from slowapi.util import get_remote_address
from config.settings import (
    KAKAO_CLIENT_ID, KAKAO_REDIRECT_URI,
    NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, NAVER_REDIRECT_URI,
)

router = APIRouter()
auth_service = AuthService()
limiter = Limiter(key_func=get_remote_address)


class LoginRequest(BaseModel):
    username: str = Field(max_length=30)
    password: str = Field(max_length=128)


class RegisterRequest(BaseModel):
    username: str = Field(max_length=30)
    password: str = Field(max_length=128)
    display_name: str = Field(max_length=50)
    email: str = Field(default="", max_length=254)


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest):
    user = auth_service.login(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
    token = create_token(user["username"], user["display_name"], user.get("email", ""), user.get("provider", "local"), user.get("role", "user"), user.get("plan", "free"))
    return {**user, "token": token}


@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, req: RegisterRequest):
    import re
    if len(req.username) > 30 or not re.match(r'^[a-zA-Z0-9_]+$', req.username):
        raise HTTPException(status_code=400, detail="아이디는 영문, 숫자, 밑줄만 사용 가능합니다 (최대 30자).")
    if len(req.password) < 8 or not re.search(r'[a-zA-Z]', req.password) or not re.search(r'\d', req.password):
        raise HTTPException(status_code=400, detail="비밀번호는 영문+숫자 포함 8자 이상이어야 합니다.")
    if len(req.display_name) > 50:
        raise HTTPException(status_code=400, detail="닉네임은 50자 이하여야 합니다.")
    success = auth_service.register(req.username, req.password, req.display_name, req.email)
    if not success:
        raise HTTPException(status_code=409, detail="이미 존재하는 아이디입니다.")
    user_info = auth_service.get_user_info(req.username)
    role = user_info["role"] if user_info else "user"
    plan = user_info["plan"] if user_info else "free"
    token = create_token(req.username, req.display_name, req.email, "local", role, plan)
    return {"message": "회원가입 완료", "token": token, "username": req.username, "display_name": req.display_name, "email": req.email, "role": role, "plan": plan}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UpdateDisplayNameRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)


@router.put("/change-password")
def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    import re
    if len(req.new_password) < 8 or not re.search(r'[a-zA-Z]', req.new_password) or not re.search(r'\d', req.new_password):
        raise HTTPException(status_code=400, detail="비밀번호는 영문+숫자 포함 8자 이상이어야 합니다.")
    success = auth_service.change_password(current_user["username"], req.current_password, req.new_password)
    if not success:
        raise HTTPException(status_code=401, detail="현재 비밀번호가 올바르지 않습니다.")
    return {"message": "비밀번호가 변경되었습니다."}


@router.put("/display-name")
def update_display_name(req: UpdateDisplayNameRequest, current_user: dict = Depends(get_current_user)):
    if not req.display_name.strip():
        raise HTTPException(status_code=400, detail="닉네임을 입력해주세요.")
    result = auth_service.update_display_name(current_user["username"], req.display_name.strip())
    if not result:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return result


class FindUsernameRequest(BaseModel):
    display_name: str
    email: str


class ResetPasswordRequest(BaseModel):
    username: str
    display_name: str
    email: str
    new_password: str


class CheckUsernameRequest(BaseModel):
    username: str


@router.post("/check-username")
@limiter.limit("20/minute")
def check_username(request: Request, req: CheckUsernameRequest):
    exists = auth_service.user_exists(req.username)
    return {"exists": exists}


@router.post("/find-username")
@limiter.limit("5/minute")
def find_username(request: Request, req: FindUsernameRequest):
    result = auth_service.find_by_name_and_email(req.display_name, req.email)
    if not result:
        raise HTTPException(status_code=404, detail="이름과 이메일이 일치하는 계정을 찾을 수 없습니다.")
    return {"username": result}


@router.post("/reset-password")
@limiter.limit("3/minute")
def reset_password(request: Request, req: ResetPasswordRequest):
    import re
    if len(req.new_password) < 8 or not re.search(r'[a-zA-Z]', req.new_password) or not re.search(r'\d', req.new_password):
        raise HTTPException(status_code=400, detail="비밀번호는 영문+숫자 포함 8자 이상이어야 합니다.")
    success = auth_service.reset_password_with_email(req.username, req.display_name, req.email, req.new_password)
    if not success:
        raise HTTPException(status_code=404, detail="입력하신 정보가 일치하지 않습니다.")
    return {"message": "비밀번호가 재설정되었습니다."}


# ── OAuth ──

@router.get("/oauth/config")
def oauth_config():
    return {
        "kakao_client_id": KAKAO_CLIENT_ID,
        "kakao_redirect_uri": KAKAO_REDIRECT_URI,
        "naver_client_id": NAVER_CLIENT_ID,
        "naver_redirect_uri": NAVER_REDIRECT_URI,
    }


class OAuthKakaoRequest(BaseModel):
    code: str


@router.post("/oauth/kakao")
async def oauth_kakao(req: OAuthKakaoRequest):
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=400, detail="카카오 로그인이 설정되지 않았습니다.")
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": KAKAO_CLIENT_ID,
                "redirect_uri": KAKAO_REDIRECT_URI,
                "code": req.code,
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="카카오 인증에 실패했습니다.")
        access_token = token_res.json().get("access_token")

        user_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="카카오 사용자 정보를 가져올 수 없습니다.")
        kakao_user = user_res.json()

    provider_id = str(kakao_user["id"])
    kakao_account = kakao_user.get("kakao_account", {})
    email = kakao_account.get("email", "")
    nickname = kakao_account.get("profile", {}).get("nickname", f"kakao_{provider_id}")

    user = auth_service.find_or_create_oauth_user("kakao", provider_id, email, nickname)
    token = create_token(user["username"], user["display_name"], user.get("email", ""), "kakao", user.get("role", "user"), user.get("plan", "free"))
    return {**user, "token": token}


class OAuthNaverRequest(BaseModel):
    code: str
    state: str


@router.post("/oauth/naver")
async def oauth_naver(req: OAuthNaverRequest):
    if not NAVER_CLIENT_ID:
        raise HTTPException(status_code=400, detail="네이버 로그인이 설정되지 않았습니다.")
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://nid.naver.com/oauth2.0/token",
            data={
                "grant_type": "authorization_code",
                "client_id": NAVER_CLIENT_ID,
                "client_secret": NAVER_CLIENT_SECRET,
                "code": req.code,
                "state": req.state,
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="네이버 인증에 실패했습니다.")
        access_token = token_res.json().get("access_token")

        user_res = await client.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="네이버 사용자 정보를 가져올 수 없습니다.")
        naver_data = user_res.json().get("response", {})

    provider_id = naver_data.get("id", "")
    email = naver_data.get("email", "")
    name = naver_data.get("name", naver_data.get("nickname", f"naver_{provider_id}"))

    user = auth_service.find_or_create_oauth_user("naver", provider_id, email, name)
    token = create_token(user["username"], user["display_name"], user.get("email", ""), "naver", user.get("role", "user"), user.get("plan", "free"))
    return {**user, "token": token}


# ── 유저 정보 + 사용량 ──

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """현재 유저 정보 + 이번 달 사용량 반환"""
    user_info = auth_service.get_user_info(current_user["username"])
    if not user_info:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    usage = usage_tracker.get_usage(current_user["username"])
    return {**user_info, "usage": usage}
