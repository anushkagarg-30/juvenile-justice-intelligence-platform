"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Copy, FileDown, Save, Sparkles } from "lucide-react";
import { ReportPrintView } from "@/components/ReportPrintView";
import { ReportSection } from "@/components/ReportSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAnalysisResult } from "@/lib/api";
import { exportElementToPdf } from "@/lib/export-pdf";
import { cleanReportText } from "@/lib/report-utils";
import { MOCK_ANALYSIS_RESULT } from "@/lib/mock-data";
import type { GeneratedReport } from "@/lib/types";

export default function ReportPageContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDemo) {
      setReport(MOCK_ANALYSIS_RESULT.report);
      return;
    }
    const result = loadAnalysisResult();
    setReport(result?.report ?? null);
  }, [isDemo]);

  if (!report) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-10 text-center">
        <Sparkles className="mb-4 h-10 w-10 text-blue-400" />
        <h1 className="font-serif text-2xl font-bold">No report generated yet</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Run a case search first, then generate an AI research report from the results page.
        </p>
        <Button asChild variant="glow" className="mt-6">
          <Link href="/results">
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Link>
        </Button>
      </div>
    );
  }

  const sections = [
    { title: "Executive Summary", content: report.executiveSummary },
    { title: "Applicable Laws", content: report.applicableLaws },
    { title: "Top Precedents", content: report.topPrecedents },
    { title: "Cross-Country Comparison", content: report.crossCountryComparison },
    { title: "Legal Argument Suggestions", content: report.legalArgumentSuggestions },
  ];

  async function handleCopy() {
    const plainText = sections
      .map((s) => `${s.title}\n${cleanReportText(s.content)}`)
      .join("\n\n");
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExportPdf() {
    if (!printRef.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(printRef.current, `jjip-report-${report!.id}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p className="text-sm text-blue-300">Generated Research Report</p>
          <h1 className="font-serif text-3xl font-bold">{report.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {new Date(report.generatedAt).toLocaleString()}
              {isDemo ? " · Demo Report" : ""}
            </p>
            {report.aiGenerated === false && (
              <Badge variant="secondary">Template fallback</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exporting}>
            <FileDown className="h-4 w-4" />
            {exporting ? "Generating PDF…" : "Download PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy Report"}
          </Button>
          <Button variant="glow" size="sm">
            <Save className="h-4 w-4" />
            Save Analysis
          </Button>
        </div>
      </motion.div>

      <div className="mt-8 space-y-6">
        {sections.map((section, i) => (
          <ReportSection key={section.title} {...section} index={i} />
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.citations.map((citation) => (
                <li
                  key={citation}
                  className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-sm"
                >
                  {citation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden>
        <div ref={printRef}>
          <ReportPrintView report={report} />
        </div>
      </div>
    </div>
  );
}
