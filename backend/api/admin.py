from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from services.auth import AuthService
from services.jwt_service import get_current_user
from services.subscription import usage_tracker
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
auth_service = AuthService()


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """관리자 권한 체크 dependency"""
    if current_user.get("role") != "admin":
        # JWT에 role이 없을 수 있으므로 DB에서 재확인
        user_info = auth_service.get_user_info(current_user["username"])
        if not user_info or user_info.get("role") != "admin":
            raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
        current_user["role"] = user_info["role"]
        current_user["plan"] = user_info["plan"]
    return current_user


class UpdatePlanRequest(BaseModel):
    plan: str  # "free", "pro", "max"


class UpdateRoleRequest(BaseModel):
    role: str  # "user", "admin"


@router.get("/users")
@limiter.limit("30/minute")
def list_users(request: Request, admin: dict = Depends(require_admin)):
    """전체 유저 목록 + 사용량"""
    users = auth_service.list_all_users()
    for user in users:
        user["usage"] = usage_tracker.get_usage(user["username"])
    return users


@router.put("/users/{username}/plan")
@limiter.limit("10/minute")
def update_user_plan(request: Request, username: str, req: UpdatePlanRequest, admin: dict = Depends(require_admin)):
    """유저 플랜 변경"""
    if req.plan not in ("free", "pro", "max"):
        raise HTTPException(status_code=400, detail="유효하지 않은 플랜입니다. (free, pro, max)")
    success = auth_service.update_user_plan(username, req.plan)
    if not success:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return {"message": f"{username}의 플랜이 {req.plan}으로 변경되었습니다."}


@router.put("/users/{username}/role")
@limiter.limit("10/minute")
def update_user_role(request: Request, username: str, req: UpdateRoleRequest, admin: dict = Depends(require_admin)):
    """유저 역할 변경"""
    if req.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="유효하지 않은 역할입니다. (user, admin)")
    success = auth_service.update_user_role(username, req.role)
    if not success:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return {"message": f"{username}의 역할이 {req.role}으로 변경되었습니다."}
