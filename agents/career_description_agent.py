from agents.base_agent import BaseAgent
from models.portfolio import Portfolio
from models.user_profile import UserProfile
from models.career_description import CareerDescription


class CareerDescriptionAgent(BaseAgent):
    @property
    def system_prompt(self) -> str:
        return (
            "당신은 한국 취업 시장에 특화된 경력기술서 전문 컨설턴트입니다.\n\n"

            "[경력기술서 표준 구조 — 각 경력/프로젝트 항목]\n"
            "1. 업무 개요 (2~3줄): 소속, 역할, 핵심 업무 범위 요약\n"
            "2. 담당 업무 (불릿 3~5개): 구체적 업무 내용, 업무 비중(%) 표기\n"
            "3. 주요 성과 (불릿 2~4개): 수치화된 성과, STAR 기법 적용\n\n"

            "[프로젝트 서술 규칙]\n"
            "- 배경/목적 → 본인 역할 → 사용 기술 → 성과 순서로 작성\n"
            "- 기여도 명시: \"단독 수행\" / \"5인 팀 리드\" / \"3인 팀, 백엔드 핵심 기여\" 등\n"
            "- 기술 스택은 실제 사용한 것만 포함, 역할과 연결하여 서술\n\n"

            "[성과 작성 공식]\n"
            "- [동사] + [대상] + [방법/도구] + [수치 결과]\n"
            "- 예: \"MSA 아키텍처 도입을 주도하여 배포 주기를 월 1회에서 주 3회로 개선\"\n"
            "- 예: \"사내 어드민 시스템을 React로 재구축하여 업무 처리 시간 35% 단축\"\n\n"

            "[주의 사항]\n"
            "- 제공된 포트폴리오와 경력 정보만 사용 (임의 추가 금지)\n"
            "- 경력자: 회사별로 구분하여 작성\n"
            "- 신입/경력 없음: 프로젝트 기반으로 작성, \"프로젝트 경험\"으로 제목 표기\n"
            "- 수치가 명시되지 않은 경우, 문맥에서 합리적으로 추정 가능하면 추정\n\n"

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
