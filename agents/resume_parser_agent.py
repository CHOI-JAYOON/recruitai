from agents.base_agent import BaseAgent
from models.resume_parsed import ParsedResume


class ResumeParserAgent(BaseAgent):
    @property
    def system_prompt(self) -> str:
        return (
            "당신은 이력서 파싱 전문가입니다. "
            "사용자가 업로드한 이력서 텍스트에서 모든 정보를 추출하여 구조화합니다. "
            "\n\n## 추출 대상:\n"
            "1. **기본 정보**: 이름, 이메일, 전화번호, GitHub, LinkedIn, 블로그 URL, 자기소개\n"
            "2. **학력**: 학교 유형(고등학교/대학교/대학원), 학교명, 전공, 학위(전문학사/학사/석사/박사), 입학일, 졸업일, 학점\n"
            "3. **경력(work_experience)**: 회사명, 부서/팀, 직책, 시작일, 종료일, 현재 재직 여부, 업무 설명, 프로젝트들\n"
            "4. **자격증**: 자격증명, 발급기관, 취득일\n"
            "5. **수상**: 수상명, 수여기관, 수상일, 설명\n"
            "6. **교육 이수**: 과정명, 교육기관, 시작일, 종료일, 설명\n"
            "7. **포트폴리오(portfolios)**: 프로젝트별로 제목, 회사명, 유형(portfolio/career), "
            "카테고리, 기간, 역할, 설명, 기술스택, 성과, 링크, 팀 규모\n"
            "\n## 포트폴리오 분류 규칙:\n"
            "- 회사에서 수행한 업무/프로젝트 → type: 'career', category: '정규직' 또는 '인턴' 등\n"
            "- 개인/팀 프로젝트, 오픈소스 → type: 'portfolio', category: '개인 프로젝트' 또는 '팀 프로젝트'\n"
            "\n## 성과 작성 규칙:\n"
            "성과(achievements)는 반드시 임팩트 있고 인상적으로 작성하세요. "
            "구체적인 수치와 비율을 활용하고, 기여도와 비즈니스 임팩트를 강조하며, "
            "능동적이고 주도적인 표현을 사용하세요. "
            "예: '검색 속도 개선' → '검색 엔진 아키텍처를 재설계하여 응답 속도 40% 향상' "
            "\n## 날짜 형식:\n"
            "- 학력/경력의 start_date, end_date: 'YYYY-MM-DD' 형식 (일자를 모르면 01로)\n"
            "- 포트폴리오의 period: '2023.03 - 2023.12' 형식\n"
            "\n문맥에서 명확히 유추 가능한 정보는 합리적으로 추론하여 채우세요. "
            "모든 응답은 한국어로 작성하세요."
        )

    def parse(self, resume_text: str) -> ParsedResume:
        return self._call_llm_structured(
            user_message=resume_text,
            response_model=ParsedResume,
        )
