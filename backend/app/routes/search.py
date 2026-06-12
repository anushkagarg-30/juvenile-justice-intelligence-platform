from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import (
    QuickSearchRequest,
    QuickSearchResponse,
    RelevantLawsRequest,
    RelevantLawsResponse,
    SimilarCasesRequest,
    SimilarCasesResponse,
)
from app.services.case_search_service import case_search_service
from app.services.embedding_service import embedding_service
from app.services.law_search_service import law_search_service
from app.services.quick_search_service import quick_search_service

router = APIRouter(prefix="/search", tags=["search"])


def _check_search_prereqs() -> None:
    if not settings.database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    if not embedding_service.is_configured:
        key = "GOOGLE_API_KEY" if settings.embedding_provider == "google" else "OPENAI_API_KEY"
        raise HTTPException(status_code=503, detail=f"{key} is not configured")


@router.post("/quick", response_model=QuickSearchResponse)
async def quick_search(body: QuickSearchRequest) -> QuickSearchResponse:
    """Fast path: one embedding, parallel case + law vector search (target ~1–3s)."""
    _check_search_prereqs()

    try:
        cases, laws, search_text, cache_hit = await quick_search_service.search(
            facts=body.facts,
            country=body.country,
            case_limit=body.case_limit,
            law_limit=body.law_limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Quick search failed: {exc}") from exc

    return QuickSearchResponse(
        query_facts=search_text,
        country_filter=body.country,
        similar_cases=cases,
        relevant_laws=laws,
        case_count=len(cases),
        law_count=len(laws),
        embedding_cache_hit=cache_hit,
    )


@router.post("/similar-cases", response_model=SimilarCasesResponse)
async def search_similar_cases(
    body: SimilarCasesRequest,
    db: AsyncSession = Depends(get_db),
) -> SimilarCasesResponse:
    _check_search_prereqs()

    try:
        results = await case_search_service.find_similar_cases(
            db=db,
            facts=body.facts,
            country=body.country,
            limit=body.limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Similar case search failed: {exc}",
        ) from exc

    return SimilarCasesResponse(
        query_facts=body.facts,
        country_filter=body.country,
        results=results,
        count=len(results),
    )


@router.post("/relevant-laws", response_model=RelevantLawsResponse)
async def search_relevant_laws(
    body: RelevantLawsRequest,
    db: AsyncSession = Depends(get_db),
) -> RelevantLawsResponse:
    _check_search_prereqs()

    try:
        results = await law_search_service.find_relevant_laws(
            db=db,
            facts=body.facts,
            country=body.country,
            limit=body.limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Law search failed: {exc}") from exc

    return RelevantLawsResponse(
        query_facts=body.facts,
        country_filter=body.country,
        results=results,
        count=len(results),
    )
