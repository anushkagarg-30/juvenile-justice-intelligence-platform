"use client";

import { LawReferenceCard } from "@/components/LawReferenceCard";
import { MOCK_ANALYSIS_RESULT } from "@/lib/mock-data";

export default function LawsPage() {
  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-3xl font-bold">Laws Database</h1>
      <p className="mt-2 text-muted-foreground">
        Statutes and regulations indexed for semantic legal retrieval.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {MOCK_ANALYSIS_RESULT.laws.map((law, i) => (
          <LawReferenceCard key={law.id} law={law} index={i} />
        ))}
      </div>
    </div>
  );
}
