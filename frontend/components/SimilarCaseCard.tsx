"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { JurisdictionBadge } from "@/components/JurisdictionBadge";
import { SimilarityScoreBadge } from "@/components/SimilarityScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SimilarCase } from "@/lib/types";

interface SimilarCaseCardProps {
  caseItem: SimilarCase;
  index: number;
}

export function SimilarCaseCard({ caseItem, index }: SimilarCaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{caseItem.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {caseItem.jurisdiction} · {caseItem.year}
              </p>
            </div>
            <SimilarityScoreBadge score={caseItem.similarity} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <JurisdictionBadge country={caseItem.country} />
            <Badge variant="secondary">{caseItem.offenseType}</Badge>
            <Badge variant="success">{caseItem.outcome.split(";")[0]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-foreground/90">{caseItem.summary}</p>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
              Why this case is relevant
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{caseItem.relevance}</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              Outcome: {caseItem.outcome}
            </span>
            <Button variant="ghost" size="sm" asChild>
              <a href={caseItem.sourceUrl} target="_blank" rel="noopener noreferrer">
                Citation
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
