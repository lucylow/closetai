# Cursor Prompt: Responsible, Practical AI Use for ClosetAI

**Copy-paste this entire block as a single Cursor session prompt.** It contains a system role for the assistant and a user role describing a complete plan and implementation tasks to add, govern, and operate AI features in the lucylow/closetai repository.

---

## SYSTEM MESSAGE (Assistant Role)

You are an expert AI engineering lead and ML product manager with deep, hands-on experience building, integrating, and governing AI features in web products (Node.js/TypeScript backend, React/Vite frontend, Postgres, Redis, BullMQ/queueing, local and cloud model providers). Your responsibilities:

- Design safe, cost-aware, explainable, and testable AI features for a hackathon-friendly product (ClosetAI).
- Produce runnable code scaffolding, prompt templates, evaluation harnesses, migrations, and tests where applicable.
- Provide a step-by-step PR plan with small, testable tasks and acceptance criteria.
- Always include a deterministic DEMO_MODE that uses local fixtures and avoids real provider keys; never include real API keys.
- Prioritize safety, privacy, monitoring, and auditability.
- When the user asks for implementation, produce full file contents with file paths and clear instructions.
- When writing prompt templates, include versioning, examples, and expected outputs.
- Provide actionable unit and integration tests (Jest + supertest + RTL for React when applicable).
- Produce a reproducible demo (docker compose or scripts) that judges can run in <10 minutes using fixtures.
- When producing code, be pragmatic and minimal: provide a working scaffold that can be iterated. When tradeoffs exist, pick a sensible default and document the reasoning.

---

## USER MESSAGE (Task)

Repository: https://github.com/lucylow/closetai

