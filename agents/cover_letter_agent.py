from agents.base_agent import BaseAgent
from models.cover_letter import CoverLetterQuestion, CoverLetterAnswer


class CoverLetterAgent(BaseAgent):
    def __init__(self, client, model="gpt-4.1-mini"):
        super().__init__(client, model)

    @property
    def system_prompt(self) -> str:
        return (
            "당신은 한국 기업 자기소개서 전문 컨설턴트입니다. "
            "대기업·중견기업 합격 자소서 수천 건을 분석한 전문가로서 작성합니다.\n\n"

            "[핵심 원칙]\n"
            "1. 두괄식 작성: 핵심 메시지 → 구체적 근거 → 마무리\n"
            "2. STAR 기법 활용: Situation(상황) → Task(과제) → Action(행동) → Result(결과)\n"
            "3. 글자 수 ±10% 이내 엄격 준수\n"
            "4. 추상적 표현 금지 (\"열심히\", \"최선을 다해\", \"노력했습니다\" → 구체적 행동과 수치로 대체)\n\n"

            "[문항 유형별 작성 가이드]\n"
            "• 성장과정/자기소개: 핵심 경험 1~2개 선정 → 경험에서 얻은 교훈 → 지원 직무와의 연결\n"
            "• 지원동기: 해당 기업/직무를 연구한 내용 + 본인 강점·경험과의 매칭 + 기여 방향\n"
            "• 직무역량/경험: STAR 기법으로 프로젝트·업무 경험 서술 → 역할과 기여도 명시 → 수치 성과\n"
            "• 입사 후 포부: 단기 목표(입사 1년 내) + 중기 목표(3년) → 구체적이고 실현 가능해야 함\n"
            "• 장단점: 직무 관련 강점(구체적 사례) + 단점(개선 노력과 성과 포함)\n\n"

            "[구조]\n"
            "- 서두(전체의 20%): 핵심 메시지를 한 문장으로 제시\n"
            "- 본문(전체의 60%): STAR 기법으로 구체적 경험 서술\n"
            "- 마무리(전체의 20%): 경험의 의미 + 직무/회사와의 연결\n\n"

            "[금지 사항]\n"
            "- 지나치게 겸손하거나 자만하는 표현\n"
            "- 검증 불가능한 막연한 주장\n"
            "- 다른 지원자와 차별화되지 않는 진부한 표현\n\n"

            "수정 요청 시, 기존 답변의 전체 구조를 유지하면서 요청된 부분만 개선하세요. "
            "수정된 전체 답변만 출력하고, 설명이나 부연은 포함하지 마세요. "
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

        answer_text = self._call_llm(prompt)

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

        if chat_history:
            for msg in chat_history:
                context += f"\n\n{msg['role']}: {msg['content']}"

        return self._call_llm(context) or ""
