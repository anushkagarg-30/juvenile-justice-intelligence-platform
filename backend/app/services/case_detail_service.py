from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CaseDetailResponse, SimilarCaseResult
from app.services.case_search_service import case_search_service


class CaseDetailService:
    async def get_case_detail(
        self,
        db: AsyncSession,
        case_id: UUID,
        related_limit: int = 8,
    ) -> CaseDetailResponse | None:
        result = await db.execute(
            text("""
                SELECT
                    id, title, country, jurisdiction, year, court,
                    offense_type, age_group, facts, summary, outcome, source_url
                FROM cases
                WHERE id = :id
            """),
            {"id": case_id},
        )
        row = result.mappings().one_or_none()
        if row is None:
            return None

        case = SimilarCaseResult(
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
            similarity=1.0,
        )

        related = await case_search_service.find_related_by_case_id(
            db=db,
            case_id=str(case_id),
            limit=related_limit,
        )

        return CaseDetailResponse(case=case, related_cases=related)


case_detail_service = CaseDetailService()