Goal: Design and deliver a comprehensive Cursor prompt that implements{
responsible and practical Artificial Intelligence use across the ClosetAI product.

The deliverable must be a single, copy-pasteable Cursor prompt that the assistant can execute to:

- Provide a clear, prioritized roadmap (PR-sized tasks) for introducing AI features and governance
- Define architecture patterns for model integrations (RAG, embeddings, generation, VTON, stylization)
- Provide concrete code scaffolding and examples (TypeScript) for:
  - model provider wrappers
  - prompt template manager
  - embeddings service
  - retrieval (RAG)
  - generation pipeline
  - caching, dedup, and queueing
  - moderation and safety filters
  - evaluation and metrics hooks
  - cost estimation and quota enforcement
  - explainability hooks and audit logs

- Add database migrations for data needed (prompts, templates, generated artifacts, audits)
- Add a deterministic DEMO_MODE and fixtures for judges
- Add unit tests and integration tests (backend + frontend) for the key flows
- Add a Docker demo or script to run locally (no external API keys needed)
- Add governance artifacts: model cards, policy summary, red-team checklist, and privacy guidance
- Provide a CI snippet and PR template for these changes
- Provide acceptance criteria for each PR and an overall "what to ship" checklist

Make reasonable assumptions where required (e.g., you may assume backend/ and frontend/ exist and follow common patterns). Don't ask clarifying questions — proceed with pragmatic defaults and explain tradeoffs.

---

## 1. Product Rationale & Guiding Principles

### Business Goal Alignment
AI features should increase engagement and reduce friction:
- **Auto-caption generation** for outfit posts
- **Outfit explanations** - "why this works" styling advice
- **Hashtag & SEO generation** for discoverability
- **Virtual Try-On (VTON)** for fashion items
- **Image stylization** for premium features
- **Monetizable features** - content generator, premium stylized images

### Safety & Privacy
- Never expose user images to unknown parties without consent
- Implement pre/post moderation and admin review queues
- Data minimization - only send necessary data to AI providers
- Provide DELETE endpoint for user data removal

### Cost & Latency
- Separate cheap/fast operations (text generation, embeddings) from expensive ops (high-res image generation, VTON)
- Use caching, batching, quota enforcement
- Implement cost estimation per operation

### Explainability & Auditability
- Store prompts, model versions, deterministic seeds, and outputs
- Enable reconstruction of any generated result
- Log all AI interactions for audit purposes

### Demo Friendliness
- DEMO_MODE must allow judges to run full flows without provider keys
- Use local fixtures for all AI outputs in demo mode

### Iterative Delivery
Start with simple trustworthy features:
1. Caption generation
2. Hashtag/SEO generation
3. Embedding-based search
Then add advanced features:
4. RAG + fine-tuning
5. Image stylization
6. VTON integration

---

## 2. Architecture & Canonical Patterns

### Modular Service Architecture

```
Frontend (React)
  -> /api/generate (backend)
      -> moderationService.preFilter()
      -> templateService.render()
      -> modelProviders.callTextModel() or callImageModel()
      -> moderationService.postFilter()
      -> store generated_artifact
      -> notifications / return to frontend

Embeddings & RAG:
  -> embeddingsService.index() (worker)
  -> ragService.retrieve(contextQuery) -> callTextModel(prompt + context)
```

### Key Services

| Service | Purpose |
|---------|---------|
| `modelProviders.ts` | Single wrapper for all AI model calls (text, image, embeddings) |
| `templateService.ts` | CRUD for prompt templates with versioning |
| `generationService.ts` | Orchestrates generation pipeline |
| `embeddingsService.ts` | Create embeddings, vector search |
| `ragService.ts` | Retrieval-augmented generation |
| `moderationService.ts` | Pre/post filters, admin review queue |
| `costService.ts` | Cost estimation, quota enforcement |
| `auditService.ts` | Logging and explainability |

---

## 3. Database Migrations

Create `backend/migrations/0100_ai_use.sql`:

```sql
BEGIN;

-- Prompt templates for AI generation
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  version INT DEFAULT 1,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated artifacts and audit trail
CREATE TABLE IF NOT EXISTS generated_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- caption | hashtags | stylized_image | rag_answer | embedding
  prompt TEXT,
  template_id UUID REFERENCES prompt_templates(id),
  variables JSONB,
  result JSONB, -- provider output
  provider TEXT,
  model TEXT,
  model_version TEXT,
  provider_meta JSONB,
  cost_cents INT DEFAULT 0,
  status TEXT DEFAULT 'ready', -- ready|flagged|error|pending
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES generated_artifacts(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- pre | post
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Embeddings for vector search
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'wardrobe_item', 'generated_artifact', 'external'
  source_id UUID,
  vector FLOAT8[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage events for cost/quota tracking
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  metric TEXT NOT NULL, -- caption_calls, stylize_calls, embedding_calls
  value BIGINT DEFAULT 1,
  cost_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI costs configuration
CREATE TABLE IF NOT EXISTS ai_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL UNIQUE,
  cost_cents INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default costs
INSERT INTO ai_costs (operation, cost_cents) VALUES
  ('caption', 2),
  ('hashtags', 1),
  ('embedding', 1),
  ('stylize', 200),
  ('vton', 500)
ON CONFLICT (operation) DO NOTHING;

COMMIT;
```

---

## 4. PR-Sized Roadmap (15+ PRs)

### PR-01: Scaffold - Model Provider Wrapper + DEMO_MODE

**Files to create:**
- `backend/src/lib/env.ts` - Environment variables with DEMO_MODE
- `backend/src/lib/modelProviders.ts` - Unified model wrapper
- `backend/tests/modelProviders.test.ts` - Unit tests
- Update `.env.example` with DEMO_MODE=true

**Acceptance Criteria:**
- [ ] All model calls route through modelProviders.ts
- [ ] DEMO_MODE returns deterministic fixtures
- [ ] Tests pass without external API keys

---

### PR-02: Prompt Template Manager

**Files to create:**
- `backend/src/services/templateService.ts` - CRUD operations
- `backend/src/routes/templates.routes.ts` - REST API endpoints
- Database migration (included in 0100_ai_use.sql)

**Acceptance Criteria:**
- [ ] Create, read, update, delete templates via API
- [ ] Template versioning works
- [ ] renderTemplate() function replaces {{variables}}

---

### PR-03: Caption Generation Flow

**Files to create:**
- `backend/src/services/generationService.ts` - Generation orchestration
- `backend/src/routes/generate.routes.ts` - API endpoints
- `backend/fixtures/captions.json` - Demo fixtures

**Acceptance Criteria:**
- [ ] POST /api/generate/caption returns generated text
- [ ] generated_artifacts table populated
- [ ] DEMO_MODE returns fixture data

---

### PR-04: Hashtag & SEO Generator

**Files to create:**
- `backend/src/services/hashtagService.ts` - Hashtag generation
- `backend/src/services/seoService.ts` - SEO metadata generation

**Acceptance Criteria:**
- [ ] Generate hashtags from caption/content
- [ ] Generate SEO meta description
- [ ] Deterministic output in DEMO_MODE

---

### PR-05: Embeddings Service + Visual Search

**Files to create:**
- `backend/src/services/embeddingsService.ts` - Embedding creation and search
- API endpoint for vector similarity search

**Acceptance Criteria:**
- [ ] Create embeddings for wardrobe items
- [ ] Naive vector search returns nearest neighbors
- [ ] DEMO_MODE uses deterministic vectors

---

### PR-06: RAG Pipeline

**Files to create:**
- `backend/src/services/ragService.ts` - Retrieval-augmented generation

**Acceptance Criteria:**
- [ ] Given a query, retrieve relevant context
- [ ] Generate answer with citations
- [ ] Store provenance in generated_artifacts

---

### PR-07: Moderation & Admin Review Queue

**Files to create:**
- `backend/src/services/moderationService.ts` - Pre/post filters
- `backend/src/routes/admin/moderation.routes.ts` - Review queue

**Acceptance Criteria:**
- [ ] Pre-filter blocks banned content
- [ ] Post-filter flags suspicious outputs
- [ ] Admin can review and resolve flagged items

---

### PR-08: Cost Estimator & Quota Enforcement

**Files to create:**
- `backend/src/services/costService.ts` - Cost tracking
- Middleware for quota enforcement

**Acceptance Criteria:**
- [ ] Estimate cost per operation
- [ ] Track usage_events
- [ ] Block when quota exceeded (HTTP 402/429)

---

### PR-09: Stylize & Image Generation

**Files to create:**
- `backend/src/services/stylizeService.ts` - Image stylization
- `backend/src/workers/stylize.worker.ts` - Async processing

**Acceptance Criteria:**
- [ ] Generate stylized images
- [ ] Store image_url in generated_artifacts
- [ ] DEMO_MODE returns fixture images

---

### PR-10: Explainability UI & Audit Logs

**Files to create:**
- `backend/src/routes/admin/audit.routes.ts` - Audit log endpoints
- Frontend component for artifact inspection

**Acceptance Criteria:**
- [ ] Display prompt, model version, seed, cost
- [ ] Export audit data as CSV
- [ ] Admin can view all artifacts

---

### PR-11: Evaluation Harness & Metrics

**Files to create:**
- `backend/scripts/evaluate_captions.ts` - Offline evaluation
- `backend/src/services/metricsService.ts` - Metrics collection

**Acceptance Criteria:**
- [ ] Run evaluation on fixture dataset
- [ ] Output JSON metrics (BLEU, ROUGE-lite)
- [ ] Human evaluation CSV schema provided

---

### PR-12: CI & Demo

**Files to create:**
- `.github/workflows/ci-ai.yml` - GitHub Actions
- Update `docker-compose.demo.yml` for full demo

**Acceptance Criteria:**
- [ ] CI runs tests on push
- [ ] Demo can be run with DEMO_MODE=true
- [ ] No external API keys required

---

### PR-13-15: Additional Features (Future)

- PR-13: VTON Integration with PerfectCorp
- PR-14: Advanced RAG with vector DB (Pinecone/Milvus)
- PR-15: Fine-tuning pipeline for custom models

---

## 5. Key Code Scaffolds

### 5.1 Environment Configuration (backend/src/lib/env.ts)

```typescript
// Environment configuration
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const DEMO_MODE = (process.env.DEMO_MODE ?? 'true') === 'true';
export const PORT = Number(process.env.PORT ?? 5000);

// Provider keys (do NOT add real keys - use secrets management)
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY ?? '';
export const MODEL_PROVIDER = process.env.MODEL_PROVIDER ?? 'openai';
```

### 5.2 Model Provider Wrapper (backend/src/lib/modelProviders.ts)

```typescript
import { DEMO_MODE, OPENAI_API_KEY, MODEL_PROVIDER } from './env';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Text model call - returns deterministic demo output in DEMO_MODE
 */
export async function callTextModel({ 
  prompt, 
  maxTokens = 150, 
  temperature = 0.7,
  model = 'gpt-4o-mini'
}: { 
  prompt: string; 
  maxTokens?: number; 
  temperature?: number;
  model?: string;
}) {
  if (DEMO_MODE) {
    // Deterministic: return truncated prompt with demo marker
    return `Demo: ${prompt.slice(0, 80)}...`;
  }

  if (MODEL_PROVIDER === 'openai' && OPENAI_API_KEY) {
    const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });
    return resp.data.choices[0].message.content;
  }

  throw new Error('No text model provider configured');
}

/**
 * Image model call - returns fixture in DEMO_MODE
 */
export async function callImageModel({ 
  prompt, 
  size = '1024x1024' 
}: { 
  prompt: string; 
  size?: string;
}) {
  if (DEMO_MODE) {
    const demoPath = path.join(process.cwd(), 'backend', 'fixtures', 'stylized', 'stylized_demo_1.jpg');
    if (fs.existsSync(demoPath)) {
      return { 
        buffer: fs.readFileSync(demoPath), 
        url: '/fixtures/stylized/stylized_demo_1.jpg', 
        provider: 'demo' 
      };
    }
    return { buffer: Buffer.from([]), url: '', provider: 'demo' };
  }

  // Placeholder for real image provider
  throw new Error('Image provider not configured');
}

/**
 * Embeddings call - returns deterministic vector in DEMO_MODE
 */
export async function callEmbeddingModel({ text }: { text: string }) {
  if (DEMO_MODE) {
    // Deterministic: hash to a simple vector
    const v = text.split('').slice(0, 64).map(c => (c.charCodeAt(0) % 10) / 10);
    return v;
  }
  
  // Call provider (OpenAI embedding API, HF, or local)
  throw new Error('Embedding provider not configured');
}
```

### 5.3 Template Service (backend/src/services/templateService.ts)

```typescript
import db from '../lib/db';

export async function createTemplate({ 
  name, 
  prompt_template, 
  variables, 
  description, 
  created_by 
}: any) {
  const res = await db.query(
    `INSERT INTO prompt_templates (name, prompt_template, variables, description, created_by) 
     VALUES ($1,$2,$3,$4,$5) RETURNING *`, 
    [name, prompt_template, variables || {}, description || '', created_by]
  );
  return res.rows[0];
}

export async function listTemplates() {
  const res = await db.query(`SELECT * FROM prompt_templates ORDER BY created_at DESC`);
  return res.rows;
}

export function renderTemplate(template: string, vars: Record<string, any>) {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const val = vars[key.trim()];
    return val !== undefined && val !== null ? String(val) : '';
  });
}
```

### 5.4 Generation Service (backend/src/services/generationService.ts)

```typescript
import { callTextModel, callImageModel } from '../lib/modelProviders';
import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { renderTemplate } from './templateService';
import logger from '../lib/logger';

export async function generateCaption({ 
  userId, 
  templateRow, 
  variables, 
  demo = false 
}: { 
  userId: string, 
  templateRow: any, 
  variables: any, 
  demo?: boolean;
}) {
  const promptTemplate = templateRow?.prompt_template || 'Write a short caption for: {{item_names}}';
  const prompt = renderTemplate(promptTemplate, variables);

  // Call model
  const text = await callTextModel({ prompt, maxTokens: 80, temperature: 0.7 });

  // Store artifact
  const id = uuidv4();
  await db.query(
    `INSERT INTO generated_artifacts (id, user_id, type, prompt, template_id, variables, result, provider, model, status, created_at) 
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())`, 
    [
      id, 
      userId, 
      'caption', 
      prompt, 
      templateRow?.id || null, 
      variables, 
      { text }, 
      demo ? 'demo' : 'provider', 
      demo ? 'demo-model' : 'provider-model', 
      'ready'
    ]
  );
  return { id, text };
}
```

