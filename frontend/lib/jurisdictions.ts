import type { Country } from "./types";

/** Jurisdictions with embedded case corpus in the database. */
export const ACTIVE_COUNTRIES: readonly Country[] = [
  "United States",
  "India",
  "United Kingdom",
] as const;

/** Shown in UI; search corpus not available yet. */
export const COMING_SOON_COUNTRIES = [
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Brazil",
  "South Africa",
  "Japan",
  "Mexico",
] as const;

export type ComingSoonCountry = (typeof COMING_SOON_COUNTRIES)[number];

export function isActiveCountry(value: string): value is Country {
  return (ACTIVE_COUNTRIES as readonly string[]).includes(value);
}
