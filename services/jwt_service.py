import os
import jwt
import time
from fastapi import Header, HTTPException, Depends


JWT_SECRET = os.getenv("JWT_SECRET", "recruitai-secret-change-in-production-!@#$%")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 60 * 60 * 24 * 7  # 7 days


def create_token(username: str, display_name: str = "", email: str = "", provider: str = "local", role: str = "user", plan: str = "free") -> str:
    payload = {
        "sub": username,
        "display_name": display_name,
        "email": email,
        "provider": provider,
        "role": role,
        "plan": plan,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRATION,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다. 다시 로그인해주세요.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")


def get_current_user(authorization: str = Header(default="")) -> dict:
    """FastAPI dependency to extract current user from JWT token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    # Support "Bearer <token>" format
    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization[7:]

    payload = verify_token(token)
    return {
        "username": payload["sub"],
        "display_name": payload.get("display_name", ""),
        "email": payload.get("email", ""),
        "provider": payload.get("provider", "local"),
        "role": payload.get("role", "user"),
        "plan": payload.get("plan", "free"),
    }
