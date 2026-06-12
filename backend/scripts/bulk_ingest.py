#!/usr/bin/env python3
"""Phase 2 bulk ingest: seed CSVs, expand corpus to target size, optionally embed."""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings
from app.database import AsyncSessionLocal
from scripts.case_generator import generate_synthetic_cases
from scripts.ingest_utils import (
    get_case_count,
    ingest_cases,
    ingest_laws,
    load_cases_from_csv,
    load_laws_from_csv,
    print_corpus_stats,
    write_cases_csv,
)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DEFAULT_CASE_FILES = (
    DATA_DIR / "sample_cases.csv",
    DATA_DIR / "bulk_cases.csv",
)
DEFAULT_LAW_FILE = DATA_DIR / "sample_laws.csv"
BULK_CASES_CSV = DATA_DIR / "bulk_cases.csv"


async def run_embeddings() -> None:
    from scripts.generate_embeddings import embed_cases, embed_laws

    async with AsyncSessionLocal() as session:
        print("\nEmbedding pending cases...")
        case_count = await embed_cases(session)
        print("Embedding pending laws...")
        law_count = await embed_laws(session)
    print(f"Embedded {case_count} cases and {law_count} laws.")


async def run_ingest(args: argparse.Namespace) -> None:
    case_paths = list(args.case_csvs or [])
    if not case_paths:
        case_paths = [path for path in DEFAULT_CASE_FILES if path.exists()]

    csv_cases: list[dict] = []
    for path in case_paths:
        print(f"Loading cases from {path}...")
        csv_cases.extend(load_cases_from_csv(path))
    print(f"Loaded {len(csv_cases)} case rows from CSV.")

    laws: list[dict] = []
    if args.law_csv.exists():
        print(f"Loading laws from {args.law_csv}...")
        laws = load_laws_from_csv(args.law_csv)
        print(f"Loaded {len(laws)} law rows.")

    async with AsyncSessionLocal() as session:
        if csv_cases:
            inserted, skipped = await ingest_cases(session, csv_cases)
            print(f"CSV cases: inserted {inserted}, skipped {skipped}")

        current = await get_case_count(session)
        needed = max(0, args.target_cases - current)

        if needed > 0 and not args.skip_synthetic:
            print(f"Generating {needed} synthetic cases (seed={args.seed}, start_index={current + 1})...")
            synthetic_cases = generate_synthetic_cases(
                needed,
                seed=args.seed,
                start_index=current + 1,
            )
            if args.generate_bulk_csv:
                write_cases_csv(BULK_CASES_CSV, synthetic_cases)
                print(f"Wrote synthetic cases to {BULK_CASES_CSV}")
            inserted, skipped = await ingest_cases(session, synthetic_cases)
            print(f"Synthetic cases: inserted {inserted}, skipped {skipped}")
        elif needed > 0:
            print(f"At {current} cases — need {needed} more to reach target (use without --skip-synthetic).")
        else:
            print(f"Already at or above target ({current} >= {args.target_cases}).")

        if laws:
            law_inserted, law_skipped = await ingest_laws(session, laws)
            print(f"Laws: inserted {law_inserted}, skipped {law_skipped}")

        final = await get_case_count(session)
        await print_corpus_stats(session)

    if args.embed:
        if not settings.embedding_configured:
            print("ERROR: Embedding API key not configured.")
            sys.exit(1)
        await run_embeddings()
        async with AsyncSessionLocal() as session:
            await print_corpus_stats(session)
    elif final < args.target_cases or needed > 0:
        print("\nNext: python scripts/bulk_ingest.py --embed --skip-synthetic")
        print("  or: python scripts/generate_embeddings.py")


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bulk ingest pipeline: CSV seed + synthetic expansion + optional embeddings"
    )
    parser.add_argument("--target-cases", type=int, default=1000, help="Target total cases in DB")
    parser.add_argument(
        "--case-csv",
        type=Path,
        action="append",
        dest="case_csvs",
        help="Additional case CSV (repeatable)",
    )
    parser.add_argument("--law-csv", type=Path, default=DEFAULT_LAW_FILE)
    parser.add_argument(
        "--generate-bulk-csv",
        action="store_true",
        help="Save generated synthetic rows to backend/data/bulk_cases.csv",
    )
    parser.add_argument("--skip-synthetic", action="store_true")
    parser.add_argument("--seed", type=int, default=42, help="RNG seed (use 10042 for 10k expansion batch)")
    parser.add_argument(
        "--embed",
        action="store_true",
        help="Embed pending rows after ingest (~15–30 min for ~900 new cases)",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    case_paths = list(args.case_csvs or [])
    if not case_paths:
        case_paths = [path for path in DEFAULT_CASE_FILES if path.exists()]

    if args.dry_run:
        csv_cases = []
        for path in case_paths:
            csv_cases.extend(load_cases_from_csv(path))
        print(f"Dry run: {len(csv_cases)} CSV case rows from {len(case_paths)} file(s)")
        if args.law_csv.exists():
            laws = load_laws_from_csv(args.law_csv)
            print(f"Dry run: {len(laws)} law rows")
        if not args.skip_synthetic:
            needed = max(0, args.target_cases - len(csv_cases))
            print(f"Would generate up to {needed} synthetic cases (actual count depends on DB state)")
        print("Dry run complete — no database changes.")
        return

    if not settings.database_url:
        print("ERROR: Set DATABASE_URL in backend/.env")
        sys.exit(1)

    await run_ingest(args)


if __name__ == "__main__":
    asyncio.run(main())
