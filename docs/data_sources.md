# Data Sources

Curated sources for building the `cases` and `laws` tables.

## United States (priority 1)

| Source | URL | Use for |
|--------|-----|---------|
| OJJDP / NJCDA | https://www.ojjdp.gov/ojstatbb/ | Offense types, age groups, dispositions |
| Juvenile Court Statistics | https://www.ojjdp.gov/ojstatbb/ezajcs/ | Aggregate juvenile court data |
| CourtListener API | https://www.courtlistener.com/help/api/ | Case opinions, facts, outcomes |
| U.S. Code | https://uscode.house.gov/ | Federal juvenile statutes |

**MVP target:** 60–80 cases, 20–30 laws  
**Phase 2 bulk corpus:** `backend/data/bulk_cases.csv` — 904 synthetic cases (deterministic templates; replace with verified records for production)

## Bulk ingest (Phase 2)

| Script | Purpose |
|--------|---------|
| `scripts/bulk_ingest.py` | Load CSVs, expand to `--target-cases` (default 1000), optional `--embed` |
| `scripts/generate_bulk_cases.py` | Regenerate `bulk_cases.csv` |
| `scripts/generate_embeddings.py` | Resume embedding for rows with `embedding IS NULL` |

CSV files:

| File | Rows | Description |
|------|------|-------------|
| `backend/data/sample_cases.csv` | 96 | Curated hand-authored cases |
| `backend/data/bulk_cases.csv` | 904 | Synthetic expansion (seed=42) |
| `backend/data/sample_laws.csv` | 56 | Statutes across three jurisdictions |

## India

| Source | URL | Use for |
|--------|-----|---------|
| India Code | https://www.indiacode.nic.in/ | Juvenile Justice Act, POCSO, IPC sections |
| eCourts | https://services.ecourts.gov.in/ | Case metadata and judgments |
| Supreme Court | https://main.sci.gov.in/judgments | Higher-court precedent |

**MVP target:** 20–30 cases, 15–20 laws

## United Kingdom

| Source | URL | Use for |
|--------|-----|---------|
| legislation.gov.uk | https://www.legislation.gov.uk/ | Children Act, youth justice statutes |
| Find Case Law | https://caselaw.nationalarchives.gov.uk/ | Official judgments |
| BAILII | https://www.bailii.org/ | Additional case law |

**MVP target:** 20–30 cases, 15–20 laws

## International (later)

| Source | URL | Use for |
|--------|-----|---------|
| UNICEF Data | https://data.unicef.org/ | Country indicators, detention stats |

## Field mapping

### Cases CSV → `cases` table

```
title, country, jurisdiction, year, court, offense_type, age_group, facts, summary, outcome, source_url
```

### Laws CSV → `laws` table

```
country, law_name, section, legal_topic, text, source_url
```

## Licensing & ethics

- Respect each source's terms of use and API rate limits
- Anonymize or synthesize facts where full case text is restricted
- Always store `source_url` for traceability
- This MVP uses illustrative sample data; replace with verified records before production
