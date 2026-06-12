# AI-Powered Juvenile Justice Intelligence Platform

MVP prototype for legal research on juvenile justice cases across the **United States**, **India**, and **United Kingdom**.

## What it does

1. User enters juvenile case facts
2. **Fast search** (~1–3s): top similar cases + relevant laws via `POST /search/quick`
3. **Optional report** (15–60s): AI legal research memo via `POST /reports/generate` from the results page

Search and report generation are separate paths so retrieval stays fast at scale (10k+ cases target).

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js + Tailwind + shadcn/ui (Vercel) |
| Backend | FastAPI (Render) |
| Database | Supabase PostgreSQL + pgvector |
| AI/Search | Embeddings + RAG |

## Project structure

```
juvenile-justice-intelligence-platform/
├── backend/          # FastAPI API
├── frontend/         # Next.js app (Vercel)
├── docs/           # Architecture & schema docs
└── README.md
```

## Quick start (backend)

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `docs/database_schema.sql` in the SQL Editor
3. Copy your project URL and keys

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
```

### 3. Install and run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Seed sample data and generate embeddings

```bash
cd backend
python scripts/seed_data.py          # curated 96 cases + 56 laws
python scripts/generate_embeddings.py
```

The seed script is idempotent (skips duplicates) and prints counts by country.

### 4b. Phase 2 — expand to 1,000 cases (bulk ingest)

```bash
cd backend
python scripts/bulk_ingest.py --target-cases 1000 --embed
```

### 4c. Phase 3 — scale to 10,000 cases + embedding cache

Run updated `docs/database_schema.sql` once (adds `query_embedding_cache` table), then:

```bash
python scripts/bulk_ingest.py --target-cases 10000 --seed 10042 --embed
```

Repeat searches use cached query embeddings (`EMBEDDING_CACHE_ENABLED=true`).

### 5. Test quick search (cases + laws, one embedding)

```bash
curl -X POST http://localhost:8000/search/quick \
  -H "Content-Type: application/json" \
  -d '{"facts": "15-year-old charged with cybercrime, no prior offenses", "country": "United States"}'
```

### 6. Test report generation

```bash
curl -X POST http://localhost:8000/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"facts": "15-year-old charged with cybercrime, no prior offenses", "country": "United States"}'
```

Use the returned `id` to retrieve the saved report:

```bash
curl http://localhost:8000/reports/<report-id>
```

## Quick start (frontend)

With the backend running on port 8000:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

The Next.js dev server proxies API requests to the backend when `NEXT_PUBLIC_API_URL` is unset. For production, set:

- `NEXT_PUBLIC_API_URL` — your Render backend URL
- `NEXT_PUBLIC_USE_MOCK=false` — to use live API instead of demo mock data

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check + corpus counts |
| POST | `/search/quick` | **Fast:** cases + laws (single embed) |
| POST | `/search/similar-cases` | Similar cases only |
| POST | `/search/relevant-laws` | Relevant laws only |
| POST | `/reports/generate` | **Slow:** full AI research report |
| GET | `/reports/{id}` | Retrieve a previously generated report |

## This week's build order

- [x] Project scaffold
- [x] Database schema
- [x] Sample case data (CSV)
- [x] Embeddings script
- [x] `/search/similar-cases` endpoint
- [x] `/reports/generate` endpoint
- [x] React UI

## Deployment

See **[docs/deploy.md](docs/deploy.md)** for Render + Vercel setup. Architecture details: **[docs/architecture.md](docs/architecture.md)**.

| Service | Host | Auto-deploy on push |
|---------|------|---------------------|
| Frontend | Vercel (`frontend/`) | Yes (when GitHub connected) |
| Backend | Render (`backend/`) | Yes (Auto-Deploy enabled) |
| Database | Supabase | Manual SQL + seed scripts |

After connecting GitHub, `git push origin main` redeploys Vercel and Render automatically.

For research and educational use. Verify all legal data against official sources before production use.
