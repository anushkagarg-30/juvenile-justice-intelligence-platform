export type Country = "United States" | "India" | "United Kingdom";

export interface CaseAnalysisInput {
  country: Country | "";
  juvenileAge: string;
  offenseType: string;
  priorRecord: string;
  caseFacts: string;
  legalQuestion: string;
  comparisonCountries: Country[];
}

export interface SimilarCase {
  id: string;
  title: string;
  country: Country;
  jurisdiction: string;
  year: number;
  offenseType: string;
  similarity: number;
  summary: string;
  relevance: string;
  outcome: string;
  sourceUrl: string;
}

export interface LawReference {
  id: string;
  name: string;
  section: string;
  country: Country;
  topic: string;
  text: string;
  sourceUrl: string;
}

export interface ConstitutionalProtection {
  id: string;
  name: string;
  citation: string;
  country: Country;
  summary: string;
  relevance: string;
}

export interface AnalysisResult {
  input: CaseAnalysisInput;
  caseSummary: string;
  similarCases: SimilarCase[];
  laws: LawReference[];
  constitutionalProtections: ConstitutionalProtection[];
  report: GeneratedReport | null;
  reportReady: boolean;
  searchMs?: number;
}

export interface GeneratedReport {
  id: string;
  title: string;
  generatedAt: string;
  executiveSummary: string;
  applicableLaws: string;
  topPrecedents: string;
  crossCountryComparison: string;
  legalArgumentSuggestions: string;
  citations: string[];
  fullMarkdown: string;
  aiGenerated?: boolean;
}

export interface SimilarCaseResult {
  id: string;
  title: string;
  country: string;
  jurisdiction?: string | null;
  year?: number | null;
  court?: string | null;
  offense_type?: string | null;
  facts: string;
  outcome?: string | null;
  source_url?: string | null;
  similarity: number;
}

export interface LawResult {
  id: string;
  country: string;
  law_name: string;
  section?: string | null;
  legal_topic?: string | null;
  text: string;
  source_url?: string | null;
  similarity: number;
}

export interface QuickSearchResponse {
  query_facts: string;
  country_filter: string | null;
  similar_cases: SimilarCaseResult[];
  relevant_laws: LawResult[];
  case_count: number;
  law_count: number;
}

export interface GenerateReportResponse {
  id: string;
  query_facts: string;
  country_filter: string | null;
  top_cases: SimilarCaseResult[];
  laws_used: Array<{
    id: string;
    law_name: string;
    section?: string | null;
    country: string;
    legal_topic?: string | null;
    text: string;
    source_url?: string | null;
    similarity: number;
  }>;
  report_text: string;
  created_at: string;
  ai_generated: boolean;
}