### 5.5 Embeddings Service (backend/src/services/embeddingsService.ts)

```typescript
import { callEmbeddingModel } from '../lib/modelProviders';
import db from '../lib/db';

export async function createEmbedding({ 
  source, 
  source_id, 
  text 
}: { 
  source: string, 
  source_id?: string, 
  text: string 
}) {
  const vector = await callEmbeddingModel({ text });
  const res = await db.query(
    `INSERT INTO embeddings (source, source_id, vector, created_at) 
     VALUES ($1,$2,$3,now()) RETURNING id`, 
    [source, source_id || null, vector]
  );
  return res.rows[0];
}

// Naive search: compute L2 distance in app
export async function searchEmbeddings({ 
  vector, 
  limit = 10 
}: { 
  vector: number[]; 
  limit?: number; 
}) {
  const res = await db.query(`SELECT id, source, source_id, vector FROM embeddings`);
  const scored = res.rows
    .map((r: any) => ({ ...r, dist: l2(vector, r.vector) }))
    .sort((a: any, b: any) => a.dist - b.dist);
  return scored.slice(0, limit);
}

function l2(a: number[], b: number[]) {
  if (!a || !b) return Infinity;
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}
```

**Tradeoff:** Storing vectors in Postgres is fine for small-scale demo; for production switch to a vector DB (Pinecone, Milvus, Weaviate).

