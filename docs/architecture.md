# Architecture

## Overview

The platform separates **fast vector search** (~1–3 seconds) from **slow LLM report generation** (15–60 seconds). Search scales to 10k+ cases via pgvector + HNSW; report generation stays an optional, on-demand step.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         User workflow (Phase 1)                          │
└──────────────────────────────────────────────────────────────────────────┘

  Dashboard                    Results                      Report
  ─────────                    ───────                      ──────
  Enter case facts    →    Cases + laws (~2s)    →    AI memo (optional, 15–60s)
       │                         │                            │
       │ POST /search/quick      │ POST /reports/generate     │
       └─────────────────────────┴────────────────────────────┘
```

## Production topology

```
┌─────────────────┐
│  Next.js UI     │  Vercel (frontend/)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  FastAPI API    │  Render (backend/)
│  ─────────────  │
│  Fast path:     │──────▶  Supabase PostgreSQL + pgvector (HNSW)
│  /search/quick  │              cases, laws, generated_reports
│                 │
│  Slow path:     │──────▶  Google AI
│  /reports/*     │         gemini-embedding-001 + Gemini LLM
└─────────────────┘
```

| Service | Host | Root directory |
|---------|------|----------------|
| Frontend | Vercel | `frontend/` |
| Backend | Render | `backend/` |
| Database | Supabase | — |

Auto-deploy: both Vercel and Render redeploy on push when connected to GitHub. See [deploy.md — Continuous deployment](deploy.md#continuous-deployment).

---

## Fast path: search (~1–3s)

**Endpoint:** `POST /search/quick`

1. User submits case facts from the dashboard.
2. Backend builds search text (facts + optional country/offense hints).
3. **One** query embedding via `gemini-embedding-001` (768 dimensions).
4. Parallel pgvector cosine search on `cases` and `laws` (same embedding).
5. Returns top similar cases + relevant laws — **no LLM call**.

Also available as standalone endpoints:

| Endpoint | Purpose |
|----------|---------|
| `POST /search/similar-cases` | Cases only (embeds per request) |
| `POST /search/relevant-laws` | Laws only (embeds per request) |

Prefer `/search/quick` in the UI — it embeds once and runs both searches in parallel.

### Vector index

- **HNSW** indexes on `cases.embedding` and `laws.embedding` (cosine distance).
- All schema and indexes: `docs/database_schema.sql` (safe to re-run; upgrades IVFFlat → HNSW if needed).

Target latency at 10k cases: sub-second DB search + ~1–2s embedding API round-trip.

---

## Slow path: report generation (15–60s)

**Endpoint:** `POST /reports/generate`

Triggered only when the user clicks **Generate AI Research Report** on the results page.

1. Embed query (or reuse context from search).
2. Retrieve top cases + laws via vector search.
3. Pass retrieved context to Gemini (`LLM_MODEL`, default `gemini-2.0-flash-lite`).
4. Save report to `generated_reports`; return markdown + metadata.

**Endpoint:** `GET /reports/{id}` — retrieve a saved report.

---

## Backend modules (`backend/app/`)

| Module | Role |
|--------|------|
| `main.py` | FastAPI app, CORS, health with corpus counts |
| `database.py` | Async SQLAlchemy + Supabase connection |
| `models.py` | Pydantic request/response schemas |
| `routes/search.py` | `/search/quick`, `/search/similar-cases`, `/search/relevant-laws` |
| `routes/reports.py` | `/reports/generate`, `/reports/{id}` |
| `services/quick_search_service.py` | Single-embed parallel case + law search |
| `services/case_search_service.py` | Case vector similarity |
| `services/law_search_service.py` | Law vector similarity |
| `services/report_service.py` | RAG report pipeline |
| `services/llm_service.py` | Gemini report generation |
| `services/embedding_service.py` | Query/document embeddings |

---

## Frontend flow (`frontend/`)

| Page | Behavior |
|------|----------|
| Dashboard | `searchCase()` → `POST /search/quick` only |
| Results | Shows cases, laws, search time; optional `generateReportForAnalysis()` |
| Report | Full memo + PDF export (after generation) |
| Settings | Live/mock mode + `/health` corpus stats |

Session state: `AnalysisResult` in `sessionStorage` with `reportReady: boolean`.

---

## Data pipeline (offline — not via website)

Bulk ingest runs as batch scripts, not through the UI:

| Script | Purpose |
|--------|---------|
| `scripts/seed_data.py` | Load curated `sample_cases.csv` + `sample_laws.csv` |
| `scripts/generate_bulk_cases.py` | Write synthetic `bulk_cases.csv` (deterministic, seed=42) |
| `scripts/bulk_ingest.py` | **Phase 2 pipeline:** CSV seed → expand to target (default 1k) → optional `--embed` |
| `scripts/generate_embeddings.py` | Embed rows missing vectors (resume-safe) |

```bash
cd backend
source .venv/bin/activate

# Expand corpus to 1,000 cases and embed (15–30 min for embeddings)
python scripts/bulk_ingest.py --target-cases 1000 --generate-bulk-csv --embed

# Re-run embeddings only after partial failure
python scripts/generate_embeddings.py
```

Current corpus: **1,000 cases** (expandable to **10,000**), **56 laws**.

### Scale to 10,000 cases

Generate and ingest in batches from your machine (not Supabase SQL Editor):

```bash
cd backend
source .venv/bin/activate

# From 1k → 10k (generates ~9k new cases in memory, then embed — allow several hours)
python scripts/bulk_ingest.py --target-cases 10000 --seed 10042 --embed

# Resume embeddings only after API rate limits
python scripts/generate_embeddings.py
```

Use `--seed 10042` (or any new seed) so the 10k batch does not collide with the Phase 2 corpus.

### Query embedding cache (Phase 3)

Repeat searches skip the Gemini embed API call when the same query text was seen before.

- **In-memory LRU** (500 entries default) — fast within a single Render instance
- **PostgreSQL `query_embedding_cache` table** — persists across restarts (run updated `docs/database_schema.sql` once)

Config (`backend/.env`):

```env
EMBEDDING_CACHE_ENABLED=true
EMBEDDING_CACHE_DB=true
EMBEDDING_CACHE_MAX_ENTRIES=500
```

`/health` reports `embedding_cache_enabled` and `embedding_cache_entries`.  
`POST /search/quick` returns `embedding_cache_hit: true` on cache hits.

---

## Scaling roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **1** | Split search vs report; HNSW; `/search/quick` | Done |
| **2** | Bulk ingest pipeline → ~1,000 cases | Done |
| **3** | Scale to 10k + query embedding cache | Done |
| **4** | Rate limiting, tests, production hardening | Planned |

---

## Health check

`GET /health` returns service status and optional corpus counts:

```json
{
  "status": "ok",
  "database_configured": true,
  "embedding_configured": true,
  "case_count": 96,
  "law_count": 56,
  "cases_embedded": 96,
  "laws_embedded": 56
}
```

---

## Security notes

- API keys in environment variables only (never committed)
- CORS: explicit origins + `*.vercel.app` regex for preview deploys
- Row Level Security on Supabase for production
- Sample seed data is synthetic/anonymized — verify against official sources before production use
