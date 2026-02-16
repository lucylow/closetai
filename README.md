# ClosetAI

## Table of contents

* [Project overview](#project-overview)
* [Key goals & success metrics](#key-goals--success-metrics)
* [High-level architecture](#high-level-architecture)
* [Technical diagrams (Mermaid)](#technical-diagrams-mermaid)
* [Data model & schema](#data-model--schema)
* [Core subsystems](#core-subsystems)

  * [Frontend (UI / UX)](#frontend-ui--ux)
  * [Backend API & services](#backend-api--services)
  * [Ingestion & crawler](#ingestion--crawler)
  * [Embeddings & ML services](#embeddings--ml-services)
  * [Storage & persistence](#storage--persistence)
* [Developer setup (run locally)](#developer-setup-run-locally)

  * [Prerequisites](#prerequisites)
  * [Quickstart (demo mode)](#quickstart-demo-mode)
  * [Apply DB migrations](#apply-db-migrations)
  * [Run services](#run-services)
* [API reference (selected endpoints)](#api-reference-selected-endpoints)
* [Ingestion workflow — detailed sequence](#ingestion-workflow---detailed-sequence)
* [AI & personalization design](#ai--personalization-design)

  * [Embeddings strategy](#embeddings-strategy)
  * [Candidate generation & ranking](#candidate-generation--ranking)
  * [Feature store & personalization](#feature-store--personalization)
* [Testing strategy](#testing-strategy)
* [CI / CD recommendations](#ci--cd-recommendations)
* [Monitoring & observability](#monitoring--observability)
* [Security, privacy & compliance](#security-privacy--compliance)
* [Monetization & business hooks](#monetization--business-hooks)
* [Admin / operator tools](#admin--operator-tools)
* [Troubleshooting & common issues](#troubleshooting--common-issues)
* [Roadmap & prioritized PRs](#roadmap--prioritized-prs)
* [Contributing guide](#contributing-guide)
* [Acknowledgements & sponsors](#acknowledgements--sponsors)
* [License](#license)

---

# Project overview

**ClosetAI** is a personal wardrobe assistant that helps users catalog clothing, generate outfit suggestions, virtually try on garments, and create social content. It combines image processing, computer vision, NLP (for captions & trend extraction), and personalized recommender systems.

This repository is the home of:

* frontend web app (React + TypeScript + Tailwind by default)
* backend API and microservices (Node/TypeScript)
* ingestion tools (crawler connectors, parsers)
* embedding and ML services (Python, FastAPI / PyTorch / sentence-transformers)
* demos & integration stubs (sponsor APIs, payment demo)
* tests, migrations, Docker-compose for demo environments

This README documents an improved architecture and is intended as a single source of truth for contributors, judges, and maintainers.

---

# Key goals & success metrics

**Product goals**

* Make it trivial for a judge or new user to demonstrate value in <10 minutes.
* Provide reproducible demo mode that requires no external API keys.
* Ship an extensible ingestion pipeline for trend & product signals.
* Deliver a clear path from images → embeddings → personalized outfit suggestions.

**Key success metrics (instrumented in analytics)**

* Time-to-first-outfit (TTFO) < 3 minutes
* Onboarding completion rate > 60%
* Try-on conversion rate (%, saves/tryons)
* MRR (for monetization features once enabled)
* Ingestion freshness (median latency publish → ingest)

---

# High-level architecture

A short summary of the running system and its major components:

```
User (Web / Mobile)
  ↕
Frontend (React) — interacts with API
  ↕
API Gateway / Backend (Node/Express, TypeScript)
  ↕                   ↘
Feature Store (Postgres)  Worker Queue (Bull / Redis)
  ↕                      ↘
Storage (MinIO / S3)   Ingest Workers -> Crawler / Connectors
  ↕
Embedding & ML services (Python FastAPI, sentence-transformers / Torch)
  ↕
ANN / Vector DB (Faiss / Milvus)  / fallback: Postgres float8[]
```

Goals: decouple ingestion, enrichment, storage, and serving. Provide demo fallbacks for external dependencies.

---

# Technical diagrams (Mermaid)

Use these diagrams in PRs and docs. Mermaid is supported on GitHub in markdown files.

## Architecture overview

```mermaid
flowchart LR
  A[User: Browser / Mobile App] -->|HTTP/WS| B[Frontend (React + TS)]
  B -->|REST/GraphQL| C[API Server (Node/Express)]
  C --> D[Postgres Feature Store]
  C --> E[Redis / Bull Queue]
  E --> F[Ingest Worker]
  F --> G[Storage (MinIO / S3)]
  F --> H[Embedding Service (FastAPI)]
  H --> I[Embedding Store (Postgres or Vector DB)]
  C --> J[Recommendation Service (calls Embedding/Vector DB)]
  C --> K[Admin Dashboard]
  style H fill:#f9f,stroke:#333,stroke-width:2px
  style I fill:#bbf,stroke:#333,stroke-width:1px
```

## Sequence: Upload → Ingest → Try-On

```mermaid
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant API as API Server
  participant W as Worker
  participant S as Storage
  participant E as Embedding Service
  participant DB as Postgres

  U->>F: Upload photo + metadata
  F->>API: POST /api/items/upload
  API->>DB: create item placeholder (status: processing)
  API->>W: enqueue ingest job
  W->>S: write raw image
  W->>E: request image embedding
  E-->>W: vector
  W->>DB: store embedding & artifact metadata
  W->>DB: update item status: ready
  API->>F: 200 OK (upload accepted)
  F->>API: GET /api/items/:id -> shows thumbnails / try-on button
```

## ER Diagram (simplified)

```mermaid
erDiagram
  USERS ||--o{ WARDROBE_ITEMS : owns
  WARDROBE_ITEMS ||--o{ ARTIFACTS : contains
  ARTIFACTS ||--o{ ITEM_EMBEDDINGS : has
  USERS ||--o{ USER_EMBEDDINGS : has
  USERS ||--o{ INTERACTIONS : performs
  SUBSCRIPTIONS ||--o{ INVOICES : generates
```

---

# Data model & schema

This project uses Postgres as the canonical feature store and metadata store for the following tables (core subset):

* `users` — anonymized user records (consent tracking included)
* `wardrobe_items` — item metadata, owner, version
* `artifacts` — image records tied to wardrobe items (sha256, pHash, storage_path)
* `item_embeddings` — vector float8[] per artifact + model metadata
* `user_embeddings` — per-user aggregated embeddings for personalization
* `interactions` — saves, views, try-ons, purchases
* `trend_topics` & `trend_signals` — aggregated trend signals from crawler
* `billing_*` tables — subscriptions, invoices, sponsor accounts (monetization PRs)

Migrations live in `/migrations` and are idempotent. When adding new tables, add reversible migrations and document schema changes in the PR.

---

# Core subsystems (detailed)

## Frontend (UI / UX)

* Tech: React + TypeScript + Tailwind CSS.
* Key pages:

  * Onboarding modal + demo mode CTA
  * Wardrobe gallery (upload, tag, crop)
  * Outfit suggestions (cards with Try-On & Generate Caption)
  * Try-On modal (sponsor selection, background, lighting)
  * Create Post (caption composer with tone selection)
  * Billing & settings (for monetization)
* Accessibility: WCAG AA targets, keyboard navigation, ARIA labels.
* Testing: React Testing Library / Vitest for unit tests, Playwright for E2E smoke tests (CI).

**Developer tips**

* Keep a demo mode flag (`VITE_DEMO_MODE`) to show example photos and avoid requiring API keys during demos.
* Provide "Try sample" buttons for judges.

## Backend API & services

* Tech: Node.js + TypeScript + Express.
* Responsibilities:

  * Authentication / Session (for demo, optional ephemeral anon ids).
  * Item upload, ingest job enqueueing.
  * Search and recommendations endpoints.
  * Billing / payment adapter (Stripe wrapper + DEMO_MODE).
  * Admin endpoints for trend review and sponsor reconciliation.
* Patterns:

  * Small, well-tested modules (e.g., `ingest/`, `services/`, `api/` routes).
  * Background workers use Bull/BullMQ + Redis (or simple job runner for demo).
  * Use sane timeouts for external calls and graceful fallbacks.

## Ingestion & crawler

* Purpose: gather merchant product feeds, editorial trend signals, social hashtags, and images.
* Connectors:

  * RSS/Atom readers
  * Sitemaps parser
  * Merchant API / CSV connector
  * Hashtag stream collector (via approved APIs)
* Pipeline:

  * Manifest => Connector => Fetcher => Parser => Validator => Enrich (NLP & Vision) => Store
* Legal: obey `robots.txt`, store ToS snapshot, never bypass paywalls, redact PII, maintain takedown procedures.

## Embeddings & ML services

* Embedding Service (Python FastAPI)

  * `/embed_image` and `/embed_text` endpoints
  * Use open-source CPU-friendly models for demo: `clip-ViT-B-32` (image) and `paraphrase-MiniLM-L6-v2` (text).
  * Normalize vectors before storing.
* Ranker / Recommender

  * Retrieval: ANN (Faiss / Milvus) planned; fallback: brute-force cosine in Postgres.
  * Ranking: MLP pairwise ranker for initial demo; transformer/listwise later.
* Model lifecycle: training scripts under `/ml/train/`, model registry entries in DB (`model_versions`), CI for retrain.

## Storage & persistence

* Postgres for structured metadata and embeddings (float8[] for demo).
* MinIO (S3-compatible) for raw images and processed assets. Local filesystem fallback for demo.
* Redis for queues & caches.
* Optional Vector DB for scale (Faiss, Milvus, Pinecone).
* Recommended bucket naming and retention lifecycle (e.g., raw images 90 days, web-optimized images retained longer).

---

# Developer setup (run locally)

> These steps aim to get you running in demo mode quickly so judges can run locally without keys.

## Prerequisites

* Node 18+
* npm / yarn
* Python 3.10+ (for embedding service)
* Docker & docker-compose (recommended)
* psql / Postgres (or via Docker)

## Quickstart (demo mode)

1. **Clone repository**

```bash
git clone https://github.com/lucylow/closetai.git
cd closetai
```

2. **Copy sample envs**

There are `.env.example` and backend/.env.example. Copy them and adjust as needed.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

3. **Start demo services with Docker Compose**

A `docker-compose.demo.yml` is provided to spin up Postgres, Redis (if needed), embedding service, and the backend in demo mode.

```bash
docker compose -f docker-compose.demo.yml up --build
```

4. **Apply migrations**

If you used Docker Compose, run inside the Postgres container or from host:

```bash
# inside the container (example)
docker exec -it <postgres_container> bash
psql -U dev -d closetai -f /workspace/migrations/00xx_trends.sql
# or on host (if psql available)
psql postgres://dev:dev@localhost:5432/closetai -f migrations/00xx_trends.sql
```

5. **Run frontend & backend (if not run by Compose)**

```bash
# backend
cd backend
npm ci
npm run dev

# frontend
cd frontend
npm ci
npm run dev
```

6. **Open the app**

* Frontend: usually `http://localhost:5173` (Vite) or `http://localhost:3000` depending on config.
* Backend API health endpoints: `http://localhost:4000/health` (example).

### Demo notes

* Demo mode (`DEMO_MODE=true`) will bypass external API keys and provide example photos and deterministic flows for judges.
* See `README_DEMO.md` in `/backend` and `/ml` for model server steps.

---

# API reference (selected endpoints)

> This is a condensed reference. For detailed spec, add OpenAPI/Swagger later.

### `POST /api/items/upload`

Upload item image (demo accepts file path or multipart upload).

**Request (JSON demo)**

```json
{
  "filePath": "backend/fixtures/sample.jpg",
  "ownerAnonId": "demo-user",
  "title": "Red trench coat",
  "brand": "BrandX",
  "category": "outerwear"
}
```

**Response**

```json
{
  "ok": true,
  "wardrobeItemId": "uuid",
  "artifactId": "uuid"
}
```

### `GET /api/items/:id/similar?k=10`

Get k visually similar items for given item id.

**Response**

```json
{
  "results": [
    {"artifact_id":"uuid","wardrobe_item_id":"uuid","score":0.95}, ...
  ]
}
```

### `POST /api/users/:anon_id/compute_user_embedding`

Compute and store per-user style embedding based on saved `interactions` records.

**Response**

```json
{ "ok": true, "vector": [0.01, ...] }
```

### `POST /api/checkout/create-session`

Create checkout session (DEMO or Stripe). Body: `{ priceId, planId, userEmail }`.

**Response**

```json
{ "ok": true, "session": { "id": "demo_sess_...", "url": "http://..." } }
```

### `POST /api/webhooks/stripe`

Webhook endpoint for Stripe or DEMO events. Verify signature in production.

---

# Ingestion workflow — detailed sequence

1. **Manifest registration** — supply JSON manifest of seeds (sitemaps, RSS, API endpoints).
2. **Connector** — feed manifest into connector module: `rss_connector`, `sitemap_connector`, `hashtag_connector`.
3. **Fetcher** — obey `robots.txt`, implement per-domain rate limiting, download raw content and store into object storage (`raw/...`).
4. **Parser** — parse HTML, extract title, author, publish_date, body, images, structured data (JSON-LD).
5. **Validator** — ensure minimal fields exist, language detection, filter paywalled content per policy.
6. **Enrich**:

   * Text: extract keywords, named entities, phrases.
   * Image: detect clothing items, run color extraction, compute pHash, generate thumbnails.
   * Embeddings: fetch image & text embeddings.
7. **Dedupe** — compare sha256 & pHash; dedupe exact duplicates instantly; flag near-duplicates for manual review.
8. **Store** — insert content_item, artifact, embeddings, and create `trend_signals` for aggregation.
9. **Aggregate** — run the trend extraction job (hourly/daily) that updates `trend_signals`.
10. **Notify** — create `trend_ready` events or seed the UI for reviewer/curators.

---

# AI & personalization design

This section outlines the systems that leverage AI to produce personalized outfits and content generation.

## Embeddings strategy

* **Image embeddings**: CLIP-family models (`clip-ViT-B-32`) for joint image-text embeddings. Normalize vectors to unit length. Store vector metadata (model_name, dimension, created_at).

* **Text embeddings**: `paraphrase-MiniLM-L6-v2` for item titles, captions, user queries.

* **User embedding**: decayed average of embeddings for items the user has saved/liked/accepted in try-ons:

  ```
  user_emb = normalize( sum_i exp(-λ * age_i_days) * item_emb_i / sum_i exp(-λ * age_i_days) )
  ```

* **Storage**: Postgres `float8[]` for demo; planned migration to Vector DB (Faiss/Milvus) when scaling.

## Candidate generation & ranking

1. **Candidate generation**:

   * Image-based nearest neighbors (ANN) to find visually similar items.
   * Metadata filters to ensure size, season, category compatibility.
   * Trend boosters: prioritize items matching trending topics.

2. **Ranking**:

   * Initial demo: pointwise MLP ranker scoring candidate items given user & session features (outputs probability of save/tryon).
   * Features used: item_emb, user_emb, visual_similarity, recency, trend_score, item_popularity, user_preferences.
   * Offline training uses balanced positive/negative sampling; loss: BCE with logits.

3. **Explainability**:

   * For each top recommendation, provide component scores: `visual_match`, `user_pref`, `trend_boost`. Keep these in `recommendation_explanations`.

## Cold-start & fallback strategies

* **Cold user**: fallback to population-level popular items + trending items. Offer guided onboarding to collect preferences.
* **Cold item**: content-based TF-IDF + image embedding similarity to map into known clusters.

## Model lifecycle

* Training jobs run offline in `/ml/train`.
* Version models with `model_versions` table and artifacts in model registry.
* Monitor validation metrics and drift; auto-notify on performance degradation.

---

# Testing strategy

Comprehensive testing is essential.

**Unit tests**

* Backend modules: ingestion parser, dedupe, embeddings wrapper (mocked), and billing adapter (DEMO flows).
* Frontend unit tests: component snapshots and basic interactions.

**Integration tests**

* Worker + DB: enqueue ingest job and assert DB rows created, embeddings stored.
* Billing: simulate checkout session creation and webhook payloads, assert subscription created.

**E2E / Smoke**

* Use Playwright to run a smoke test: upload example photo, compute suggestions, open Try-On, generate caption.

**ML tests**

* Minimal smoke training runs for ranker script (very small synthetic data) to ensure training script executes.
* Embedding service endpoints respond with vectors.

**CI**

* Run unit tests and lint on push. Optionally run smoke E2E nightly (resource permitting).

---

# CI / CD recommendations

* GitHub Actions workflow:

  * `ci.yml`: Run `npm ci` for frontend & backend, run unit tests, run lint.
  * `e2e.yml` (nightly): Spin up Docker Compose demo services and run Playwright tests.
  * `ml-ci.yml`: Run ML smoke checks & small training test.

* Deployment:

  * Backend & worker: containerized, deploy to Kubernetes or serverless containers.
  * Embedding & heavy ML models: deploy on GPU-enabled clusters or inferences via managed services.
  * Vector DB: managed or self-hosted (Milvus, Faiss index in workers + storage).

---

# Monitoring & observability

**Metrics to collect**

* API: request latency (p50, p95), error rates.
* Ingestion: fetched items per minute, parsing errors, dedupe rates.
* ML: embedding latency, ranker latency, offline validation metrics (NDCG@k).
* Product: TTFO, onboarding completion, try-on success, conversion.

**Logging**

* Structured JSON logs with `request_id` correlation.
* Audit logs for critical actions (deletes, merges, billing events).

**Tracing**

* Use OpenTelemetry traces for cross-service latency debugging.

**Dashboards**

* Grafana or DataDog dashboards for health, ingestion, recommendations, and monetization KPIs.

---

# Security, privacy & compliance

**Data minimization**

* Avoid storing sensitive PII unless required.
* Embeddings are sensitive — access-controlled and logged.

**Consent**

* Explicit opt-in before storing user photos or using them for training.
* Record `consent_version` and `consent_timestamp`.

**Encryption**

* Encryption-at-rest for storage buckets (MinIO or S3 SSE).
* Rotate and store secrets in a KMS/Secret Manager.

**Payment & PCI**

* Use Stripe Checkout / Elements to keep PCI scope minimal.
* Never log card PAN/CVV.

**Takedown workflow**

* Maintain `takedown_requests` table. Implement admin UI to honor takedowns promptly.

**Audit & retention**

* Provide data export and deletion endpoints. Keep necessary records for tax/finance as required by law.

---

# Monetization & business hooks (summary)

* Free & premium tiers (monthly/annual), credits for metered features, sponsor integrations, and enterprise billing.
* Billing adapter (Stripe) implemented with DEMO_MODE for judges.
* Monetization tables: `billing_customers`, `subscriptions`, `invoices`, `payments`, `credits_balances`, and `sponsor_usage`.
* Reporting & export tools for finance and sponsor reconciliation.

---

# Admin / operator tools

* Admin dashboard to:

  * Review top trends & approve for recommendations
  * Inspect ingestion health & retry failed jobs
  * Manage sponsors and view usage metrics
  * Refund payments & issue invoices
  * Run dedupe-matching for artifacts

Operators should have role-based access control (RBAC) and audit logging.

---

# Troubleshooting & common issues

**Problem:** Embedding service times out or returns error
**Checks:**

* Is embedding FastAPI running? `curl http://localhost:8000/health`
* Check CPU and memory usage; large images may cause OOM. Use smaller batch sizes or use thumbnails.

**Problem:** `INSERT` to Postgres fails (constraint)
**Checks:**

* Confirm migrations are applied. Re-run idempotent migration: `psql < migrations/...sql`
* Validate DB connection string in `.env`.

**Problem:** No similar items returned
**Checks:**

* Ensure `item_embeddings` table has vectors inserted.
* For demo fallback, ensure embeddings may have been skipped — the ingest pipeline logs embedding errors; check logs for `Embedding failed`.

**Problem:** Billing webhook not creating subscription records
**Checks:**

* In DEMO_MODE webhooks may accept simple JSON; in production verify `STRIPE_WEBHOOK_SECRET` and signature verification.

---

# Roadmap & prioritized PRs (short)

A condensed list of prioritized work (first 12 PRs). Each PR should be small and include tests + README.

1. PR-01: Onboarding + Upload + Basic Ingest (DEMO_MODE) — **done (core)**
2. PR-02: Try-On UI & Perfect Corp integration (demo sponsor stubs)
3. PR-03: Trend Crawler & Aggregation (RSS, sitemaps)
4. PR-04: Embedding service & vector store integration (Faiss)
5. PR-05: Ranker training pipeline & API (ML model)
6. PR-06: Monetization core (Stripe adapter & demo flow)
7. PR-07: Guided Tour & accessibility improvements
8. PR-08: Deduplication UI & merge tool
9. PR-09: Admin dashboard for trends & sponsors
10. PR-10: Performance & caching (Redis + CDN)
11. PR-11: A/B experimentation platform
12. PR-12: Production hardening, k8s manifests, secrets & KMS

Each PR must include *acceptance criteria*, minimal tests, and demo instructions.

---

# Contributing guide

1. Fork the repo and create a feature branch: `feature/your-feature-name`.
2. Run tests locally and add unit tests for new code.
3. Keep PRs small and targeted (one feature, one migration).
4. Use descriptive PR titles and reference the roadmap item.
5. Write or update README sections related to your change.
6. Ensure all public API changes are documented in the top-level README and the OpenAPI spec (if applicable).

**Code style**

* TypeScript: follow `eslint` + `prettier` config.
* Python: follow `black` and `flake8` conventions.

---

# Acknowledgements & sponsors

ClosetAI builds on open-source tooling and public research. If you'd like to sponsor the project or integrate sponsor features (Perfect Corp, You.com, Kilo, Akamai), please contact the maintainers via the repository issues. Sponsor integrations are instrumented with `sponsor_usage` and reconciliation tooling in the billing subsystem.

---

# License

This project is MIT licensed. See `LICENSE` for details.

---

# Appendix A — Useful commands & snippets

**Apply migrations (psql)**

```bash
psql postgres://dev:dev@localhost:5432/closetai -f migrations/00xx_trends.sql
```

**Run backend in development**

```bash
cd backend
npm ci
npm run dev
```

**Run embedding service**

```bash
cd ml
pip install -r requirements.txt
python ml/server/embedding_service.py
```

**Run a demo ingest job**

```bash
curl -X POST http://localhost:4000/enqueue_demo
# or use a provided admin endpoint to enqueue local manifest
```

**Run tests**

```bash
# backend
cd backend
npm ci
npm test -- --runInBand

# ml
cd ml
pip install -r requirements.txt
pytest -q
```

---

# Appendix B — Example troubleshooting checklist (quick)

* If Docker Compose fails: `docker compose down --volumes` then `docker compose up --build`.
* If embedding model download fails: ensure network access, or cache models locally using `sentence-transformers` cache.
* If front-end 404 on route: check base path and Vite / router config.

---
