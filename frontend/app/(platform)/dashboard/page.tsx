"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { CaseInputForm } from "@/components/CaseInputForm";
import { LoadingAnalysisAnimation } from "@/components/LoadingAnalysisAnimation";
import { StatusMessage } from "@/components/StatusMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveAnalysisResult, searchCase } from "@/lib/api";
import { EMPTY_CASE_INPUT } from "@/lib/mock-data";
import type { CaseAnalysisInput } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [form, setForm] = useState<CaseAnalysisInput>(EMPTY_CASE_INPUT);
  const [loading, setLoading] = useState(false);

  const canSubmit = form.caseFacts.trim().length >= 10;

  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const result = await searchCase(form);
      saveAnalysisResult(result);
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-serif text-3xl font-bold">New Case Analysis</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Enter juvenile case details to retrieve similar precedents and applicable laws in
          seconds. Generate a full AI research report from the results page when ready.
        </p>
      </motion.div>

      {error ? (
        <div className="mt-6">
          <StatusMessage message={error} />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-10">
          <LoadingAnalysisAnimation mode="search" />
        </div>
      ) : (
        <Card className="mt-8 border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>New Case Intake</CardTitle>
            <CardDescription>
              Structured fields help the semantic search engine match the most relevant precedents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <CaseInputForm value={form} onChange={setForm} />
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                variant="glow"
                size="lg"
                className="w-full sm:w-auto"
                disabled={!canSubmit}
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
                Search Similar Cases
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
