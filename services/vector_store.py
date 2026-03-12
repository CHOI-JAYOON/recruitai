import os
import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from models.portfolio import Portfolio
from config.settings import CHROMA_DB_PATH, CHROMA_COLLECTION_NAME, EMBEDDING_MODEL


class VectorStoreService:
    def __init__(self, openai_api_key: str = ""):
        api_key = openai_api_key or os.getenv("OPENAI_API_KEY", "")
        self.embedding_fn = OpenAIEmbeddingFunction(
            api_key=api_key,
            model_name=EMBEDDING_MODEL,
        )
        CHROMA_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(CHROMA_DB_PATH))
        self.collection = self.client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

    def upsert_portfolio(self, portfolio: Portfolio) -> None:
        document_text = self._portfolio_to_document(portfolio)
        self.collection.upsert(
            ids=[portfolio.id],
            documents=[document_text],
            metadatas=[
                {
                    "title": portfolio.title,
                    "role": portfolio.role,
                    "period": portfolio.period,
                    "tech_stack": ", ".join(portfolio.tech_stack),
                }
            ],
        )

    def delete_portfolio(self, portfolio_id: str) -> None:
        try:
            self.collection.delete(ids=[portfolio_id])
        except Exception:
            pass

    def search(self, query: str, n_results: int = 3) -> dict:
        count = self.collection.count()
        if count == 0:
            return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}
        actual_n = min(n_results, count)
        return self.collection.query(
            query_texts=[query],
            n_results=actual_n,
            include=["documents", "metadatas", "distances"],
        )

    def _portfolio_to_document(self, portfolio: Portfolio) -> str:
        parts = [
            f"Title: {portfolio.title}",
            f"Role: {portfolio.role}",
            f"Period: {portfolio.period}",
            f"Description: {portfolio.description}",
            f"Technologies: {', '.join(portfolio.tech_stack)}",
            f"Achievements: {'; '.join(portfolio.achievements)}",
        ]
        return "\n".join(parts)
