from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SimilarCaseResult
from app.services.embedding_service import embedding_service
from app.utils.text import build_search_text

VALID_COUNTRIES = {"United States", "India", "United Kingdom"}


class CaseSearchService:
    async def find_similar_cases(
        self,
        db: AsyncSession,
        facts: str,
        country: str | None = None,
        limit: int = 10,
    ) -> list[SimilarCaseResult]:
        if country and country not in VALID_COUNTRIES:
            raise ValueError(
                f"Invalid country '{country}'. Must be one of: {', '.join(sorted(VALID_COUNTRIES))}"
            )

        search_text = build_search_text(facts, country)
        query_embedding, _ = await embedding_service.embed_query(search_text)
        return await self.find_similar_cases_with_embedding(
            db=db,
            query_embedding=query_embedding,
            country=country,
            limit=limit,
        )

    async def find_similar_cases_with_embedding(
        self,
        db: AsyncSession,
        query_embedding: list[float],
        country: str | None = None,
        limit: int = 10,
    ) -> list[SimilarCaseResult]:
        embedding_literal = "[" + ",".join(str(v) for v in query_embedding) + "]"

        base_sql = """
            SELECT
                id, title, country, jurisdiction, year, court,
                offense_type, age_group, facts, summary, outcome, source_url,
                1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM cases
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
            SimilarCaseResult(
                id=row["id"],
                title=row["title"],
                country=row["country"],
                jurisdiction=row["jurisdiction"],
                year=row["year"],
                court=row["court"],
                offense_type=row["offense_type"],
                age_group=row["age_group"],
                facts=row["facts"],
                summary=row["summary"],
                outcome=row["outcome"],
                source_url=row["source_url"],
                similarity=round(float(row["similarity"]), 4),
            )
            for row in rows
        ]


case_search_service = CaseSearchService()
