def build_search_text(facts: str, country: str | None = None) -> str:
    """Combine user facts with optional country hint for embedding."""
    parts = [facts.strip()]
    if country:
        parts.append(f"Country: {country}")
    return "\n".join(parts)


def build_case_embedding_text(
    title: str,
    facts: str,
    offense_type: str | None = None,
    age_group: str | None = None,
    country: str | None = None,
    summary: str | None = None,
) -> str:
    """Text blob used when embedding a stored case."""
    parts = [title, facts]
    if summary:
        parts.append(summary)
    if offense_type:
        parts.append(f"Offense: {offense_type}")
    if age_group:
        parts.append(f"Age group: {age_group}")
    if country:
        parts.append(f"Country: {country}")
    return "\n".join(parts)
