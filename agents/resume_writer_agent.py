from agents.base_agent import BaseAgent
from models.portfolio import Portfolio
from models.user_profile import UserProfile
from models.resume import TailoredResume


class ResumeWriterAgent(BaseAgent):
    @property
    def system_prompt(self) -> str:
        return (
            "당신은 전문 이력서 작성자입니다. "
            "포트폴리오 항목들과 지원 직무가 주어지면, "
            "해당 직무에 맞게 설명과 성과를 다시 작성합니다. "
            "강력한 동사를 사용하고, 가능하면 성과를 수치화하며, "
            "관련 기술을 강조하세요. "
            "간결하고 임팩트 있는 표현을 사용하세요. "
            "지원자의 학력, 경력, 자격증, 수상 이력도 참고하여 "
            "Professional Summary를 작성하세요. "
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
