# PR1 Demo — Personalized Outfits AI Scaffold

Prereqs:
- Node 18+, npm
- Python 3.10+, pip
- Docker & docker-compose

## Quick Start

### 1. Copy env:
```bash
cp .env.example .env
```

### 2. Start services (recommended):
```bash
docker compose -f docker-compose.demo.yml up --build
```

This starts Postgres, Redis, embedding server, ranker server, and backend.

### 3. Apply DB migrations:
Wait for Postgres to be ready, then:
```bash
docker exec -it <postgres_container> psql -U dev -d closetai -f /workspace/migrations/00xx_ai_recs.sql
```
(Or run migrations manually via psql)

### 4. Start embedding/ranker services locally (if not using docker):
```bash
cd ml
pip install -r requirements.txt
python ml/server/embedding_service.py &
python ml/server/ranker_model.py &
```

Run a quick train to generate model:
```bash
python ml/train/ranker_train.py
```

### 5. Start backend:
```bash
cd backend
npm ci
npm run dev
```

### 6. Test recommend API:
```bash
POST http://localhost:3000/api/recommend 
{ "anon_id": "demo1", "context_text":"summer dress" }
```

### 7. Run tests:
Backend:
```bash
cd backend && npm ci && npm test -- --runInBand
```

ML tests:
```bash
cd ml && pytest
```

## Notes
- PR1 is demo-level. Replace embedding & ranker services with production-grade models later.
- Ensure to follow privacy & consent rules when uploading real user photos.
