-- Juvenile Justice Intelligence Platform — Supabase schema
-- Single source of truth: run this file in the Supabase SQL Editor.
--
-- • Fresh project: run the entire file.
-- • Existing project (e.g. upgrading IVFFlat → HNSW): run the entire file;
--   CREATE IF NOT EXISTS skips existing tables; vector index section recreates HNSW indexes.
--
-- Embeddings: gemini-embedding-001 (768 dimensions)

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── cases ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cases (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    country       TEXT NOT NULL CHECK (country IN ('United States', 'India', 'United Kingdom')),
    jurisdiction  TEXT,
    year          INTEGER,
    court         TEXT,
    offense_type  TEXT,
    age_group     TEXT,
    facts         TEXT NOT NULL,
    summary       TEXT,
    outcome       TEXT,
    source_url    TEXT,
    embedding     vector(768),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cases_country_idx ON cases (country);
CREATE INDEX IF NOT EXISTS cases_offense_type_idx ON cases (offense_type);

-- ─── laws ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS laws (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country       TEXT NOT NULL CHECK (country IN ('United States', 'India', 'United Kingdom')),
    law_name      TEXT NOT NULL,
    section       TEXT,
    legal_topic   TEXT,
    text          TEXT NOT NULL,
    source_url    TEXT,
    embedding     vector(768),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS laws_country_idx ON laws (country);

-- ─── generated_reports ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS generated_reports (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_case_facts  TEXT NOT NULL,
    top_cases        JSONB,
    laws_used        JSONB,
    report_text      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── query_embedding_cache (Phase 3) ─────────────────────────────────────────
-- Caches search-query embeddings to skip repeat Gemini API calls.

CREATE TABLE IF NOT EXISTS query_embedding_cache (
    cache_key    TEXT PRIMARY KEY,
    search_text  TEXT NOT NULL,
    embedding    vector(768) NOT NULL,
    model        TEXT NOT NULL,
    hit_count    INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_hit_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS query_embedding_cache_last_hit_idx
    ON query_embedding_cache (last_hit_at DESC);

-- ─── vector indexes (HNSW) ───────────────────────────────────────────────────
-- Drops old IVFFlat indexes if present, then creates HNSW for fast search at 10k+ rows.

DROP INDEX IF EXISTS cases_embedding_idx;
DROP INDEX IF EXISTS laws_embedding_idx;

CREATE INDEX cases_embedding_idx
    ON cases USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX laws_embedding_idx
    ON laws USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ─── similarity search function ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_cases(
    query_embedding vector(768),
    match_count     INT DEFAULT 10,
    filter_country  TEXT DEFAULT NULL
)
RETURNS TABLE (
    id            UUID,
    title         TEXT,
    country       TEXT,
    jurisdiction  TEXT,
    year          INTEGER,
    court         TEXT,
    offense_type  TEXT,
    age_group     TEXT,
    facts         TEXT,
    summary       TEXT,
    outcome       TEXT,
    source_url    TEXT,
    similarity    FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.country,
        c.jurisdiction,
        c.year,
        c.court,
        c.offense_type,
        c.age_group,
        c.facts,
        c.summary,
        c.outcome,
        c.source_url,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM cases c
    WHERE c.embedding IS NOT NULL
      AND (filter_country IS NULL OR c.country = filter_country)
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
