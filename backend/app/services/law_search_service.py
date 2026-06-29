from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import LawResult
from app.services.embedding_service import embedding_service
from app.utils.text import build_search_text
from app.utils.vector_search import configure_hnsw_session

VALID_COUNTRIES = {"United States", "India", "United Kingdom"}


class LawSearchService:
    async def find_relevant_laws(
        self,
        db: AsyncSession,
        facts: str,
        country: str | None = None,
        limit: int = 8,
    ) -> list[LawResult]:
        if country and country not in VALID_COUNTRIES:
            raise ValueError(
                f"Invalid country '{country}'. Must be one of: {', '.join(sorted(VALID_COUNTRIES))}"
            )

        search_text = build_search_text(facts, country)
        query_embedding, _ = await embedding_service.embed_query(search_text)
        return await self.find_relevant_laws_with_embedding(
            db=db,
            query_embedding=query_embedding,
            country=country,
            limit=limit,
        )

    async def find_relevant_laws_with_embedding(
        self,
        db: AsyncSession,
        query_embedding: list[float],
        country: str | None = None,
        limit: int = 8,
    ) -> list[LawResult]:
        embedding_literal = "[" + ",".join(str(v) for v in query_embedding) + "]"

        await configure_hnsw_session(db)

        base_sql = """
            SELECT
                id, country, law_name, section, legal_topic, text, source_url,
                1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM laws
            WHERE embedding IS NOT NULL
        """
        params: dict = {"embedding": embedding_literal, "limit": limit}

        if country:
            base_sql += " AND country = :country"
            params["country"] = country

        base_sql += """
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """

        result = await db.execute(text(base_sql), params)
        rows = result.mappings().all()

        return [
            LawResult(
                id=row["id"],
                country=row["country"],
                law_name=row["law_name"],
                section=row["section"],
                legal_topic=row["legal_topic"],
                text=row["text"],
                source_url=row["source_url"],
                similarity=round(float(row["similarity"]), 4),
            )
            for row in rows
        ]


law_search_service = LawSearchService()
