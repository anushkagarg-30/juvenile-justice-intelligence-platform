import asyncio

from app.database import AsyncSessionLocal
from app.models import LawResult, SimilarCaseResult
from app.services.case_search_service import case_search_service
from app.services.embedding_service import embedding_service
from app.services.law_search_service import law_search_service
from app.utils.text import build_search_text

VALID_COUNTRIES = {"United States", "India", "United Kingdom"}


class QuickSearchService:
    """Single-embedding search: cases + laws in parallel (~1–3s at 10k+ rows)."""

    async def search(
        self,
        facts: str,
        country: str | None = None,
        case_limit: int = 10,
        law_limit: int = 8,
    ) -> tuple[list[SimilarCaseResult], list[LawResult], str, bool]:
        if country and country not in VALID_COUNTRIES:
            raise ValueError(
                f"Invalid country '{country}'. Must be one of: {', '.join(sorted(VALID_COUNTRIES))}"
            )

        search_text = build_search_text(facts, country)
        query_embedding, cache_hit = await embedding_service.embed_query(search_text)

        async def fetch_cases() -> list[SimilarCaseResult]:
            async with AsyncSessionLocal() as session:
                return await case_search_service.find_similar_cases_with_embedding(
                    db=session,
                    query_embedding=query_embedding,
                    country=country,
                    limit=case_limit,
                )

        async def fetch_laws() -> list[LawResult]:
            async with AsyncSessionLocal() as session:
                return await law_search_service.find_relevant_laws_with_embedding(
                    db=session,
                    query_embedding=query_embedding,
                    country=country,
                    limit=law_limit,
                )

        cases, laws = await asyncio.gather(fetch_cases(), fetch_laws())
        return cases, laws, search_text, cache_hit


quick_search_service = QuickSearchService()
