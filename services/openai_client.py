from functools import lru_cache
from openai import OpenAI


@lru_cache(maxsize=4)
def get_openai_client(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key)
