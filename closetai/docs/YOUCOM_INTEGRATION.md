# You.com Integration — Production-Ready Patterns

ClosetAI integrates You.com's Search API for real-time fashion trend research with citations, caching, and judge-friendly features.

## Architecture

```
Frontend (React)
  → useFashionTrends / FashionTrends / TrendAwareOutfits
  → GET /api/trends/fashion, POST /api/trends/outfits/trend-aware
Backend (Express)
  → trends.controller
  → trendService (fetchTrends) — NodeCache + Redis
  → youcomClient (safeGet, search) — retries, rate-limit handling
  → You.com API
```

## Backend Components

### `lib/youcomClient.js`
- Robust HTTP client with exponential backoff retries (4 attempts)
- Does not retry 4xx client errors
- Captures `x-rate-limit-*` headers for judge visibility
- Uses official params: `query`, `count`, `freshness`

### `lib/cache.js`
- Redis client (optional) for distributed caching
- Falls back gracefully when Redis unavailable
- `redisGet`, `redisSet` helpers

### `services/trendService.js`
- `fetchTrends({ category, season, limit, force, query })`
- NodeCache (in-memory) + Redis for cross-instance cache
- Fallback: `fixtures/trends.json` or built-in fallback when API fails
- Returns `{ query, timestamp, trends, sources, meta: { rateInfo } }`

### `services/trendRecommendation.service.js`
- Trend-aware outfit scoring
- Matched trends include `favicon`, `source` for judge verification

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/trends/fashion | Category trends (all, clothing, colors, accessories, sustainable). Query: `category`, `season`, `limit`, `force=true` |
| GET | /api/trends/search?q=... | Custom search (cached) |
| POST | /api/trends/outfits/trend-aware | Trend-aware outfit recommendations |

## Environment Variables

```env
YOUCOM_API_KEY=sk_youcom_...
YOUCOM_BASE_URL=https://api.ydc-index.io/v1
REDIS_URL=redis://127.0.0.1:6379   # optional
TREND_CACHE_TTL_SECONDS=21600      # 6 hours
```

## Demo & Judging Tips

1. **Pre-warm cache** before demo:
   ```bash
   curl "http://localhost:5000/api/trends/fashion?category=all&limit=20&force=true"
   # or: node backend/scripts/prewarm-trends.js
   ```

2. **Show citations**: Each trend card has "Read source" and "Copy citation" — judges can verify sources.

3. **Rate info**: If You.com returns rate headers, `meta.rateInfo.remaining` is shown in the UI.

4. **Fallback data**: When API key is missing or API fails, `fixtures/trends.json` or built-in fallback ensures non-empty results.

5. **Record outputs**: Take screenshots/video of the UI for Devpost if credits are limited.

## Curl Examples

```bash
# Fetch trends
curl "http://localhost:5000/api/trends/fashion?category=clothing&limit=8"

# Force refresh (bypass cache)
curl "http://localhost:5000/api/trends/fashion?category=all&force=true"

# Custom search
curl "http://localhost:5000/api/trends/search?q=oversized+blazer&limit=5"
```

## Security

- `YOUCOM_API_KEY` is server-side only; never exposed to frontend
- Cache aggressively to reduce API usage
- Sanitize user-provided search queries
- Log metadata only; no PII in trend logs
