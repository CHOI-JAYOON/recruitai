from openai import OpenAI


def get_openai_client(api_key: str) -> OpenAI:
    """Create a new OpenAI client per request. No caching to avoid leaking API keys in memory."""
    return OpenAI(api_key=api_key)
