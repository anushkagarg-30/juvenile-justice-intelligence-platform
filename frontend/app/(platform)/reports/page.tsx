"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_REPORT } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-3xl font-bold">Saved Reports</h1>
      <p className="mt-2 text-muted-foreground">Previously generated legal research analyses.</p>
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-4 w-4 text-blue-400" />
              {MOCK_REPORT.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Demo report · {new Date(MOCK_REPORT.generatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
