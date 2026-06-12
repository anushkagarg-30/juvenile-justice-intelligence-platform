from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import HealthResponse
from app.routes import reports, search
from app.services.embedding_service import embedding_service
from app.services.query_embedding_cache import query_embedding_cache


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(
    title="Juvenile Justice Intelligence Platform",
    description="AI-powered juvenile case similarity search and legal research",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {exc}"},
    )


app.include_router(search.router)
app.include_router(reports.router)


@app.get("/")
async def root() -> dict:
    return {
        "name": "Juvenile Justice Intelligence Platform",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "quick_search": "POST /search/quick",
            "similar_cases": "POST /search/similar-cases",
            "relevant_laws": "POST /search/relevant-laws",
            "generate_report": "POST /reports/generate",
            "get_report": "GET /reports/{id}",
        },
    }


@app.get("/health", response_model=HealthResponse)
async def health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    case_count = law_count = cases_embedded = laws_embedded = None

    if settings.database_url:
        try:
            row = (
                await db.execute(
                    text("""
                        SELECT
                            (SELECT COUNT(*) FROM cases) AS case_count,
                            (SELECT COUNT(*) FROM laws) AS law_count,
                            (SELECT COUNT(*) FROM cases WHERE embedding IS NOT NULL) AS cases_embedded,
                            (SELECT COUNT(*) FROM laws WHERE embedding IS NOT NULL) AS laws_embedded
                    """)
                )
            ).mappings().one()
            case_count = row["case_count"]
            law_count = row["law_count"]
            cases_embedded = row["cases_embedded"]
            laws_embedded = row["laws_embedded"]
        except Exception:
            pass

    return HealthResponse(
        status="ok",
        database_configured=bool(settings.database_url),
        embedding_configured=settings.embedding_configured,
        case_count=case_count,
        law_count=law_count,
        cases_embedded=cases_embedded,
        laws_embedded=laws_embedded,
        embedding_cache_enabled=settings.embedding_cache_enabled,
        embedding_cache_entries=query_embedding_cache.memory_size,
    )
