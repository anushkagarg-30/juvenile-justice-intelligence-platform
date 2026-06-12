from app.models import LawResult, SimilarCaseResult


def generate_template_report(
    facts: str,
    country: str | None,
    cases: list[SimilarCaseResult],
    laws: list[LawResult],
    report_date: str,
) -> str:
    """Fallback report when LLM quota is unavailable."""
    jurisdiction = country or "Multiple jurisdictions"
    lines = [
        "# Legal Research Report (Template)",
        "",
        f"**Date:** {report_date}",
        "",
        "*Note: Generated from retrieved cases and laws. AI narrative unavailable due to API quota.*",
        "",
        "## 1. Case Summary",
        facts,
        "",
        f"**Jurisdiction focus:** {jurisdiction}",
        "",
        "## 2. Similar Precedents",
    ]

    for i, case in enumerate(cases, 1):
        lines.extend([
            f"### {i}. {case.title} (similarity: {case.similarity})",
            f"- **Court:** {case.court or 'N/A'} | **Year:** {case.year or 'N/A'} | **Offense:** {case.offense_type or 'N/A'}",
            f"- **Facts:** {case.facts}",
            f"- **Outcome:** {case.outcome or 'N/A'}",
            "",
        ])

    outcomes = [c.outcome for c in cases if c.outcome]
    probation_count = sum(1 for o in outcomes if "probation" in o.lower())
    diversion_count = sum(1 for o in outcomes if "diversion" in o.lower() or "counseling" in o.lower())

    lines.extend([
        "## 3. Applicable Law",
    ])
    for i, law in enumerate(laws, 1):
        section = f" §{law.section}" if law.section else ""
        lines.extend([
            f"### {i}. {law.law_name}{section} (similarity: {law.similarity})",
            f"- **Topic:** {law.legal_topic or 'N/A'}",
            f"- **Text:** {law.text}",
            "",
        ])

    lines.extend([
        "## 4. Legal Analysis",
        f"Based on {len(cases)} similar juvenile cases, the most common dispositions involve "
        f"probation ({probation_count} cases) and diversion/counseling ({diversion_count} cases). "
        "First-time offenders in cybercrime cases frequently receive education programs rather than detention.",
        "",
        "## 5. Possible Outcomes",
        "- Probation with cyber ethics or digital literacy requirements",
        "- Diversion or counseling programs for first-time offenders",
        "- Restitution where unauthorized access caused harm",
        "- Rarely secure detention for non-violent first offenses",
        "",
        "## 6. Recommendations",
        "- Review top similar cases for disposition patterns in the target jurisdiction",
        "- Cite applicable statutes listed above in juvenile court filings",
        "- Consider diversion given no prior offenses",
        "- Consult qualified counsel; this report is research assistance only",
    ])

    return "\n".join(lines)
