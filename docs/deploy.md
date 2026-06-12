# Deployment Guide

Deploy the **backend** to Render, the **frontend** to Vercel, and keep **Supabase** as the database.

## Architecture

```
Vercel (Next.js)  ──HTTPS──▶  Render (FastAPI)  ──▶  Supabase (PostgreSQL + pgvector HNSW)
                                      │
                                      └──▶  Google AI (embeddings + report LLM)
```

**User flow in production:**

1. Dashboard → `POST /search/quick` (~1–3s) → Results page
2. Results → optional `POST /reports/generate` (15–60s) → Report page

---

## Continuous deployment

**Yes — both Vercel and Render can auto-deploy on every commit and push**, as long as the repo is connected to GitHub (or GitLab/Bitbucket).

### Vercel

1. Project → **Settings** → **Git**
2. **Production Branch** is usually `main` — pushes to this branch trigger a production deploy automatically.
3. Pull requests get **Preview Deployments** by default.
4. No extra config needed beyond the initial import.

### Render

1. Service → **Settings** → **Build & Deploy**
2. **Auto-Deploy** should be **Yes** (default when created from a connected repo).
3. **Branch** — set to `main` (or your default branch).
4. Each push to that branch triggers: pull → `pip install` → restart.

### Typical workflow

```bash
git add .
git commit -m "Your change"
git push origin main
```

→ Vercel rebuilds `frontend/` and Render rebuilds `backend/` in parallel. No manual redeploy unless you disabled auto-deploy or changed env vars (env changes on Render/Vercel also trigger a redeploy when saved).

### What does *not* auto-update

| Change | Action required |
|--------|-----------------|
| New env var (e.g. `GOOGLE_API_KEY`) | Set in Render/Vercel dashboard once |
| Database schema / HNSW migration | Run SQL manually in Supabase SQL Editor |
| Seed data / embeddings | Run `seed_data.py` + `generate_embeddings.py` locally against prod `DATABASE_URL` |

---

## Prerequisites

- GitHub repo pushed with this project
- [Supabase](https://supabase.com) project with schema applied (`docs/database_schema.sql`)
- HNSW vector indexes are included in `docs/database_schema.sql` (re-run to upgrade from IVFFlat)
- Seed data and embeddings generated (run scripts against prod DB once)
- [Google AI Studio API key](https://aistudio.google.com/apikey)

---

## Step 1: Supabase (production database)

1. Create a Supabase project (or use your existing one).
2. Run `docs/database_schema.sql` in the SQL Editor (fresh or existing — re-run upgrades indexes to HNSW).
3. Seed data (from your machine, pointing at prod):

   ```bash
   cd backend
   source .venv/bin/activate
   # Set DATABASE_URL in .env to your Supabase pooler URL
   python scripts/bulk_ingest.py --target-cases 1000 --embed
   ```

   This loads curated + bulk CSVs (~1,000 cases) and embeds pending rows. For laws only or a smaller batch:

   ```bash
   python scripts/seed_data.py
   python scripts/generate_embeddings.py
   ```

4. Copy the **Transaction pooler** connection string (port **6543**):

   ```
   postgresql+asyncpg://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

   Use the `postgresql+asyncpg://` prefix for this app.

---

## Step 2: Backend on Render

### Option A — Blueprint (recommended)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect your GitHub repo.
3. Render detects `render.yaml` at the repo root.
4. Set **secret** environment variables when prompted:
   - `DATABASE_URL` — Supabase pooler URL from Step 1
   - `GOOGLE_API_KEY` — your Google AI key
   - `CORS_ORIGINS` — your Vercel production URL (see Step 4)
5. Deploy and wait for the service to go live.
6. Verify: `https://<your-service>.onrender.com/health`

   Expected response:

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

### Option B — Manual web service

1. **New** → **Web Service** → connect repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** Yes
3. Environment variables:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Supabase pooler URL |
   | `GOOGLE_API_KEY` | Your Google AI key |
   | `EMBEDDING_PROVIDER` | `google` |
   | `EMBEDDING_MODEL` | `gemini-embedding-001` |
   | `EMBEDDING_DIMENSIONS` | `768` |
   | `LLM_MODEL` | `gemini-2.0-flash-lite` |
   | `CORS_ORIGINS` | Your Vercel URL (see Step 4) |

### Render free tier note

Free services spin down after inactivity. The first request after idle may take 30–60 seconds.

---

## Step 3: Frontend on Vercel

1. Go to [Vercel](https://vercel.com) → **Add New** → **Project** → import your repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (auto-detected via `frontend/vercel.json`)
   - **Production Branch:** `main`
3. Environment variables:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com` |
   | `NEXT_PUBLIC_USE_MOCK` | `false` |

   No trailing slash on the API URL.

4. Deploy and open your Vercel URL (e.g. `https://your-app.vercel.app`).

Future pushes to `main` redeploy automatically.

---

## Step 4: Connect frontend and backend (CORS)

1. In **Render** → your service → **Environment**, set:

   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```

   Preview deployments are also allowed via `*.vercel.app` regex in code. For explicit origins, comma-separate:

   ```
   CORS_ORIGINS=https://your-app.vercel.app,https://your-app-git-main-you.vercel.app
   ```

2. Save — Render redeploys automatically.

3. Test from the Vercel site:
   - **Search Similar Cases** should return results in a few seconds
   - **Generate AI Research Report** on the results page (15–60s, optional)

---

## Step 5: Smoke test checklist

- [ ] `GET https://<render>/health` → `embedding_configured: true` + corpus counts
- [ ] `GET https://<render>/` → JSON lists `quick_search`, `similar_cases`, `relevant_laws`, `generate_report`
- [ ] Vercel UI: dashboard search completes in ~2–5s
- [ ] Vercel UI: optional report generation works from results page
- [ ] Browser devtools: no CORS errors on API calls
- [ ] Supabase: HNSW indexes present (`cases_embedding_idx`, `laws_embedding_idx`)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `503 DATABASE_URL is not configured` | Set `DATABASE_URL` on Render; redeploy |
| `503 GOOGLE_API_KEY is not configured` | Set `GOOGLE_API_KEY` on Render |
| CORS error in browser | Add exact Vercel origin to `CORS_ORIGINS` on Render |
| API calls go to wrong host | Set `NEXT_PUBLIC_API_URL` on Vercel; redeploy frontend |
| Empty search results | Run seed + embedding scripts against prod DB |
| Slow first request | Render free tier cold start — normal |
| DB connection errors | Use Supabase **transaction pooler** (port 6543), not direct 5432 |
| Push didn't deploy | Check Auto-Deploy is enabled on Render; check Vercel Git connection |
| Search slow at scale | Re-run `docs/database_schema.sql` (HNSW index section) |

---

## Environment reference

### Backend (Render)

See `backend/.env.example` for full list. Required in production:

- `DATABASE_URL`
- `GOOGLE_API_KEY`
- `CORS_ORIGINS`

### Frontend (Vercel)

- `NEXT_PUBLIC_API_URL` — Render backend URL
- `NEXT_PUBLIC_USE_MOCK` — set to `false` for live API

Local dev: Next.js can proxy to `localhost:8000` when `NEXT_PUBLIC_API_URL` is unset.
