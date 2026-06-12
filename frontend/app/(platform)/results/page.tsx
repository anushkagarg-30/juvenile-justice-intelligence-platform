"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Scale, Shield, Sparkles } from "lucide-react";
import { LawReferenceCard } from "@/components/LawReferenceCard";
import { LoadingAnalysisAnimation } from "@/components/LoadingAnalysisAnimation";
import { SimilarCaseCard } from "@/components/SimilarCaseCard";
import { StatusMessage } from "@/components/StatusMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateReportForAnalysis, loadAnalysisResult } from "@/lib/api";
import { MOCK_ANALYSIS_RESULT } from "@/lib/mock-data";
import type { AnalysisResult } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(loadAnalysisResult() ?? MOCK_ANALYSIS_RESULT);
  }, []);

  async function handleGenerateReport() {
    if (!result || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const updated = await generateReportForAnalysis(result);
      setResult(updated);
      router.push("/report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  if (!result) return null;

  if (generating) {
    return (
      <div className="p-6 md:p-10">
        <LoadingAnalysisAnimation mode="report" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Search Results</h1>
          <p className="mt-2 text-muted-foreground">
            Top precedents, applicable laws, and constitutional protections for your case.
            {result.searchMs ? (
              <span className="ml-1 text-emerald-400/90">
                Retrieved in {(result.searchMs / 1000).toFixed(1)}s
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.reportReady ? (
            <Button asChild variant="glow">
              <Link href="/report">
                View Full Report
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="glow" onClick={handleGenerateReport}>
              <Sparkles className="h-4 w-4" />
              Generate AI Research Report
            </Button>
          )}
        </div>
      </motion.div>

      {error ? (
        <div className="mt-6">
          <StatusMessage message={error} />
        </div>
      ) : null}

      {!result.reportReady ? (
        <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <p className="text-sm text-foreground/90">
              Search complete. Generate a full AI research memo when you need citations, cross-country
              comparison, and legal argument suggestions (typically 15–60 seconds).
            </p>
            <Button variant="outline" size="sm" onClick={handleGenerateReport}>
              <Sparkles className="h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-4 w-4 text-blue-400" />
              Case Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90">{result.caseSummary}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-4 w-4 text-violet-400" />
              Relevant Laws
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {result.laws.slice(0, 3).map((law) => (
                <li key={law.id} className="text-foreground/85">
                  {law.name} §{law.section}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-4 w-4 text-emerald-400" />
              Constitutional Protections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {result.constitutionalProtections.map((item) => (
                <li key={item.id} className="text-foreground/85">
                  {item.name} ({item.citation})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="mb-6 font-serif text-2xl font-bold">Applicable Laws & Statutes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {result.laws.map((law, i) => (
            <LawReferenceCard key={law.id} law={law} index={i} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-6 font-serif text-2xl font-bold">Top 10 Similar Cases</h2>
        <div className="grid gap-4">
          {result.similarCases.map((caseItem, i) => (
            <SimilarCaseCard key={caseItem.id} caseItem={caseItem} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
