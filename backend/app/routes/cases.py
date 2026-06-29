from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import CaseDetailResponse
from app.services.case_detail_service import case_detail_service

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case_detail(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> CaseDetailResponse:
    if not settings.database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")

    detail = await case_detail_service.get_case_detail(db=db, case_id=case_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return detail
