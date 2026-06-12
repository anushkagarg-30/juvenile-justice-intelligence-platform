import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface JurisdictionBadgeProps {
  country: string;
  className?: string;
}

const COLORS: Record<string, string> = {
  "United States": "border-blue-500/30 bg-blue-500/10 text-blue-300",
  India: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  "United Kingdom": "border-violet-500/30 bg-violet-500/10 text-violet-300",
};

export function JurisdictionBadge({ country, className }: JurisdictionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(COLORS[country] ?? "border-white/20 bg-white/5", className)}
    >
      {country}
    </Badge>
  );
}
