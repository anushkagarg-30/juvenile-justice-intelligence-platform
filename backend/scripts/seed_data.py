#!/usr/bin/env python3
"""Load sample cases and laws from CSV into Supabase PostgreSQL."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings
from app.database import AsyncSessionLocal
from scripts.ingest_utils import (
    ingest_cases,
    ingest_laws,
    load_cases_from_csv,
    load_laws_from_csv,
    print_corpus_stats,
)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
CASES_CSV = DATA_DIR / "sample_cases.csv"
LAWS_CSV = DATA_DIR / "sample_laws.csv"


async def main() -> None:
    if not settings.database_url:
        print("ERROR: Set DATABASE_URL in backend/.env")
        sys.exit(1)

    cases = load_cases_from_csv(CASES_CSV) if CASES_CSV.exists() else []
    laws = load_laws_from_csv(LAWS_CSV) if LAWS_CSV.exists() else []

    async with AsyncSessionLocal() as session:
        case_inserted, case_skipped = await ingest_cases(session, cases)
        law_inserted, law_skipped = await ingest_laws(session, laws)
        await print_corpus_stats(session)

    print(
        f"\nCases: inserted {case_inserted}, skipped {case_skipped}. "
        f"Laws: inserted {law_inserted}, skipped {law_skipped}."
    )
    print("For 1k corpus: python scripts/bulk_ingest.py --target-cases 1000 --embed")


if __name__ == "__main__":
    asyncio.run(main())
