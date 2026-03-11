from agents.base_agent import BaseAgent
from models.portfolio import Portfolio
from models.interview import (
    InterviewQuestion,
    InterviewQuestionSet,
    InterviewFeedback,
)


class InterviewCoachAgent(BaseAgent):
    @property
    def system_prompt(self) -> str:
        return (
            "당신은 경험 많은 기술 면접관이자 커리어 코치입니다. "
            "현실적인 면접 질문을 생성하고, "
            "면접 답변에 대해 구체적이고 건설적인 피드백을 제공합니다. "
            "모든 응답은 한국어로 작성하세요."
        )

    def generate_questions(
        self,
        portfolios: list[Portfolio],
        job_description: str,
        count: int = 10,
        cover_letter_answers: list[dict] | None = None,
        resume_summary: str | None = None,
        career_description: dict | None = None,
    ) -> list[InterviewQuestion]:
        prompt = self._build_generation_prompt(
            portfolios, job_description, count, cover_letter_answers, resume_summary, career_description
        )
        result = self._call_llm_structured(
            user_message=prompt,
            response_model=InterviewQuestionSet,
        )
        return result.questions

    def evaluate_answer(
        self,
        question: InterviewQuestion,
        user_answer: str,
        portfolios: list[Portfolio],
    ) -> InterviewFeedback:
        prompt = self._build_evaluation_prompt(question, user_answer, portfolios)
        return self._call_llm_structured(
            user_message=prompt,
            response_model=InterviewFeedback,
        )

    def _build_generation_prompt(
        self,
        portfolios: list[Portfolio],
        job_description: str,
        count: int,
        cover_letter_answers: list[dict] | None = None,
        resume_summary: str | None = None,
        career_description: dict | None = None,
    ) -> str:
        portfolio_texts = []
        for p in portfolios:
            text = (
                f"- {p.title} ({p.role}, {p.period}): "
                f"{p.description[:200]}... "
                f"기술: {', '.join(p.tech_stack)}"
            )
            portfolio_texts.append(text)

        prompt = (
            f"직무 설명:\n{job_description}\n\n"
            f"지원자 포트폴리오:\n" + "\n".join(portfolio_texts) + "\n\n"
        )

        if cover_letter_answers:
            prompt += "자기소개서 답변:\n"
            for qa in cover_letter_answers:
                if qa.get("answer"):
                    prompt += f"Q: {qa['question']}\nA: {qa['answer'][:200]}...\n\n"

        if resume_summary:
            prompt += f"이력서 요약:\n{resume_summary}\n\n"

        if career_description:
            prompt += "경력기술서:\n"
            if career_description.get("summary"):
                prompt += f"경력 요약: {career_description['summary']}\n"
            if career_description.get("target_role"):
                prompt += f"지원 직무: {career_description['target_role']}\n"
            for entry in career_description.get("entries", []):
                prompt += (
                    f"- {entry.get('company', '')} · {entry.get('position', '')} ({entry.get('period', '')})\n"
                    f"  {entry.get('description', '')[:200]}\n"
                )
                for ach in entry.get("key_achievements", [])[:3]:
                    prompt += f"  • {ach}\n"
            prompt += "\n"

        prompt += (
            f"위 정보를 바탕으로 {count}개의 면접 질문을 생성해주세요.\n\n"
            "다음 유형을 골고루 포함하세요:\n"
            "- technical: 직무 관련 기술 심층 질문\n"
            "- behavioral: 인성/행동 기반 질문\n"
            "- situational: 상황 대처 질문\n"
            "- portfolio: 포트폴리오 프로젝트에 대한 구체적 질문\n"
            "- resume: 이력서/경력 기반 질문\n"
            "- solution: 회사 솔루션/비즈니스 관련 질문\n\n"
            "난이도도 easy, medium, hard를 섞어주세요. "
            "각 질문에 가장 관련 있는 포트폴리오의 suggested_portfolio_id를 지정하세요. "
            "포트폴리오와 직접 관련 없는 일반 질문은 suggested_portfolio_id를 null로 두세요."
        )

        return prompt

    def _build_evaluation_prompt(
        self,
        question: InterviewQuestion,
        user_answer: str,
        portfolios: list[Portfolio],
    ) -> str:
        portfolio_context = ""
        if portfolios:
            portfolio_context = "\n\n지원자 배경:\n"
            for p in portfolios:
                portfolio_context += (
                    f"- {p.title}: {p.description[:150]}... "
                    f"성과: {'; '.join(p.achievements[:3])}\n"
                )

        return (
            f"면접 질문 [{question.category}/{question.difficulty}]:\n"
            f"{question.question}\n\n"
            f"지원자 답변:\n{user_answer}"
            f"{portfolio_context}\n\n"
            "위 답변을 평가해주세요. "
            "강점, 개선점, 10점 만점 점수, 개선된 모범 답변을 제공하세요."
        )
