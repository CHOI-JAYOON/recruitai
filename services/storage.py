import json
from pathlib import Path
from models.portfolio import Portfolio
from config.settings import PORTFOLIOS_JSON_PATH


class StorageService:
    def __init__(self, path: Path = PORTFOLIOS_JSON_PATH):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("[]", encoding="utf-8")

    def load_all(self, username: str = "") -> list[Portfolio]:
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        portfolios = [Portfolio(**item) for item in raw]
        if username:
            return [p for p in portfolios if p.username == username]
        return portfolios

    def _load_all_raw(self) -> list[Portfolio]:
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        return [Portfolio(**item) for item in raw]

    def get_by_id(self, portfolio_id: str) -> Portfolio | None:
        for p in self._load_all_raw():
            if p.id == portfolio_id:
                return p
        return None

    def get_by_ids(self, ids: list[str]) -> list[Portfolio]:
        all_portfolios = self._load_all_raw()
        id_set = set(ids)
        return [p for p in all_portfolios if p.id in id_set]

    def save(self, portfolio: Portfolio) -> None:
        portfolios = self._load_all_raw()
        existing_ids = {p.id for p in portfolios}
        if portfolio.id in existing_ids:
            portfolios = [
                p if p.id != portfolio.id else portfolio for p in portfolios
            ]
        else:
            portfolios.append(portfolio)
        self._write(portfolios)

    def delete(self, portfolio_id: str) -> None:
        portfolios = [p for p in self._load_all_raw() if p.id != portfolio_id]
        self._write(portfolios)

    def reorder(self, ordered_ids: list[str]) -> None:
        portfolios = self._load_all_raw()
        id_map = {p.id: p for p in portfolios}
        reordered = [id_map[pid] for pid in ordered_ids if pid in id_map]
        # Append any portfolios not in ordered_ids at the end
        seen = set(ordered_ids)
        for p in portfolios:
            if p.id not in seen:
                reordered.append(p)
        self._write(reordered)

    def _write(self, portfolios: list[Portfolio]) -> None:
        data = [p.model_dump() for p in portfolios]
        self.path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
        )
