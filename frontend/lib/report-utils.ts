const SECTION_HEADINGS = [
  { key: "executiveSummary", titles: ["Case Summary", "Executive Summary"] },
  { key: "applicableLaws", titles: ["Applicable Law", "Applicable Laws"] },
  { key: "topPrecedents", titles: ["Similar Precedents", "Top Precedents"] },
  { key: "crossCountryComparison", titles: ["Legal Analysis", "Cross-Country Comparison"] },
  { key: "legalArgumentSuggestions", titles: ["Recommendations", "Legal Argument Suggestions", "Possible Outcomes"] },
] as const;

export function extractSection(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:^|\\n)#{1,3}\\s*(?:\\d+\\.?\\s*)?${escaped}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`,
    "i",
  );
  const match = markdown.match(regex);
  return match ? cleanReportText(match[1].trim()) : "";
}

export function cleanReportText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export function parseReportFromMarkdown(
  markdown: string,
  fallbackSummary?: string,
): {
  executiveSummary: string;
  applicableLaws: string;
  topPrecedents: string;
  crossCountryComparison: string;
  legalArgumentSuggestions: string;
} {
  const result: Record<string, string> = {};

  for (const section of SECTION_HEADINGS) {
    for (const title of section.titles) {
      const content = extractSection(markdown, title);
      if (content && !result[section.key]) {
        result[section.key] = content;
      }
    }
  }

  const recommendations = result.legalArgumentSuggestions ?? "";
  const outcomes = extractSection(markdown, "Possible Outcomes");
  if (outcomes && !recommendations.includes(outcomes.slice(0, 40))) {
    result.legalArgumentSuggestions = [outcomes, recommendations].filter(Boolean).join("\n\n");
  }

  return {
    executiveSummary:
      result.executiveSummary || fallbackSummary || cleanReportText(markdown.slice(0, 600)),
    applicableLaws: result.applicableLaws || "No applicable laws section found.",
    topPrecedents: result.topPrecedents || "No precedent analysis found.",
    crossCountryComparison: result.crossCountryComparison || "No legal analysis found.",
    legalArgumentSuggestions:
      result.legalArgumentSuggestions || "No recommendations found.",
  };
}

export function isTemplateReport(markdown: string): boolean {
  return markdown.startsWith("# Legal Research Report (Template)");
}
