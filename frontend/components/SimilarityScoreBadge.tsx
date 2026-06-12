import { cn } from "@/lib/utils";

interface SimilarityScoreBadgeProps {
  score: number;
  className?: string;
}

export function SimilarityScoreBadge({ score, className }: SimilarityScoreBadgeProps) {
  const pct = (score * 100).toFixed(1);
  const color =
    score >= 0.8
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
      : score >= 0.7
        ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
        : "border-white/20 bg-white/5 text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums",
        color,
        className,
      )}
    >
      {pct}% match
    </span>
  );
}
