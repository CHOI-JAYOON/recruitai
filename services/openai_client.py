import os
from openai import OpenAI

_client = None


def get_openai_client() -> OpenAI:
    """서버 환경변수의 OPENAI_API_KEY를 사용하는 싱글턴 OpenAI 클라이언트."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        _client = OpenAI(api_key=api_key)
    return _client


def get_user_openai_client(api_key: str) -> OpenAI:
    """유저 본인의 API Key로 임시 OpenAI 클라이언트 생성."""
    return OpenAI(api_key=api_key)
