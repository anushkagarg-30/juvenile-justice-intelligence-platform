"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVE_COUNTRIES, COMING_SOON_COUNTRIES } from "@/lib/jurisdictions";
import type { CaseAnalysisInput, Country } from "@/lib/types";

interface CaseInputFormProps {
  value: CaseAnalysisInput;
  onChange: (value: CaseAnalysisInput) => void;
}

const FIELD_SUGGESTIONS = {
  offenseType: ["Cybercrime", "Shoplifting", "Assault", "Drug possession", "Vandalism"],
  priorRecord: ["No prior offenses", "First offense", "One prior warning"],
  caseFacts:
    "e.g. 15-year-old, first offense, unauthorized school network access — no financial gain.",
  legalQuestion:
    "e.g. What dispositions are likely for a first-time juvenile cybercrime offender?",
};

export function CaseInputForm({ value, onChange }: CaseInputFormProps) {
  const update = <K extends keyof CaseAnalysisInput>(key: K, val: CaseAnalysisInput[K]) => {
    onChange({ ...value, [key]: val });
  };

  const toggleComparison = (country: Country) => {
    const current = value.comparisonCountries;
    if (current.includes(country)) {
      update(
        "comparisonCountries",
        current.filter((c) => c !== country),
      );
    } else {
      update("comparisonCountries", [...current, country]);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="country">Country / Jurisdiction</Label>
        <Select
          value={value.country}
          onValueChange={(v) => update("country", v as Country)}
        >
          <SelectTrigger id="country">
            <SelectValue placeholder="Select jurisdiction" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Available now</SelectLabel>
              {ACTIVE_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Coming soon</SelectLabel>
              {COMING_SOON_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c} disabled>
                  {c} — Coming soon
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Search corpus is live for United States, India, and United Kingdom. More jurisdictions
          are being indexed.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Juvenile Age</Label>
        <Input
          id="age"
          placeholder="e.g. 15"
          value={value.juvenileAge}
          onChange={(e) => update("juvenileAge", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="offense">Offense Type</Label>
        <Input
          id="offense"
          placeholder="e.g. Cybercrime"
          value={value.offenseType}
          onChange={(e) => update("offenseType", e.target.value)}
        />
        <SuggestionChips
          items={FIELD_SUGGESTIONS.offenseType}
          onSelect={(item) => update("offenseType", item)}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="prior">Prior Record</Label>
        <Input
          id="prior"
          placeholder="e.g. No prior offenses"
          value={value.priorRecord}
          onChange={(e) => update("priorRecord", e.target.value)}
        />
        <SuggestionChips
          items={FIELD_SUGGESTIONS.priorRecord}
          onSelect={(item) => update("priorRecord", item)}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="facts">Case Facts</Label>
        <Textarea
          id="facts"
          className="min-h-[140px]"
          placeholder="Describe the juvenile case in detail…"
          value={value.caseFacts}
          onChange={(e) => update("caseFacts", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{FIELD_SUGGESTIONS.caseFacts}</p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="question">Legal Question</Label>
        <Textarea
          id="question"
          className="min-h-[80px]"
          placeholder="What legal question should the analysis address?"
          value={value.legalQuestion}
          onChange={(e) => update("legalQuestion", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{FIELD_SUGGESTIONS.legalQuestion}</p>
      </div>

      <div className="space-y-3 md:col-span-2">
        <Label>Preferred Comparison Countries</Label>
        <div className="flex flex-wrap gap-2">
          {ACTIVE_COUNTRIES.map((country) => {
            const selected = value.comparisonCountries.includes(country);
            return (
              <button
                key={country}
                type="button"
                onClick={() => toggleComparison(country)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                  selected
                    ? "border-blue-500/50 bg-blue-600/20 text-blue-200"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
                }`}
              >
                {country}
              </button>
            );
          })}
          {COMING_SOON_COUNTRIES.map((country) => (
            <span
              key={country}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-4 py-1.5 text-sm text-muted-foreground/60"
            >
              {country}
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                Coming soon
              </Badge>
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Optional — select jurisdictions to emphasize in cross-country comparison.
        </p>
      </div>
    </div>
  );
}

function SuggestionChips({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (item: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-blue-500/30 hover:text-blue-200/90"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
