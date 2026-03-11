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
