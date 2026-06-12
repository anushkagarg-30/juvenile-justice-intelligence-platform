export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK !== "false";
}

/** Same-origin `/api` proxy — avoids browser CORS to Render. */
export function getApiBase(): string {
  return "/api";
}

export function getApiModeLabel(): string {
  if (isMockMode()) return "Mock data (demo mode)";
  const backend = process.env.NEXT_PUBLIC_API_URL;
  if (backend) return `Live API → ${backend} (via /api proxy)`;
  return "Live API → localhost:8000 (via /api proxy)";
}
