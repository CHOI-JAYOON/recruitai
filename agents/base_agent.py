from abc import ABC, abstractmethod
from openai import OpenAI
from pydantic import BaseModel
from typing import Type


class BaseAgent(ABC):
    def __init__(self, client: OpenAI, model: str = "gpt-4.1-mini"):
        self.client = client
        self.model = model

    @property
    @abstractmethod
    def system_prompt(self) -> str: ...

    def _call_llm(self, user_message: str, **kwargs) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_message},
            ],
            **kwargs,
        )
        return response.choices[0].message.content

    def _call_llm_structured(
        self, user_message: str, response_model: Type[BaseModel], **kwargs
    ) -> BaseModel:
        kwargs.setdefault("temperature", 0.7)
        response = self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_message},
            ],
            response_format=response_model,
            **kwargs,
        )
        return response.choices[0].message.parsed

    def _call_llm_with_tools(self, messages: list, tools: list, **kwargs):
        full_messages = [
            {"role": "system", "content": self.system_prompt},
            *messages,
        ]
        response = self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            tools=tools,
            **kwargs,
        )
        return response
