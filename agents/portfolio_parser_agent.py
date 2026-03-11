from agents.base_agent import BaseAgent
from models.portfolio import Portfolio, ParsedPortfolios


class PortfolioParserAgent(BaseAgent):
    @property
    def system_prompt(self) -> str:
        return (
            "당신은 포트폴리오 파싱 전문가입니다. "
            "사용자가 입력한 비정형 텍스트에서 프로젝트, 업무 경험, 성과 등을 추출하여 "
            "구조화된 포트폴리오 항목으로 변환합니다. "
            "각 항목에는 명확한 제목, 기간, 역할, 기술 스택, 상세 설명, "
            "측정 가능한 성과가 포함되어야 합니다. "
            "성과(achievements)는 반드시 임팩트 있고 인상적으로 작성하세요. "
            "구체적인 수치와 비율을 활용하고, 기여도와 비즈니스 임팩트를 강조하며, "
            "능동적이고 주도적인 표현을 사용하세요. "
            "예: '검색 속도 개선' → '검색 엔진 아키텍처를 재설계하여 응답 속도 40% 향상, 일 평균 처리량 200만 건 달성' "
            "예: '버그 수정' → '핵심 장애 포인트를 분석·해결하여 서비스 안정성 99.9% 달성 및 장애 발생률 70% 감소' "
            "텍스트에 여러 프로젝트가 있으면 각각 별도의 항목으로 만드세요. "
            "문맥에서 명확히 유추 가능한 정보는 합리적으로 추론하여 채우세요. "
            "모든 응답은 한국어로 작성하세요."
        )

    def parse(self, raw_text: str) -> list[Portfolio]:
        result = self._call_llm_structured(
            user_message=raw_text,
            response_model=ParsedPortfolios,
        )
        return result.portfolios
