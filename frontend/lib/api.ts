import type {
  AnalysisResult,
  CaseAnalysisInput,
  Country,
  GenerateReportResponse,
  LawResult,
  QuickSearchResponse,
  SimilarCase,
  SimilarCaseResult,
} from "./types";
import {
  MOCK_ANALYSIS_RESULT,
  MOCK_SIMILAR_CASES,
  MOCK_REPORT,
} from "./mock-data";
import { getApiBase, isMockMode } from "./config";
import { parseReportFromMarkdown } from "./report-utils";

const API_BASE = getApiBase();

async function parseApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") return body.detail;
  } catch {
    // ignore
  }
  return `API request failed (${response.status})`;
}

export async function checkApiHealth(): Promise<{
  ok: boolean;
  databaseConfigured?: boolean;
  embeddingConfigured?: boolean;
  caseCount?: number;
  lawCount?: number;
  casesEmbedded?: number;
  lawsEmbedded?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      return { ok: false, error: await parseApiError(response) };
    }
    const data = await response.json();
    return {
      ok: data.status === "ok",
      databaseConfigured: data.database_configured,
      embeddingConfigured: data.embedding_configured,
      caseCount: data.case_count ?? undefined,
      lawCount: data.law_count ?? undefined,
      casesEmbedded: data.cases_embedded ?? undefined,
      lawsEmbedded: data.laws_embedded ?? undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to reach API",
    };
  }
}

/** Fast path: vector search only (~1–3s). Does not call the LLM. */
export async function searchCase(input: CaseAnalysisInput): Promise<AnalysisResult> {
  const started = Date.now();

  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 1400));
    return {
      input,
      caseSummary: buildCaseSummary(input),
      similarCases: MOCK_SIMILAR_CASES,
      laws: MOCK_ANALYSIS_RESULT.laws,
      constitutionalProtections: MOCK_ANALYSIS_RESULT.constitutionalProtections,
      report: null,
      reportReady: false,
      searchMs: Date.now() - started,
    };
  }

  const country = input.country || null;
  const facts = buildFactsPayload(input);

  const response = await fetch(`${API_BASE}/search/quick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facts, country, case_limit: 10, law_limit: 8 }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data: QuickSearchResponse = await response.json();
  return mapQuickSearchToAnalysis(input, data, Date.now() - started);
}

/** Slow path: LLM report generation (15–60s). Call after searchCase. */
export async function generateReportForAnalysis(
  result: AnalysisResult,
): Promise<AnalysisResult> {
  const report = await generateReport(result.input);
  const updated: AnalysisResult = { ...result, report, reportReady: true };
  saveAnalysisResult(updated);
  return updated;
}

/** @deprecated Use searchCase + generateReportForAnalysis for split fast/slow flow. */
export async function analyzeCase(input: CaseAnalysisInput): Promise<AnalysisResult> {
  const searchResult = await searchCase(input);
  return generateReportForAnalysis(searchResult);
}

export async function getSimilarCases(
  facts: string,
  country: Country | null,
): Promise<SimilarCase[]> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 1200));
    return MOCK_SIMILAR_CASES;
  }

  const response = await fetch(`${API_BASE}/search/similar-cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facts, country, limit: 10 }),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  const data = await response.json();
  return data.results.map(mapBackendCase);
}

export async function generateReport(input: CaseAnalysisInput) {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 3200));
    return MOCK_REPORT;
  }

  const response = await fetch(`${API_BASE}/reports/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facts: buildFactsPayload(input),
      country: input.country || null,
      case_limit: 10,
      law_limit: 8,
    }),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  const data: GenerateReportResponse = await response.json();
  return buildReportFromResponse(data);
}

function buildFactsPayload(input: CaseAnalysisInput): string {
  return [
    input.caseFacts,
    input.juvenileAge ? `Age: ${input.juvenileAge}` : "",
    input.offenseType ? `Offense: ${input.offenseType}` : "",
    input.priorRecord ? `Prior record: ${input.priorRecord}` : "",
    input.legalQuestion ? `Legal question: ${input.legalQuestion}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

function buildCaseSummary(input: CaseAnalysisInput): string {
  return `A ${input.juvenileAge || "juvenile"} in ${input.country || "multiple jurisdictions"} is facing ${input.offenseType || "a delinquency matter"} with ${input.priorRecord || "unspecified prior record"}. ${input.caseFacts}`;
}

function mapBackendCase(item: SimilarCaseResult): SimilarCase {
  return {
    id: item.id,
    title: item.title,
    country: item.country as Country,
    jurisdiction: item.jurisdiction ?? "Unknown",
    year: item.year ?? 2020,
    offenseType: item.offense_type ?? "Unknown",
    similarity: item.similarity,
    summary: item.facts.slice(0, 160) + (item.facts.length > 160 ? "…" : ""),
    relevance: "Retrieved via semantic similarity to submitted case facts.",
    outcome: item.outcome ?? "Outcome not recorded",
    sourceUrl: item.source_url ?? "#",
  };
}

function mapBackendLaw(law: LawResult) {
  return {
    id: law.id,
    name: law.law_name,
    section: law.section ?? "",
    country: law.country as Country,
    topic: law.legal_topic ?? "General",
    text: law.text,
    sourceUrl: law.source_url ?? "#",
  };
}

function mapQuickSearchToAnalysis(
  input: CaseAnalysisInput,
  data: QuickSearchResponse,
  searchMs: number,
): AnalysisResult {
  return {
    input,
    caseSummary: buildCaseSummary(input),
    similarCases: data.similar_cases.map(mapBackendCase),
    laws: data.relevant_laws.map(mapBackendLaw),
    constitutionalProtections: MOCK_ANALYSIS_RESULT.constitutionalProtections,
    report: null,
    reportReady: false,
    searchMs,
  };
}

function buildReportFromResponse(
  data: GenerateReportResponse,
  fallbackSummary?: string,
) {
  const sections = parseReportFromMarkdown(data.report_text, fallbackSummary);
  return {
    id: data.id,
    title: "Legal Research Report",
    generatedAt: data.created_at,
    ...sections,
    citations: data.laws_used.map(
      (law) => `${law.law_name}${law.section ? ` §${law.section}` : ""}`,
    ),
    fullMarkdown: data.report_text,
    aiGenerated: data.ai_generated,
  };
}

export const STORAGE_KEY = "jjip-analysis-result";

export function saveAnalysisResult(result: AnalysisResult) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }
}

export function loadAnalysisResult(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}
