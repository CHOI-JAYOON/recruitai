from agents.base_agent import BaseAgent
from models.portfolio import Portfolio
from models.user_profile import UserProfile
from models.resume import TailoredResume


class ResumeWriterAgent(BaseAgent):
    @property
    def system_prompt(self) -> str:
        return (
            "당신은 한국 취업 시장에 특화된 전문 이력서 컨설턴트입니다.\n\n"

            "[Professional Summary 작성 규칙]\n"
            "- 3~5줄로 작성\n"
            "- 경력자: \"N년간 [분야]에서 [핵심 역량]을 쌓은 [직무] 전문가로, [대표 성과]를 달성했습니다\" 패턴\n"
            "- 신입: \"[전공/교육]을 기반으로 [기술/경험]을 갖춘 [직무] 지원자로, [프로젝트 경험]을 통해 실무 역량을 쌓았습니다\" 패턴\n"
            "- 지원 직무의 핵심 키워드를 자연스럽게 포함\n\n"

            "[각 포트폴리오 항목의 tailored_description 규칙]\n"
            "- 3~5문장으로 작성\n"
            "- 첫 문장: 프로젝트 목적과 본인 역할 명시\n"
            "- 중간: 사용 기술과 구체적 기여 내용\n"
            "- 마지막: 비즈니스 임팩트 또는 학습 성과\n\n"

            "[tailored_achievements 규칙]\n"
            "- 최소 2개, 최대 5개\n"
            "- 공식: [동사] + [대상] + [방법/기술] + [수치 결과]\n"
            "- 예시: \"React 기반 UI 컴포넌트를 재설계하여 페이지 로딩 속도 40% 개선\"\n"
            "- 반드시 수치(%, 건, 명, 시간 등) 포함. 수치가 없으면 합리적으로 추정\n\n"

            "[ATS 키워드 최적화]\n"
            "- 지원 직무 설명에서 핵심 기술 키워드를 추출\n"
            "- description과 achievements에 자연스럽게 삽입 (억지스러운 나열 금지)\n\n"

            "모든 응답은 한국어로 작성하세요."
        )

    def tailor(
        self,
        portfolios: list[Portfolio],
        target_role: str,
        profile: UserProfile,
    ) -> TailoredResume:
        prompt = self._build_prompt(portfolios, target_role, profile)
        return self._call_llm_structured(
            user_message=prompt,
            response_model=TailoredResume,
        )

    def _build_prompt(
        self,
        portfolios: list[Portfolio],
        target_role: str,
        profile: UserProfile,
    ) -> str:
        portfolio_texts = []
        for p in portfolios:
            text = (
                f"[ID: {p.id}]\n"
                f"제목: {p.title}\n"
                f"역할: {p.role}\n"
                f"기간: {p.period}\n"
                f"설명: {p.description}\n"
                f"기술: {', '.join(p.tech_stack)}\n"
                f"성과: {'; '.join(p.achievements)}\n"
            )
            portfolio_texts.append(text)

        profile_text = f"지원자: {profile.name}\n"
        if profile.summary:
            profile_text += f"자기소개: {profile.summary}\n"
        if profile.education:
            edu_texts = [f"{e.school} {e.major} {e.degree} ({e.start_date}~{e.end_date})" for e in profile.education]
            profile_text += f"학력: {'; '.join(edu_texts)}\n"
        if profile.work_experience:
            work_texts = [f"{w.company} {w.position} ({w.start_date}~{'재직중' if w.is_current else w.end_date})" for w in profile.work_experience]
            profile_text += f"경력: {'; '.join(work_texts)}\n"
        if profile.certificates:
            cert_texts = [f"{c.name} ({c.issuer})" for c in profile.certificates]
            profile_text += f"자격증: {'; '.join(cert_texts)}\n"
        if profile.awards:
            award_texts = [f"{a.name} ({a.issuer})" for a in profile.awards]
            profile_text += f"수상: {'; '.join(award_texts)}\n"

        return (
            f"지원 직무: {target_role}\n"
            f"{profile_text}\n"
            f"포트폴리오 항목들:\n\n"
            + "\n---\n".join(portfolio_texts)
            + "\n\n위 포트폴리오를 지원 직무에 맞게 최적화해주세요. "
            "각 항목의 portfolio_id는 원본 ID를 그대로 사용하세요."
        )