### 5.6 Moderation Service (backend/src/services/moderationService.ts)

```typescript
import db from '../lib/db';
import logger from '../lib/logger';

const bannedWords = ['nude', 'illegal', 'terror']; // Example; maintain externally

export async function preFilter({ userId, input }: { userId: string, input: string }) {
  const s = (input || '').toLowerCase();
  const found = bannedWords.filter(w => s.includes(w));
  
  if (found.length) {
    await db.query(
      `INSERT INTO moderation_logs (artifact_id, stage, result, created_at) 
       VALUES ($1,$2,$3,now())`, 
      [null, 'pre', { blocked: true, reason: 'banned_words', words: found }]
    );
    return { blocked: true, reason: 'banned_words', words: found };
  }
  
  return { blocked: false };
}

export async function postFilter({ artifactId, content }: { artifactId?: string, content: string }) {
  // Placeholder: detect slurs etc.
  const s = (content || '').toLowerCase();
  if (s.includes('slur1') || s.includes('hate')) {
    await db.query(
      `INSERT INTO moderation_logs (artifact_id, stage, result, created_at) 
       VALUES ($1,$2,$3,now())`, 
      [artifactId || null, 'post', { flagged: true }]
    );
    return { flagged: true, reason: 'flagged_words' };
  }
  return { flagged: false };
}
```

