from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SimilarCasesRequest(BaseModel):
    facts: str = Field(..., min_length=10, description="Juvenile case facts to search against")
    country: str | None = Field(
        None,
        description="Filter by country: United States, India, or United Kingdom",
    )
    limit: int = Field(10, ge=1, le=25)


class SimilarCaseResult(BaseModel):
    id: UUID
    title: str
    country: str
    jurisdiction: str | None = None
    year: int | None = None
    court: str | None = None
    offense_type: str | None = None
    age_group: str | None = None
    facts: str
    summary: str | None = None
    outcome: str | None = None
    source_url: str | None = None
    similarity: float = Field(..., description="Cosine similarity score (0–1)")


class SimilarCasesResponse(BaseModel):
    query_facts: str
    country_filter: str | None
    results: list[SimilarCaseResult]
    count: int


class RelevantLawsRequest(BaseModel):
    facts: str = Field(..., min_length=10)
    country: str | None = None
    limit: int = Field(8, ge=1, le=20)


class RelevantLawsResponse(BaseModel):
    query_facts: str
    country_filter: str | None
    results: list[LawResult]
    count: int


class QuickSearchRequest(BaseModel):
    facts: str = Field(..., min_length=10, description="Juvenile case facts to search against")
    country: str | None = Field(
        None,
        description="Filter by country: United States, India, or United Kingdom",
    )
    case_limit: int = Field(10, ge=1, le=25)
    law_limit: int = Field(8, ge=1, le=20)


class QuickSearchResponse(BaseModel):
    query_facts: str
    country_filter: str | None
    similar_cases: list[SimilarCaseResult]
    relevant_laws: list[LawResult]
    case_count: int
    law_count: int
    embedding_cache_hit: bool = False


class HealthResponse(BaseModel):
    status: str
    database_configured: bool
    embedding_configured: bool
    case_count: int | None = None
    law_count: int | None = None
    cases_embedded: int | None = None
    laws_embedded: int | None = None
    embedding_cache_enabled: bool | None = None
    embedding_cache_entries: int | None = None


class CaseRecord(BaseModel):
    title: str
    country: str
    jurisdiction: str | None = None
    year: int | None = None
    court: str | None = None
    offense_type: str | None = None
    age_group: str | None = None
    facts: str
    summary: str | None = None
    outcome: str | None = None
    source_url: str | None = None


class LawResult(BaseModel):
    id: UUID
    country: str
    law_name: str
    section: str | None = None
    legal_topic: str | None = None
    text: str
    source_url: str | None = None
    similarity: float = Field(..., description="Cosine similarity score (0–1)")


class GenerateReportRequest(BaseModel):
    facts: str = Field(..., min_length=10, description="Juvenile case facts for the research report")
    country: str | None = Field(
        None,
        description="Filter by country: United States, India, or United Kingdom",
    )
    case_limit: int = Field(8, ge=1, le=25)
    law_limit: int = Field(6, ge=1, le=20)
    top_cases: list[SimilarCaseResult] | None = Field(
        None,
        description="Pre-fetched similar cases from quick search (skips re-embed + re-search)",
    )
    laws_used: list[LawResult] | None = Field(
        None,
        description="Pre-fetched laws from quick search (skips re-embed + re-search)",
    )


class CaseDetailResponse(BaseModel):
    case: SimilarCaseResult
    related_cases: list[SimilarCaseResult]


class GenerateReportResponse(BaseModel):
    id: UUID
    query_facts: str
    country_filter: str | None
    top_cases: list[SimilarCaseResult]
    laws_used: list[LawResult]
    report_text: str
    created_at: datetime
    ai_generated: bool = Field(
        True,
        description="False if a template report was used due to LLM quota limits",
    )


class GeneratedReportRecord(BaseModel):
    id: UUID
    user_case_facts: str
    top_cases: list | None = None
    laws_used: list | None = None
    report_text: str | None = None
    created_at: datetime
