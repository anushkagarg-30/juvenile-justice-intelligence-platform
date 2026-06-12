#!/usr/bin/env python3
"""Generate embeddings for cases and laws missing vector data."""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings
from app.database import AsyncSessionLocal
from app.services.embedding_service import embedding_service
from app.utils.text import build_case_embedding_text

BATCH_SIZE = (
    settings.embedding_batch_size
    if settings.embedding_provider == "google"
    else 20
)
BATCH_DELAY_SECONDS = (
    settings.embedding_batch_delay_seconds
    if settings.embedding_provider == "google"
    else 0
)


async def embed_cases(session) -> int:
    result = await session.execute(
        text("""
            SELECT id, title, country, offense_type, age_group, facts, summary
            FROM cases
            WHERE embedding IS NULL
            ORDER BY created_at
        """)
    )
    rows = result.mappings().all()
    if not rows:
        return 0

    updated = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        texts = [
            build_case_embedding_text(
                title=r["title"],
                facts=r["facts"],
                offense_type=r["offense_type"],
                age_group=r["age_group"],
                country=r["country"],
                summary=r["summary"],
            )
            for r in batch
        ]
        embeddings = await embedding_service.embed_batch(texts)

        for row, embedding in zip(batch, embeddings, strict=True):
            literal = "[" + ",".join(str(v) for v in embedding) + "]"
            await session.execute(
                text("UPDATE cases SET embedding = CAST(:emb AS vector) WHERE id = :id"),
                {"emb": literal, "id": row["id"]},
            )
            updated += 1

        await session.commit()
        print(f"  cases: {updated}/{len(rows)}")
        if BATCH_DELAY_SECONDS:
            await asyncio.sleep(BATCH_DELAY_SECONDS)

    return updated


async def embed_laws(session) -> int:
    result = await session.execute(
        text("""
            SELECT id, country, law_name, section, legal_topic, text
            FROM laws
            WHERE embedding IS NULL
            ORDER BY created_at
        """)
    )
    rows = result.mappings().all()
    if not rows:
        return 0

    updated = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        texts = [
            f"{r['law_name']} {r.get('section') or ''}\n{r['legal_topic'] or ''}\n{r['text']}\nCountry: {r['country']}"
            for r in batch
        ]
        embeddings = await embedding_service.embed_batch(texts)

        for row, embedding in zip(batch, embeddings, strict=True):
            literal = "[" + ",".join(str(v) for v in embedding) + "]"
            await session.execute(
                text("UPDATE laws SET embedding = CAST(:emb AS vector) WHERE id = :id"),
                {"emb": literal, "id": row["id"]},
            )
            updated += 1

        await session.commit()
        print(f"  laws: {updated}/{len(rows)}")
        if BATCH_DELAY_SECONDS:
            await asyncio.sleep(BATCH_DELAY_SECONDS)

    return updated


async def main() -> None:
    if not settings.database_url:
        print("ERROR: Set DATABASE_URL in backend/.env")
        sys.exit(1)
    if not embedding_service.is_configured:
        key = "GOOGLE_API_KEY" if settings.embedding_provider == "google" else "OPENAI_API_KEY"
        print(f"ERROR: Set {key} in backend/.env")
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        print("Embedding cases...")
        case_count = await embed_cases(session)
        print("Embedding laws...")
        law_count = await embed_laws(session)

    print(f"Done. Embedded {case_count} cases and {law_count} laws.")


if __name__ == "__main__":
    asyncio.run(main())
