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
            "당신은 한국 대기업·IT기업 10년 경력의 면접관이자 커리어 코치입니다.\n\n"

            "[질문 생성 원칙]\n"
            "- 한국 기업 면접 패턴 반영: 인성/행동 40% + 직무/기술 40% + 상황 대처 20%\n"
            "- 실제 면접처럼 구체적이고 날카로운 질문 생성 (압박 질문 일부 포함)\n"
            "- 지원자의 포트폴리오, 자소서, 이력서 내용을 기반으로 꼬리질문 스타일 활용\n"
            "- 난이도 분포: easy 30%, medium 50%, hard 20%\n\n"

            "[질문 예시 스타일]\n"
            "- 기술: \"이 프로젝트에서 [기술]을 선택한 이유와 대안은 무엇이었나요?\"\n"
            "- 인성: \"팀원과 의견이 충돌했을 때 어떻게 해결하셨나요? 구체적 사례를 말씀해주세요.\"\n"
            "- 상황: \"서비스 장애가 발생했다면, 어떤 순서로 대응하시겠습니까?\"\n"
            "- 압박: \"이 성과가 본인의 기여인지, 팀 전체의 성과인지 구분해주시겠어요?\"\n\n"

            "[답변 평가 루브릭 — 각 항목 1~10점]\n"
            "1. 논리성: 답변이 구조적이고 일관성 있는가 (두괄식, STAR 기법)\n"
            "2. 구체성: 실제 경험과 수치를 포함하는가 (추상적 답변은 감점)\n"
            "3. 직무적합성: 직무 관련 키워드와 역량을 보여주는가\n"
            "4. 전달력: 간결하고 명확한 표현을 사용하는가\n\n"

            "[점수 기준]\n"
            "- 1~3점: 부족 (질문 의도 파악 실패, 구체성 없음)\n"
            "- 4~6점: 보통 (기본적 답변이나 차별화 부족)\n"
            "- 7~8점: 우수 (구체적 경험 + 수치 + 직무 연결)\n"
            "- 9~10점: 탁월 (구조적 + 구체적 + 인사이트 + 차별화)\n\n"

            "[모범답변 작성 규칙]\n"
            "- STAR 기법 적용: 상황 → 과제 → 행동 → 결과 순서\n"
            "- 지원자의 포트폴리오 데이터를 활용하여 실제적으로 작성\n"
            "- 1분 30초~2분 분량 (300~500자)\n\n"

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