---

## 6. Frontend Sketch (React)

### Compose Page (frontend/src/pages/ComposePost.tsx)

```tsx
import React, { useState } from 'react';
import axios from 'axios';

export default function ComposePost({ userId }: { userId: string }) {
  const [itemNames, setItemNames] = useState('white shirt, blue jeans');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/generate/caption', { 
        userId, 
        itemNames, 
        templateId: null 
      });
      setCaption(data.text || data.caption);
      
      const h = await axios.post('/api/generate/hashtags', { 
        userId, 
        caption: data.text || data.caption 
      });
      setHashtags(h.data.hashtags || []);
    } catch (err) {
      alert('generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Compose</h2>
      <textarea 
        value={itemNames} 
        onChange={e => setItemNames(e.target.value)} 
        className="w-full p-2 border" 
      />
      <div className="mt-2">
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded" 
          onClick={generate} 
          disabled={loading}
        >
          Generate
        </button>
      </div>
      {loading && <div>Generating...</div>}
      {caption && (
        <div className="mt-4">
          <h3>Caption</h3>
          <p className="p-2 bg-gray-100 rounded">{caption}</p>
        </div>
      )}
      {hashtags.length > 0 && (
        <div className="mt-2">
          <h3>Hashtags</h3>
          <p>{hashtags.join(' ')}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Testing & Evaluation

### Unit Tests

- Test modelProviders returns deterministic demo outputs
- Test templateService.renderTemplate substitutions
- Test generationService.generateCaption stores generated_artifacts row

### Integration Tests

- Start backend with test DB (use pg test container)
- Call /api/generate/caption in DEMO_MODE
- Assert DB row and response

### Offline Evaluation

Add `backend/scripts/evaluate_captions.ts` to compute BLEU/ROUGE between generated captions and a small gold set (fixtures). Output JSON summary.

### Human Evaluation

Provide a CSV export with columns: prompt, generated_caption, reference_caption, rating (0-5), comments.

---

## 8. Monitoring, Metrics & Alerts

Instrument the backend to emit metrics:

| Metric | Description |
|--------|-------------|
| `ai.generated.count{type}` | Increment per generation |
| `ai.latency_ms` | Record durations |
| `ai.cost_cents_total` | Sum cost estimates |
| `ai.cache.hit_ratio` | Embedding/response cache hits |
| `ai.moderation.flag_rate` | Percentage flagged |

**Alerts:**
- If `ai.moderation.flag_rate > 2%` for 1 hour → notify ops
- If `ai.cost_cents_total` increases > 50% week-over-week → notify finance

Provide admin endpoint `/admin/ai_metrics` that returns recent aggregates.

---

## 9. Cost Model & Quota Enforcement

Per-call cost estimate (in cents):
- caption: 2¢
- embedding: 0.5¢
- stylize: 200¢
- vton: 500¢

**Quota enforcement in costService:**
- **Soft thresholds:** Warn user when approaching quota (80%)
- **Hard thresholds:** Block further calls (HTTP 402/429)
- **Admin override:** Ability to grant quota increases

---

## 10. Explainability & Audit

For each `generated_artifacts` store:
- prompt (exact string sent to model)
- template_id
- variables
- model & model_version
- seed or deterministic identifier
- cost_cents
- created_at
- moderation_logs linked

Expose `/admin/artifact/:id` to show this info and allow CSV export.

---

## 11. Safety & Red-Teaming Checklist

Before enabling a model in production:

- [ ] **Data minimization:** Do not send PII unless necessary. For images, obtain explicit consent & provide delete endpoint.
- [ ] **Pre-moderation:** Filter prompts for banned content/PHI/PII using regex & simple classifiers.
- [ ] **Post-moderation:** Examine outputs for offensive content; flag & route to admin review.
- [ ] **Rate limits & quotas:** Prevent abuse and runaway cost.
- [ ] **Adversarial tests:** Create a test suite with adversarial prompts (sexual, hate, instructions to reveal info, jailbreaks) and assert outputs are blocked or sanitized.
- [ ] **Logging:** Log prompts & outputs for a fixed retention period for auditing, but redact sensitive data in logs.
- [ ] **Model cards:** For each model used, keep a model card with capabilities, limitations, owner, and last update.
- [ ] **Human review:** For high-risk content (e.g., influencer endorsements, paid content), require a human signoff before publishing.

---

## 12. Privacy & Compliance

- Implement DELETE `/api/user/:id/data` to remove user images, embeddings, and generated_artifacts (with audit)
- Provide data retention policy (e.g., delete generated artifacts older than 90 days unless user saves)
- If processing EU users, ensure data processing agreements and lawful basis are documented
- Avoid storing credit card or payment info outside Stripe

---

## 13. CI & Demo

### GitHub Actions (.github/workflows/ci-ai.yml)

```yaml
name: CI AI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: 
          POSTGRES_USER: dev
          POSTGRES_PASSWORD: dev
          POSTGRES_DB: closetai
        ports: ['5432:5432']
      redis:
        image: redis:6
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install & test backend
        run: |
          cd backend
          npm ci
          cp .env.example .env
          npm test -- --runInBand
