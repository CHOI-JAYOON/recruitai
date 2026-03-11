from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from models.portfolio import Portfolio
from services.storage import StorageService
from services.vector_store import VectorStoreService
from agents.portfolio_parser_agent import PortfolioParserAgent
from services.openai_client import get_openai_client

router = APIRouter()
storage = StorageService()


class ParseRequest(BaseModel):
    text: str


class ReorderRequest(BaseModel):
    ordered_ids: list[str]


@router.get("")
def list_portfolios(username: str = Query(default="")):
    return storage.load_all(username=username)


@router.patch("/reorder")
def reorder_portfolios(req: ReorderRequest):
    storage.reorder(req.ordered_ids)
    return {"message": "순서 변경 완료"}


@router.get("/{portfolio_id}")
def get_portfolio(portfolio_id: str):
    p = storage.get_by_id(portfolio_id)
    if not p:
        raise HTTPException(status_code=404, detail="포트폴리오를 찾을 수 없습니다.")
    return p


@router.post("")
def create_portfolio(portfolio: Portfolio, x_api_key: str = Header(default="")):
    storage.save(portfolio)
    if x_api_key:
        vs = VectorStoreService(x_api_key)
        vs.upsert_portfolio(portfolio)
    return portfolio


@router.put("/{portfolio_id}")
def update_portfolio(portfolio_id: str, portfolio: Portfolio, x_api_key: str = Header(default="")):
    portfolio.id = portfolio_id
    storage.save(portfolio)
    if x_api_key:
        vs = VectorStoreService(x_api_key)
        vs.upsert_portfolio(portfolio)
    return portfolio


@router.delete("/{portfolio_id}")
def delete_portfolio(portfolio_id: str, x_api_key: str = Header(default="")):
    storage.delete(portfolio_id)
    if x_api_key:
        vs = VectorStoreService(x_api_key)
        vs.delete_portfolio(portfolio_id)
    return {"message": "삭제됨"}


@router.post("/parse")
def parse_portfolio(req: ParseRequest, x_api_key: str = Header(...)):
    client = get_openai_client(x_api_key)
    agent = PortfolioParserAgent(client)
    parsed = agent.parse(req.text)
    return [p.model_dump() for p in parsed]
