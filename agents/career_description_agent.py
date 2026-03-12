from agents.base_agent import BaseAgent
from models.portfolio import Portfolio
from models.user_profile import UserProfile
from models.career_description import CareerDescription


class CareerDescriptionAgent(BaseAgent):
    @property
    def system_prompt(self) -> str:
        return (
            "당신은 전문 경력기술서 작성자입니다. "
            "지원자의 경력 사항, 포트폴리오, 이력서를 참고하여 "
            "지원 직무에 최적화된 경력기술서를 작성합니다. "
            "각 경력 항목에 대해: "
            "1) 업무 설명을 지원 직무에 맞게 다시 작성합니다. "
            "2) 구체적이고 수치화된 핵심 성과를 도출합니다. "
            "3) 관련 프로젝트를 포트폴리오에서 매칭하여 설명합니다. "
            "강력한 동사를 사용하고 STAR 기법으로 성과를 표현하세요. "
            "경력이 없는 경우 포트폴리오 기반으로 프로젝트 경력기술서를 작성하세요. "
            "모든 응답은 한국어로 작성하세요."
        )

    def generate(
        self,
        profile: UserProfile,
        portfolios: list[Portfolio],
        target_role: str,
    ) -> CareerDescription:
        prompt = self._build_prompt(profile, portfolios, target_role)
        return self._call_llm_structured(
            user_message=prompt,
            response_model=CareerDescription,
        )

    def _build_prompt(
        self,
        profile: UserProfile,
        portfolios: list[Portfolio],
        target_role: str,
    ) -> str:
        sections = [f"지원 직무: {target_role}\n"]

        # Profile info
        sections.append(f"지원자: {profile.name}")
        if profile.summary:
            sections.append(f"자기소개: {profile.summary}")

        # Resume text
        if profile.resume_text:
            sections.append(f"\n--- 이력서 ---\n{profile.resume_text}\n")

        # Work experience
        if profile.work_experience:
            sections.append("\n--- 경력 사항 ---")
            for w in profile.work_experience:
                period = f"{w.start_date} ~ {'재직중' if w.is_current else w.end_date}"
                text = f"회사: {w.company}\n직책: {w.position}\n팀: {w.team}\n기간: {period}"
                if w.description:
                    text += f"\n업무 설명: {w.description}"
                if w.projects:
                    proj_texts = [f"  - {p.name}: {p.description} ({p.period})" for p in w.projects]
                    text += f"\n프로젝트:\n" + "\n".join(proj_texts)
                sections.append(text + "\n")

        # Education
        if profile.education:
            edu_texts = [f"{e.school} {e.major} {e.degree}" for e in profile.education]
            sections.append(f"학력: {'; '.join(edu_texts)}")

        # Certificates
        if profile.certificates:
            cert_texts = [f"{c.name} ({c.issuer})" for c in profile.certificates]
            sections.append(f"자격증: {'; '.join(cert_texts)}")

        # Portfolios
        if portfolios:
            sections.append("\n--- 포트폴리오 ---")
            for p in portfolios:
                text = (
                    f"제목: {p.title}\n"
                    f"역할: {p.role}\n기간: {p.period}\n"
                    f"설명: {p.description}\n"
                    f"기술: {', '.join(p.tech_stack)}\n"
                    f"성과: {'; '.join(p.achievements)}"
                )
                sections.append(text + "\n")

        sections.append(
            "\n위 정보를 바탕으로 지원 직무에 최적화된 경력기술서를 작성해주세요. "
            "중요: 반드시 위에 제공된 포트폴리오 항목들만을 기반으로 작성하세요. "
            "제공되지 않은 프로젝트나 경력을 임의로 추가하지 마세요. "
            "경력이 있으면 각 경력별로, 없으면 프로젝트 기반으로 작성하세요. "
            "target_role 필드에 지원 직무를 그대로 넣어주세요."
        )

        return "\n".join(sections)
