import type { GeneratedReport } from "@/lib/types";

interface ReportPrintViewProps {
  report: GeneratedReport;
}

export function ReportPrintView({ report }: ReportPrintViewProps) {
  const sections = [
    { title: "Executive Summary", content: report.executiveSummary },
    { title: "Applicable Laws", content: report.applicableLaws },
    { title: "Top Precedents", content: report.topPrecedents },
    { title: "Cross-Country Comparison", content: report.crossCountryComparison },
    { title: "Legal Argument Suggestions", content: report.legalArgumentSuggestions },
  ];

  return (
    <div className="bg-white p-10 text-slate-900" style={{ width: 794 }}>
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
        Juvenile Justice Intelligence Platform
      </p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-slate-900">{report.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        Generated {new Date(report.generatedAt).toLocaleString()}
        {report.aiGenerated === false ? " · Template report" : ""}
      </p>
      <hr className="my-6 border-slate-200" />

      {sections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-slate-900">{section.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {section.content}
          </p>
        </div>
      ))}

      <div>
        <h2 className="font-serif text-lg font-semibold text-slate-900">Citations</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {report.citations.map((citation) => (
            <li key={citation}>{citation}</li>
          ))}
        </ul>
      </div>

      <p className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        This report provides AI-assisted legal research support and does not replace
        professional legal judgment.
      </p>
    </div>
  );
}
