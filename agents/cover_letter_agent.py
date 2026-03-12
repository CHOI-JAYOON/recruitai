from agents.base_agent import BaseAgent
from models.cover_letter import CoverLetterQuestion, CoverLetterAnswer


class CoverLetterAgent(BaseAgent):
    def __init__(self, client, model="gpt-4.1-mini"):
        super().__init__(client, model)

    @property
    def system_prompt(self) -> str:
        return (
            "당신은 자기소개서 작성 도우미입니다. "
            "사용자의 이력서 데이터(요약, 프로젝트별 설명 및 성과)를 기반으로 "
            "설득력 있고 구체적인 자기소개서 답변을 작성합니다. "
            "실제 프로젝트명, 기술 스택, 수치화된 성과를 적극 활용하세요. "
            "수정 요청 시, 기존 답변의 전체 구조를 유지하면서 요청된 부분만 개선하세요. "
            "수정된 전체 답변만 출력하고, 설명이나 부연은 포함하지 마세요. "
            "지정된 글자 수 제한을 지켜주세요. "
            "모든 응답은 한국어로 작성하세요."
        )

    def _format_primary_resume(self, primary_resume: dict) -> str:
        text = f"\n\n대표 이력서 (지원 직무: {primary_resume.get('target_role', '')}):"
        text += f"\n요약: {primary_resume.get('summary', '')}"
        for entry in primary_resume.get("entries", []):
            text += f"\n\n프로젝트: {entry.get('tailored_description', '')}"
            achievements = entry.get("tailored_achievements", [])
            if achievements:
                text += f"\n성과: {'; '.join(achievements)}"
        return text

    def _format_primary_career_desc(self, career_desc: dict) -> str:
        text = f"\n\n대표 경력기술서 (지원 직무: {career_desc.get('target_role', '')}):"
        if career_desc.get("summary"):
            text += f"\n경력 요약: {career_desc['summary']}"
        for entry in career_desc.get("entries", []):
            text += f"\n\n{entry.get('company', '')} · {entry.get('position', '')} ({entry.get('period', '')})"
            if entry.get("description"):
                text += f"\n{entry['description'][:200]}"
            for ach in entry.get("key_achievements", [])[:3]:
                text += f"\n• {ach}"
        return text

    def answer_question(
        self,
        question: CoverLetterQuestion,
        job_description: str = "",
        resume_text: str = "",
        primary_resume: dict | None = None,
        primary_career_desc: dict | None = None,
    ) -> CoverLetterAnswer:
        prompt = f"자기소개서 문항: {question.question}\n글자 수 제한: 약 {question.max_length}자"
        if job_description:
            prompt += f"\n\n참고 - 직무 설명:\n{job_description}"
        if primary_resume:
            prompt += self._format_primary_resume(primary_resume)
        elif resume_text:
            prompt += f"\n\n참고 - 지원자 이력서:\n{resume_text}"
        if primary_career_desc:
            prompt += self._format_primary_career_desc(primary_career_desc)

        messages = [{"role": "user", "content": prompt}]
        response = self._call_llm_with_tools(messages, tools=[])
        answer_text = response.choices[0].message.content

        return CoverLetterAnswer(
            question=question.question,
            answer=answer_text or "",
            relevant_portfolios=[],
        )

    def refine_answer(
        self,
        question: str,
        max_length: int,
        job_description: str = "",
        resume_text: str = "",
        primary_resume: dict | None = None,
        primary_career_desc: dict | None = None,
        current_answer: str = "",
        chat_history: list[dict] | None = None,
    ) -> str:
        context = f"자기소개서 문항: {question}\n글자 수 제한: 약 {max_length}자"
        if job_description:
            context += f"\n\n직무 설명:\n{job_description}"
        if primary_resume:
            context += self._format_primary_resume(primary_resume)
        elif resume_text:
            context += f"\n\n지원자 이력서:\n{resume_text}"
        if primary_career_desc:
            context += self._format_primary_career_desc(primary_career_desc)
        context += f"\n\n현재 작성된 답변:\n{current_answer}"
        context += "\n\n위 답변을 사용자의 요청에 따라 수정해주세요. 수정된 전체 답변만 출력하세요."

        messages = [{"role": "user", "content": context}]
        if chat_history:
            for msg in chat_history:
                messages.append({"role": msg["role"], "content": msg["content"]})

        response = self._call_llm_with_tools(messages, tools=[])
        return response.choices[0].message.content or ""
