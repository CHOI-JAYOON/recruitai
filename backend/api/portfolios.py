from fastapi import APIRouter, HTTPException, Header, Query, Depends
from pydantic import BaseModel, Field
from models.portfolio import Portfolio
from services.storage import StorageService
from services.vector_store import VectorStoreService
from agents.portfolio_parser_agent import PortfolioParserAgent
from services.openai_client import get_openai_client
from services.jwt_service import get_current_user

router = APIRouter()
storage = StorageService()


class ParseRequest(BaseModel):
    text: str = Field(max_length=50000)


class ReorderRequest(BaseModel):
    ordered_ids: list[str]


@router.get("")
def list_portfolios(current_user: dict = Depends(get_current_user)):
    return storage.load_all(username=current_user["username"])


@router.patch("/reorder")
def reorder_portfolios(req: ReorderRequest, current_user: dict = Depends(get_current_user)):
    storage.reorder(req.ordered_ids)
    return {"message": "순서 변경 완료"}


@router.get("/{portfolio_id}")
def get_portfolio(portfolio_id: str, current_user: dict = Depends(get_current_user)):
    p = storage.get_by_id(portfolio_id)
    if not p:
        raise HTTPException(status_code=404, detail="포트폴리오를 찾을 수 없습니다.")
    # Ownership check
    p_data = p if isinstance(p, dict) else p.model_dump() if hasattr(p, 'model_dump') else p.__dict__
    if p_data.get("username") and p_data["username"] != current_user["username"]:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return p


@router.post("")
def create_portfolio(portfolio: Portfolio, current_user: dict = Depends(get_current_user), x_api_key: str = Header(default="")):
    portfolio.username = current_user["username"]
    storage.save(portfolio)
    if x_api_key:
        vs = VectorStoreService(x_api_key)
        vs.upsert_portfolio(portfolio)
    return portfolio


@router.post("/bulk")
def create_portfolios_bulk(portfolios: list[Portfolio], current_user: dict = Depends(get_current_user), x_api_key: str = Header(default="")):
    """Save multiple portfolios at once (single read-write cycle)."""
    for p in portfolios:
        p.username = current_user["username"]
    saved = storage.save_bulk(portfolios)
    if x_api_key and saved:
        vs = VectorStoreService(x_api_key)
        for p in saved:
            vs.upsert_portfolio(p)
    return saved


@router.put("/{portfolio_id}")
def update_portfolio(portfolio_id: str, portfolio: Portfolio, current_user: dict = Depends(get_current_user), x_api_key: str = Header(default="")):
    portfolio.id = portfolio_id
    portfolio.username = current_user["username"]
    storage.save(portfolio)
    if x_api_key:
        vs = VectorStoreService(x_api_key)
        vs.upsert_portfolio(portfolio)
    return portfolio


@router.delete("/{portfolio_id}")
def delete_portfolio(portfolio_id: str, current_user: dict = Depends(get_current_user), x_api_key: str = Header(default="")):
    storage.delete(portfolio_id)
    if x_api_key:
        vs = VectorStoreService(x_api_key)
        vs.delete_portfolio(portfolio_id)
    return {"message": "삭제됨"}


@router.post("/parse")
def parse_portfolio(req: ParseRequest, current_user: dict = Depends(get_current_user), x_api_key: str = Header(...)):
    client = get_openai_client(x_api_key)
    agent = PortfolioParserAgent(client)
    parsed = agent.parse(req.text)
    return [p.model_dump() for p in parsed]
