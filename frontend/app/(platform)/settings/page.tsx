"use client";

import { useEffect, useState } from "react";
import { checkApiHealth } from "@/lib/api";
import { getApiModeLabel, isMockMode } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [health, setHealth] = useState<Awaited<ReturnType<typeof checkApiHealth>> | null>(null);
  const mockMode = isMockMode();

  useEffect(() => {
    if (!mockMode) {
      checkApiHealth().then(setHealth);
    }
  }, [mockMode]);

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Configure API connection and preferences.</p>

      <Card className="mt-8 max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">API Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={mockMode ? "secondary" : "success"}>
              {mockMode ? "Demo" : "Live"}
            </Badge>
            <span className="text-muted-foreground">{getApiModeLabel()}</span>
          </div>

          {!mockMode && health && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              {health.ok ? (
                <ul className="space-y-1 text-muted-foreground">
                  <li className="text-emerald-300">Backend connected</li>
                  <li>Database: {health.databaseConfigured ? "configured" : "missing"}</li>
                  <li>Embeddings: {health.embeddingConfigured ? "configured" : "missing"}</li>
                  {health.caseCount != null && (
                    <li>
                      Corpus: {health.caseCount} cases ({health.casesEmbedded ?? 0} embedded),{" "}
                      {health.lawCount ?? 0} laws ({health.lawsEmbedded ?? 0} embedded)
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-red-300">{health.error ?? "Backend unreachable"}</p>
              )}
            </div>
          )}

          <div className="space-y-2 text-muted-foreground">
            <p>
              <code className="rounded bg-white/10 px-1.5 py-0.5">NEXT_PUBLIC_API_URL</code> —
              Render backend URL (production)
            </p>
            <p>
              <code className="rounded bg-white/10 px-1.5 py-0.5">NEXT_PUBLIC_USE_MOCK=false</code>{" "}
              — enable live FastAPI integration
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
