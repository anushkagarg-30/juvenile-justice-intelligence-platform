"use client";

import { Suspense } from "react";
import ReportPageContent from "./ReportPageContent";

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-10 text-muted-foreground">Loading report…</div>}>
      <ReportPageContent />
    </Suspense>
  );
}
