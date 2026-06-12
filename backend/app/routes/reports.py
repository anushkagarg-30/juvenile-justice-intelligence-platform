from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import GenerateReportRequest, GenerateReportResponse
from app.services.llm_service import llm_service
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{report_id}", response_model=GenerateReportResponse)
async def get_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> GenerateReportResponse:
    if not settings.database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")

    report = await report_service.get_by_id(db=db, report_id=report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/generate", response_model=GenerateReportResponse)
async def generate_report(
    body: GenerateReportRequest,
    db: AsyncSession = Depends(get_db),
) -> GenerateReportResponse:
    if not settings.database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    if not settings.embedding_configured:
        key = "GOOGLE_API_KEY" if settings.embedding_provider == "google" else "OPENAI_API_KEY"
        raise HTTPException(status_code=503, detail=f"{key} is not configured")
    if not llm_service.is_configured:
        raise HTTPException(status_code=503, detail="GOOGLE_API_KEY is not configured for report generation")

    try:
        return await report_service.generate(
            db=db,
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
        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {exc}",
        ) from exc
