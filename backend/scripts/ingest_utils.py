"""Shared helpers for CSV validation, batch ingest, and corpus stats."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

VALID_COUNTRIES = frozenset({"United States", "India", "United Kingdom"})

CASE_COLUMNS = (
    "title",
    "country",
    "jurisdiction",
    "year",
    "court",
    "offense_type",
    "age_group",
    "facts",
    "summary",
    "outcome",
    "source_url",
)

LAW_COLUMNS = ("country", "law_name", "section", "legal_topic", "text", "source_url")


class IngestValidationError(ValueError):
    pass


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise IngestValidationError(f"{path}: empty or missing header row")
        return list(reader)


def validate_case_row(row: dict[str, str], *, source: str = "csv") -> dict[str, Any]:
    missing = [col for col in ("title", "country", "facts") if not (row.get(col) or "").strip()]
    if missing:
        raise IngestValidationError(f"{source}: missing required fields: {', '.join(missing)}")

    country = row["country"].strip()
    if country not in VALID_COUNTRIES:
        raise IngestValidationError(f"{source}: invalid country '{country}'")

    year_raw = (row.get("year") or "").strip()
    year: int | None = None
    if year_raw:
        try:
            year = int(year_raw)
        except ValueError as exc:
            raise IngestValidationError(f"{source}: invalid year '{year_raw}'") from exc

    facts = row["facts"].strip()
    if len(facts) < 20:
        raise IngestValidationError(f"{source}: facts too short (min 20 chars) for '{row['title']}'")

    return {
        "title": row["title"].strip(),
        "country": country,
        "jurisdiction": (row.get("jurisdiction") or "").strip() or None,
        "year": year,
        "court": (row.get("court") or "").strip() or None,
        "offense_type": (row.get("offense_type") or "").strip() or None,
        "age_group": (row.get("age_group") or "").strip() or None,
        "facts": facts,
        "summary": (row.get("summary") or "").strip() or None,
        "outcome": (row.get("outcome") or "").strip() or None,
        "source_url": (row.get("source_url") or "").strip() or None,
    }


def validate_law_row(row: dict[str, str], *, source: str = "csv") -> dict[str, Any]:
    missing = [col for col in ("country", "law_name", "text") if not (row.get(col) or "").strip()]
    if missing:
        raise IngestValidationError(f"{source}: missing required law fields: {', '.join(missing)}")

    country = row["country"].strip()
    if country not in VALID_COUNTRIES:
        raise IngestValidationError(f"{source}: invalid country '{country}'")

    text_value = row["text"].strip()
    if len(text_value) < 10:
        raise IngestValidationError(f"{source}: law text too short for '{row['law_name']}'")

    return {
        "country": country,
        "law_name": row["law_name"].strip(),
        "section": (row.get("section") or "").strip() or None,
        "legal_topic": (row.get("legal_topic") or "").strip() or None,
        "text": text_value,
        "source_url": (row.get("source_url") or "").strip() or None,
    }


def load_cases_from_csv(path: Path) -> list[dict[str, Any]]:
    rows = read_csv_rows(path)
    return [validate_case_row(row, source=str(path)) for row in rows]


def load_laws_from_csv(path: Path) -> list[dict[str, Any]]:
    rows = read_csv_rows(path)
    return [validate_law_row(row, source=str(path)) for row in rows]


async def insert_case(session: AsyncSession, case: dict[str, Any]) -> bool:
    result = await session.execute(
        text("""
            INSERT INTO cases (
                title, country, jurisdiction, year, court,
                offense_type, age_group, facts, summary, outcome, source_url
            )
            SELECT :title, :country, :jurisdiction, :year, :court,
                   :offense_type, :age_group, :facts, :summary, :outcome, :source_url
            WHERE NOT EXISTS (
                SELECT 1 FROM cases
                WHERE title = :title AND country = :country AND facts = :facts
            )
            RETURNING id
        """),
        case,
    )
    return result.first() is not None


async def insert_law(session: AsyncSession, law: dict[str, Any]) -> bool:
    result = await session.execute(
        text("""
            INSERT INTO laws (country, law_name, section, legal_topic, text, source_url)
            SELECT :country, :law_name, :section, :legal_topic, :text, :source_url
            WHERE NOT EXISTS (
                SELECT 1 FROM laws
                WHERE country = :country AND law_name = :law_name
                  AND COALESCE(section, '') = COALESCE(:section, '')
            )
            RETURNING id
        """),
        law,
    )
    return result.first() is not None


async def ingest_cases(
    session: AsyncSession,
    cases: list[dict[str, Any]],
    *,
    commit_every: int = 100,
) -> tuple[int, int]:
    inserted = skipped = 0
    for index, case in enumerate(cases, start=1):
        if await insert_case(session, case):
            inserted += 1
        else:
            skipped += 1
        if index % commit_every == 0:
            await session.commit()
    await session.commit()
    return inserted, skipped


async def ingest_laws(session: AsyncSession, laws: list[dict[str, Any]]) -> tuple[int, int]:
    inserted = skipped = 0
    for law in laws:
        if await insert_law(session, law):
            inserted += 1
        else:
            skipped += 1
    await session.commit()
    return inserted, skipped


async def get_case_count(session: AsyncSession) -> int:
    result = await session.execute(text("SELECT COUNT(*) FROM cases"))
    return int(result.scalar_one())


async def print_corpus_stats(session: AsyncSession) -> None:
    case_counts = await session.execute(
        text("SELECT country, COUNT(*) AS n FROM cases GROUP BY country ORDER BY country")
    )
    law_counts = await session.execute(
        text("SELECT country, COUNT(*) AS n FROM laws GROUP BY country ORDER BY country")
    )
    embedded = await session.execute(
        text("""
            SELECT
                (SELECT COUNT(*) FROM cases) AS case_total,
                (SELECT COUNT(*) FROM laws) AS law_total,
                (SELECT COUNT(*) FROM cases WHERE embedding IS NOT NULL) AS cases_embedded,
                (SELECT COUNT(*) FROM laws WHERE embedding IS NOT NULL) AS laws_embedded,
                (SELECT COUNT(*) FROM cases WHERE embedding IS NULL) AS cases_pending,
                (SELECT COUNT(*) FROM laws WHERE embedding IS NULL) AS laws_pending
        """)
    )
    row = embedded.mappings().one()

    print("\nCases by country:")
    for record in case_counts.mappings():
        print(f"  {record['country']}: {record['n']}")

    print("\nLaws by country:")
    for record in law_counts.mappings():
        print(f"  {record['country']}: {record['n']}")

    print(
        f"\nTotals: {row['case_total']} cases, {row['law_total']} laws\n"
        f"Embeddings: {row['cases_embedded']} cases, {row['laws_embedded']} laws "
        f"({row['cases_pending']} cases, {row['laws_pending']} laws pending)"
    )


def write_cases_csv(path: Path, cases: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CASE_COLUMNS)
        writer.writeheader()
        for case in cases:
            writer.writerow({col: case.get(col) or "" for col in CASE_COLUMNS})
