"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { JurisdictionBadge } from "@/components/JurisdictionBadge";
import { SimilarCaseCard } from "@/components/SimilarCaseCard";
import { SimilarityScoreBadge } from "@/components/SimilarityScoreBadge";
import { StatusMessage } from "@/components/StatusMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaseDetail } from "@/lib/api";
import type { SimilarCase } from "@/lib/types";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const [caseItem, setCaseItem] = useState<SimilarCase | null>(null);
  const [relatedCases, setRelatedCases] = useState<SimilarCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!params.id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getCaseDetail(params.id);
        if (!cancelled) {
          setCaseItem(data.caseItem);
          setRelatedCases(data.relatedCases);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load case.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <p className="text-muted-foreground">Loading case details…</p>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="p-6 md:p-10">
        <StatusMessage message={error ?? "Case not found."} />
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/results">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to results
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/results">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to search results
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-3xl">{caseItem.title}</CardTitle>
              <p className="mt-2 text-muted-foreground">
                {caseItem.court ?? caseItem.jurisdiction} · {caseItem.year}
              </p>
            </div>
            {caseItem.similarity < 1 ? (
              <SimilarityScoreBadge score={caseItem.similarity} />
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <JurisdictionBadge country={caseItem.country} />
            <Badge variant="secondary">{caseItem.offenseType}</Badge>
            {caseItem.ageGroup ? <Badge variant="outline">{caseItem.ageGroup}</Badge> : null}
            <Badge variant="success">{caseItem.outcome.split(";")[0]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Case facts
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{caseItem.facts}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Outcome
            </h2>
            <p className="mt-2 text-sm text-foreground/90">{caseItem.outcome}</p>
          </div>
          {caseItem.sourceUrl && caseItem.sourceUrl !== "#" ? (
            <Button variant="outline" size="sm" asChild>
              <a href={caseItem.sourceUrl} target="_blank" rel="noopener noreferrer">
                View citation source
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <section className="mt-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold">Related cases</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Semantically similar precedents ranked by vector similarity.
            </p>
          </div>
        </div>

        {relatedCases.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No related cases found for this precedent.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {relatedCases.map((related, i) => (
              <SimilarCaseCard key={related.id} caseItem={related} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
