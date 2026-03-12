"""
구독 시스템: 플랜별 사용량 제한 + 사용량 추적
"""

import json
from datetime import datetime
from fastapi import HTTPException
from config.settings import DATA_DIR
from services.json_db import SmartPath

# ── 플랜별 월간 한도 ──────────────────────────────
PLAN_LIMITS = {
    "free": {
        "resume_generate": 3,
        "cover_letter": 5,
        "career_desc": 2,
        "interview_set": 3,
        "interview_eval": 10,
        "portfolio_parse": 5,
    },
    "pro": {
        "resume_generate": 30,
        "cover_letter": 50,
        "career_desc": 30,
        "interview_set": 20,
        "interview_eval": 100,
        "portfolio_parse": 50,
    },
    "max": {
        "resume_generate": 100,
        "cover_letter": 200,
        "career_desc": 100,
        "interview_set": 50,
        "interview_eval": 300,
        "portfolio_parse": 200,
    },
}

# 카테고리 한국어 이름 (에러 메시지용)
CATEGORY_LABELS = {
    "resume_generate": "이력서 생성",
    "cover_letter": "자소서 답변",
    "career_desc": "경력기술서 생성",
    "interview_set": "면접 질문 생성",
    "interview_eval": "면접 평가",
    "portfolio_parse": "포트폴리오 파싱",
}


class UsageTracker:
    """월간 사용량을 json_store에 저장/추적"""

    def _get_path(self, username: str) -> SmartPath:
        month = datetime.now().strftime("%Y-%m")
        return SmartPath(DATA_DIR / f"usage_{username}_{month}.json", "{}")

    def get_usage(self, username: str) -> dict:
        """현재 월의 전체 사용량 반환"""
        path = self._get_path(username)
        data = json.loads(path.read_text())
        return data

    def increment(self, username: str, category: str) -> int:
        """카운터 증가 후 새 값 반환"""
        path = self._get_path(username)
        data = json.loads(path.read_text())
        data[category] = data.get(category, 0) + 1
        path.write_text(json.dumps(data, ensure_ascii=False))
        return data[category]

    def check_and_increment(self, username: str, category: str, plan: str, role: str):
        """
        한도 초과 시 HTTPException(403) raise.
        admin은 무제한.
        """
        # 관리자는 무제한
        if role == "admin":
            self.increment(username, category)
            return

        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        limit = limits.get(category, 0)

        path = self._get_path(username)
        data = json.loads(path.read_text())
        current = data.get(category, 0)

        if current >= limit:
            label = CATEGORY_LABELS.get(category, category)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "usage_limit_exceeded",
                    "message": f"{label} 월간 사용 한도({limit}회)를 초과했습니다.",
                    "category": category,
                    "limit": limit,
                    "used": current,
                    "plan": plan,
                },
            )

        # 증가
        data[category] = current + 1
        path.write_text(json.dumps(data, ensure_ascii=False))


# 싱글턴 인스턴스
usage_tracker = UsageTracker()
