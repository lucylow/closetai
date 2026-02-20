# PerfectCorp AR Try-On Integration

## Overview
This integration adds AR Try-On capabilities to ClosetAI using PerfectCorp / YouCam APIs. Supports clothing, bags, scarves, shoes, and hats.

## Features
- DEMO mode: No API keys required, deterministic fixtures
- REAL mode: Live PerfectCorp API integration
- Privacy & consent flow
- Product SKU mapping
- Before/After preview
- Variant gallery

## Quick Start

### DEMO Mode (Default)
```bash
cp .env.example .env
docker compose -f docker-compose.perfectcorp.demo.yml up --build -d
# Access frontend at http://localhost:5173
```

### REAL Mode
1. Get PerfectCorp API key: https://yce.perfectcorp.com/document/index.html
2. Update .env:
```
INTEGRATION_MODE=real
PERFECT_CORP_API_KEY=your_key_here
```
3. Run migrations:
```bash
psql -d closetai -f backend/migrations/007_create_ar_tryon.sql
```

## API Endpoints
- POST /api/ar/tryon - Start AR try-on
- GET /api/ar/status/:taskId - Check task status
- GET /api/ar/result/:resultId - Get result
- POST /api/ar/apply/:resultId - Apply variant to wardrobe

## Privacy
- Consent required before upload
- Images treated as PII
- 90-day raw image retention
- 365-day processed results retention
