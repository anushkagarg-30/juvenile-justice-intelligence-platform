import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import GenerateReportResponse, LawResult, SimilarCaseResult
from app.services.case_search_service import case_search_service
from app.services.law_search_service import law_search_service
from app.services.llm_service import llm_service
from app.utils.report_template import generate_template_report


def _report_date_label() -> str:
    return datetime.now(UTC).strftime("%B %d, %Y")


def _is_template_report(report_text: str) -> bool:
    return report_text.startswith("# Legal Research Report (Template)")


def _build_report_prompt(
    facts: str,
    country: str | None,
    cases: list[SimilarCaseResult],
    laws: list[LawResult],
    report_date: str,
) -> str:
    country_line = country or "not specified (use all retrieved jurisdictions)"

    cases_block = "\n\n".join(
        f"Case {i + 1}: {c.title}\n"
        f"Country: {c.country} | Court: {c.court or 'N/A'} | Year: {c.year or 'N/A'}\n"
        f"Offense: {c.offense_type or 'N/A'} | Age group: {c.age_group or 'N/A'}\n"
        f"Facts: {c.facts}\n"
        f"Outcome: {c.outcome or 'N/A'}\n"
        f"Similarity score: {c.similarity}"
        for i, c in enumerate(cases)
    )

    laws_block = "\n\n".join(
        f"Law {i + 1}: {law.law_name}"
        f"{f' §{law.section}' if law.section else ''}\n"
        f"Country: {law.country} | Topic: {law.legal_topic or 'N/A'}\n"
        f"Text: {law.text}\n"
        f"Similarity score: {law.similarity}"
        for i, law in enumerate(laws)
    )

    return f"""You are a legal research assistant specializing in juvenile justice law.

Write a clear, structured legal research report based ONLY on the user case facts, similar cases, and laws provided below. Do not invent cases or statutes.

USER CASE FACTS:
{facts}

JURISDICTION FOCUS: {country_line}
REPORT DATE: {report_date}

SIMILAR CASES (top {len(cases)}):
{cases_block}

RELEVANT LAWS (top {len(laws)}):
{laws_block}

FORMAT RULES:
- Start with: ## Legal Research Report
- On the next line, include exactly: **Date:** {report_date}
- Do NOT use memo format (no To/From/Subject lines)
- Use these six markdown section headings in order:
  ### 1. Case Summary
  ### 2. Similar Precedents
  ### 3. Applicable Law
  ### 4. Legal Analysis
  ### 5. Possible Outcomes
  ### 6. Recommendations
- End with a brief disclaimer that this is research assistance, not legal advice

CONTENT RULES:
- Case Summary: brief restatement of the user's case facts
- Similar Precedents: key patterns from the similar cases (outcomes, age factors, offense type)
- Applicable Law: which statutes/sections apply and why
- Legal Analysis: how the law and precedents relate to this case
- Possible Outcomes: likely dispositions based on similar cases (probation, diversion, detention, etc.)
- Recommendations: practical next steps for counsel or the court

Keep the tone professional and neutral. Limit the report to about 600–900 words."""


class ReportService:
    async def generate(
        self,
        db: AsyncSession,
        facts: str,
        country: str | None = None,
        case_limit: int = 10,
        law_limit: int = 8,
    ) -> GenerateReportResponse:
        cases = await case_search_service.find_similar_cases(
            db=db, facts=facts, country=country, limit=case_limit
        )
        laws = await law_search_service.find_relevant_laws(
            db=db, facts=facts, country=country, limit=law_limit
        )

        report_date = _report_date_label()
        prompt = _build_report_prompt(facts, country, cases, laws, report_date)
        used_fallback = False
        try:
            report_text, used_fallback = await llm_service.generate_report(prompt)
        except Exception as exc:
            err = str(exc)
            retryable = (
                "429" in err
                or "503" in err
                or "404" in err
                or "NOT_FOUND" in err
                or "RESOURCE_EXHAUSTED" in err
                or "UNAVAILABLE" in err
                or "quota" in err.lower()
                or "high demand" in err.lower()
                or "not found" in err.lower()
            )
            if retryable:
                report_text = generate_template_report(facts, country, cases, laws, report_date)
                used_fallback = True
            else:
                raise

        top_cases_json = [c.model_dump(mode="json") for c in cases]
        laws_json = [law.model_dump(mode="json") for law in laws]

        result = await db.execute(
            text("""
                INSERT INTO generated_reports (user_case_facts, top_cases, laws_used, report_text)
                VALUES (:facts, CAST(:top_cases AS jsonb), CAST(:laws_used AS jsonb), :report_text)
                RETURNING id, created_at
            """),
            {
                "facts": facts,
                "top_cases": json.dumps(top_cases_json),
                "laws_used": json.dumps(laws_json),
                "report_text": report_text,
            },
        )
        row = result.mappings().one()
        await db.commit()

        return GenerateReportResponse(
            id=row["id"],
            query_facts=facts,
            country_filter=country,
            top_cases=cases,
            laws_used=laws,
            report_text=report_text,
            created_at=row["created_at"],
            ai_generated=not used_fallback,
        )

    async def get_by_id(
        self,
        db: AsyncSession,
        report_id: UUID,
    ) -> GenerateReportResponse | None:
        result = await db.execute(
            text("""
                SELECT id, user_case_facts, top_cases, laws_used, report_text, created_at
                FROM generated_reports
                WHERE id = :id
            """),
            {"id": report_id},
        )
        row = result.mappings().one_or_none()
        if row is None:
            return None

        report_text = row["report_text"] or ""
        top_cases = [
            SimilarCaseResult(**case) for case in (row["top_cases"] or [])
        ]
        laws_used = [
            LawResult(**law) for law in (row["laws_used"] or [])
        ]

        return GenerateReportResponse(
            id=row["id"],
            query_facts=row["user_case_facts"],
            country_filter=None,
            top_cases=top_cases,
            laws_used=laws_used,
            report_text=report_text,
            created_at=row["created_at"],
            ai_generated=not _is_template_report(report_text),
        )


report_service = ReportService()
