# ClosetAI — Trends Crawler Demo (PR1)

Prereqs:
- Docker & Docker Compose
- Node 18+ (optional if running locally)

## 1. Start services

```bash
docker compose -f docker-compose.demo.yml up --build -d
```

## 2. Apply migrations (wait for Postgres to be ready)

```bash
docker exec -it $(docker ps --filter "ancestor=postgres:15" -q) bash -c "psql -U dev -d closetai -c \"\i /workspace/backend/migrations/00xx_trends.sql\""
```

Alternatively, copy migrations into the Postgres container or run psql from host.

## 3. Run backend (if not using docker-compose build to run)

```bash
cd backend
npm ci
npm run dev
```

## 4. Enqueue demo ingestion:

```bash
curl -X POST http://localhost:4000/enqueue_demo
```

## 5. Check logs; trend_signals will be populated in Postgres.

## 6. Run tests:

```bash
cd backend
npm ci
npm test -- --runInBand
```

## Notes

- This is a PR1 scaffold demonstrating the trends crawler architecture
- DEMO_MODE=true uses local file storage instead of MinIO
- The parser extracts hashtags and top words from HTML content
- Trend signals are aggregated into daily buckets
