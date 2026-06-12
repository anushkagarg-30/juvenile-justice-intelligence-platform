"use client";

import { motion } from "framer-motion";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cleanReportText } from "@/lib/report-utils";

interface ReportSectionProps {
  title: string;
  content: string;
  index: number;
}

export function ReportSection({ title, content, index }: ReportSectionProps) {
  const cleaned = cleanReportText(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownContent content={cleaned} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
