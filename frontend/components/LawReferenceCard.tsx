"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { JurisdictionBadge } from "@/components/JurisdictionBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LawReference } from "@/lib/types";

interface LawReferenceCardProps {
  law: LawReference;
  index: number;
}

export function LawReferenceCard({ law, index }: LawReferenceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-base">
              {law.name}
              {law.section ? ` §${law.section}` : ""}
            </CardTitle>
            <JurisdictionBadge country={law.country} />
          </div>
          <p className="text-xs text-muted-foreground">{law.topic}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground/85">{law.text}</p>
          <Button variant="ghost" size="sm" asChild>
            <a href={law.sourceUrl} target="_blank" rel="noopener noreferrer">
              View source
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
