"use client";

import { SimilarCaseCard } from "@/components/SimilarCaseCard";
import { MOCK_SIMILAR_CASES } from "@/lib/mock-data";

export default function CasesPage() {
  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-3xl font-bold">Case Database</h1>
      <p className="mt-2 text-muted-foreground">
        Browse indexed juvenile justice precedents across jurisdictions.
      </p>
      <div className="mt-8 grid gap-4">
        {MOCK_SIMILAR_CASES.slice(0, 6).map((caseItem, i) => (
          <SimilarCaseCard key={caseItem.id} caseItem={caseItem} index={i} />
        ))}
      </div>
    </div>
  );
}