```

### Local Demo (for Judges)

```bash
cp .env.example .env  # Ensure DEMO_MODE=true
docker compose -f docker-compose.demo.yml up --build
# Open frontend, go to Compose, click Generate
# Caption/hashtags/stylize will return fixtures and be logged
```

---

## 14. PR Template

```markdown
## Summary
Short description.

## Changes
- Files added/changed

## How to run locally (demo)
1. cp .env.example .env
2. set DEMO_MODE=true
3. docker compose -f docker-compose.demo.yml up --build
4. run tests: cd backend && npm test

## Checklist
- [ ] Tests added
- [ ] Demo mode works
- [ ] Templates updated (if needed)
- [ ] No secrets committed
- [ ] Admin auditing & moderation covered
```

---

## 15. What to Ship (Judge Checklist)

- [ ] DEMO_MODE=true works end-to-end: caption generation, hashtags, stylized images (fixtures), search via embeddings
- [ ] Auditing: generated artifact stores prompt, model_version, and provider_meta
- [ ] Moderation: pre & post simple filters with admin queue
- [ ] Quota: demo enforces a sample quota and returns appropriate message on exceed
- [ ] Tests: unit & integration tests pass locally
- [ ] Docs: README includes demo steps and model card summary

---

## 16. Cursor Action Block - Create PR-01 Now

**Paste this block into Cursor to execute PR-01 immediately:**

```cursor
SYSTEM:
You are an expert AI engineering assistant. Implement PR-01 for the ClosetAI repo to introduce a model provider wrapper and DEMO_MODE scaffolding and a minimal caption generation endpoint with tests and a local demo.

