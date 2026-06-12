from collections.abc import AsyncGenerator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _sanitize_database_url(url: str) -> str:
    """Remove query params that asyncpg does not accept (e.g. pgbouncer=true)."""
    if not url:
        return url

    parsed = urlparse(url)
    if not parsed.query:
        return url

    params = parse_qs(parsed.query, keep_blank_values=True)
    params.pop("pgbouncer", None)

    clean_query = urlencode(params, doseq=True)
    return urlunparse(parsed._replace(query=clean_query))


engine = create_async_engine(
    _sanitize_database_url(settings.database_url),
    echo=False,
    pool_pre_ping=True,
    # Supabase transaction pooler (pgbouncer) does not support prepared statements.
    connect_args={"statement_cache_size": 0},
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
