"use client";

import { motion } from "framer-motion";
import { Scale, Search, Sparkles } from "lucide-react";

type LoadingMode = "search" | "report";

const COPY: Record<
  LoadingMode,
  { headline: string; subline: string; icons: typeof Search[] }
> = {
  search: {
    headline: "Searching similar cases and applicable laws…",
    subline: "Running vector search across the case and statute corpus",
    icons: [Search, Scale],
  },
  report: {
    headline: "Generating AI legal research report…",
    subline: "Synthesizing precedents, statutes, and cross-jurisdiction analysis",
    icons: [Scale, Sparkles],
  },
};

export function LoadingAnalysisAnimation({ mode = "search" }: { mode?: LoadingMode }) {
  const { headline, subline, icons } = COPY[mode];

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <motion.div
        className="relative mb-8 flex h-24 w-24 items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border border-blue-500/20" />
        <div className="absolute inset-2 rounded-full border border-violet-500/30 border-t-transparent" />
        <Sparkles className="h-8 w-8 text-blue-400" />
      </motion.div>

      <motion.div
        className="mb-6 flex gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {icons.map((Icon, i) => (
          <motion.div
            key={i}
            className="flex h-10 w-10 items-center justify-center rounded-lg glass"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          >
            <Icon className="h-4 w-4 text-blue-300" />
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="max-w-md font-serif text-xl text-foreground"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {headline}
      </motion.p>
      <p className="mt-3 text-sm text-muted-foreground">{subline}</p>
    </div>
  );
}