Constraints:
- Do NOT include real API keys.
- All model calls must use lib/modelProviders.ts and respect DEMO_MODE.
- Provide full file contents including file path headers.
- Add tests (Jest) that run in DEMO_MODE.
- Add .env.example and docker-compose.demo.yml for local demo.

USER TASK:
Create the following files (full contents) in backend/:

1) backend/src/lib/env.ts
2) backend/src/lib/modelProviders.ts
3) backend/src/services/templateService.ts
4) backend/src/services/generationService.ts
5) backend/src/routes/generate.ts
6) backend/fixtures/captions.json (sample captions)
7) backend/fixtures/stylized/stylized_demo_1.jpg (explain placeholder)
8) backend/tests/generation.test.ts
9) .env.example (repo root)
10) docker-compose.demo.yml (repo root)
11) README snippet "Demo: run locally" (append to README.md or create README_DEMO.md)

For each file, output the path and the exact file content. After files, show exact commands to run tests and to run the demo locally. Keep code concise and runnable (TypeScript). Use sqlite or Postgres? Use Postgres in docker compose. For DB interactions in this PR, you can stub DB calls (or create minimal in-memory stubs) — prefer stubs to keep PR small. Create minimal stubs for db access in backend/src/db.ts if needed.

Do the work now.
```

---

## Summary

This comprehensive Cursor prompt provides:

1. **Strategic AI use plan** - Product, technical, safety, and ops aspects covered
2. **PR-sized implementation plan** - 15+ PRs with acceptance criteria
3. **Concrete TypeScript scaffolds** - Provider wrapper, embeddings, RAG, generation controller, moderation
4. **Prompt template manager** - DB + JSON + UI sketches and example templates
5. **Test harness** - Unit tests, integration tests, evaluation scripts
6. **DEMO_MODE fixtures** - Docker Compose demo for offline evaluation
7. **Monitoring & governance** - Model card, privacy guidance, red team checklist
8. **CI/PR templates** - Ready to use

The final Cursor action block at the bottom can be pasted directly to create PR-01 scaffolding immediately.
