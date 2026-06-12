# Database Schema

PostgreSQL on Supabase with the **pgvector** extension for semantic case search.

## Tables

### `cases`

Stores juvenile case records used for similarity retrieval.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Case name or short title |
| country | TEXT | United States, India, United Kingdom |
| jurisdiction | TEXT | State, court district, etc. |
| year | INTEGER | Year of decision or filing |
| court | TEXT | Court name |
| offense_type | TEXT | e.g. theft, cybercrime, assault |
| age_group | TEXT | e.g. 15-17, under 14 |
| facts | TEXT | Case facts (primary search field) |
| summary | TEXT | Brief summary |
| outcome | TEXT | Disposition or sentence |
| source_url | TEXT | Link to original record |
| embedding | vector(768) | gemini-embedding-001 |

### `laws`

Statutes and legal provisions for RAG report generation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| country | TEXT | Country |
| law_name | TEXT | Act or statute name |
| section | TEXT | Section number |
| legal_topic | TEXT | Topic tag |
| text | TEXT | Full section text |
| source_url | TEXT | Official source URL |
| embedding | vector(768) | gemini-embedding-001 |

### `generated_reports`

Stores user queries and generated research reports.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_case_facts | TEXT | Input facts from user |
| top_cases | JSONB | Retrieved case IDs and scores |
| laws_used | JSONB | Retrieved law IDs |
| report_text | TEXT | Generated report |
| created_at | TIMESTAMPTZ | Creation time |

### `query_embedding_cache`

Caches search-query embeddings (Phase 3) to avoid repeat Gemini API calls.

| Column | Type | Description |
|--------|------|-------------|
| cache_key | TEXT | SHA-256 of model + dimensions + query text |
| search_text | TEXT | Original query text |
| embedding | vector(768) | Cached query vector |
| model | TEXT | Embedding model name |
| hit_count | INTEGER | Times served from cache |
| created_at / last_hit_at | TIMESTAMPTZ | Timestamps |

## Indexes

- `cases_embedding_idx` — **HNSW** index on `cases.embedding` (cosine) for fast search at 10k+ rows
- `laws_embedding_idx` — **HNSW** index on `laws.embedding`
- `cases_country_idx` — B-tree on `country` for filtered search

## Setup

- **New or existing project:** run `docs/database_schema.sql` in the Supabase SQL Editor (one file; safe to re-run — upgrades IVFFlat indexes to HNSW if needed).
