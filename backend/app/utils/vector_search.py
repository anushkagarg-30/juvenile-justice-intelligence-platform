from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings


async def configure_hnsw_session(db: AsyncSession) -> None:
    """Tune HNSW recall/speed for the current transaction."""
    await db.execute(
        text("SET LOCAL hnsw.ef_search = :ef_search"),
        {"ef_search": settings.hnsw_ef_search},
    )
