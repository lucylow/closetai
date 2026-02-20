# PerfectCorp Hair Integration (ClosetAI)

## Overview

This integration adds AI-powered hair try-on and analysis features to ClosetAI using PerfectCorp's (YouCam) hair editing APIs.

### Features Implemented

- **Hair Color Try-On**: Generate realistic recolors of user's hair
- **Hairstyle Generation**: Synthesize new hairstyles (short, long, bob, perm, curls, updo)
- **Hair Extensions Suggestion**: Virtually add extensions and show product matches
- **Bangs Generation**: Add various bang styles
- **Hair Volume Generation**: Show fuller/less volume options
- **Hair Length Detection**: Infer short/medium/long and approximate centimeters
- **Hair Type Detection**: Infer straight/wavy/curly/coily and texture
- **Beard Style Generation**: Generate beard styles for users with faces
- **Accessory Integration**: Suggest hats/scarves compatible with hairstyle

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User Device │────▶│   Frontend  │────▶│   Backend   │
└─────────────┘     │   (React)   │     │  (Express)  │
                  └─────────────┘     └──────┬──────┘
                                              │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
              ┌─────▼─────┐            ▼────── ┌──────┐            ┌──────▼──────┐
              │  Postgres  │             │  MinIO/S3   │            │ PerfectCorp │
              │     DB     │             │  Storage    │            │     API     │
              └───────────┘             └─────────────┘            └─────────────┘
```

## Data Flow

1. User uploads selfie in frontend with consent
2. Frontend POSTs file to backend `/api/perfect/hair/analyze`
3. Backend validates consent, computes file hashes
4. Backend calls PerfectCorp File Init → receives presigned PUT URL
5. Backend uploads bytes to presigned URL
6. Backend creates PerfectCorp Task with task type
7. Background poller monitors task status
8. On completion, results are normalized and stored
9. Recommendations generated based on analysis
10. Frontend displays results

## Environment Variables

```bash
# Integration mode: demo or real
INTEGRATION_MODE=demo

# Perfect Corp API
PERFECT_CORP_API_KEY=sk_test_YOUR_KEY
PERFECT_CORP_API_BASE=https://yce-api-01.makeupar.com/s2s/v2.0

# App
DATABASE_URL=postgres://dev:dev@localhost:5432/closetai
PORT=4000
```

## Demo Mode vs Real Mode

### Demo Mode
- Returns deterministic simulated responses
- No API keys required
- Uses fixture data
- Perfect for judges and testing

### Real Mode
- Uses actual PerfectCorp endpoints
- Requires valid API key
- Full production capabilities

## Switching to Real Mode

1. Get PerfectCorp API key from https://yce.perfectcorp.com
2. Add to `.env`: `PERFECT_CORP_API_KEY=your_key`
3. Set `INTEGRATION_MODE=real`
4. Restart backend

## Privacy & Consent

- User consent required before processing
- Images and embeddings treated as sensitive PII
- Raw images retained max 90 days
- Processed masks retained max 365 days
- Audit logs maintained for all operations

## API Endpoints

- `POST /api/perfect/hair/analyze` - Start hair analysis
- `GET /api/perfect/hair/status/:taskId` - Check task status
- `GET /api/perfect/hair/result/:analysisId` - Get analysis results
- `POST /api/perfect/hair/webhook` - Webhook handler
- `POST /api/perfect/hair/apply-edit` - Apply selected edit

## Running with Docker

```bash
# Demo mode
docker-compose -f docker-compose.perfectcorp.demo.yml up --build -d

# Apply migrations
docker exec -it <postgres_container_id> psql -U dev -d closetai -f backend/migrations/0001_perfectcorp_hair.sql
```

## Database Schema

See `backend/migrations/0001_perfectcorp_hair.sql` for full schema.

### Key Tables

- `file_artifacts` - Stores uploaded files with hashes
- `hair_tasks` - Tracks PerfectCorp tasks
- `hair_analysis` - Stores analysis results
- `audit_logs` - Logs all operations

## Recommendations

The system provides recommendations based on:
- Detected hair color → dye codes, wig SKUs
- Hair type → compatible products
- Hair length → extension lengths
- Hair volume → volume-enhancing products

## Testing

```bash
# Backend tests
cd backend && npm test

# With Docker
docker-compose -f docker-compose.perfectcorp.demo.yml run backend npm test
```

## References

- PerfectCorp Developer Docs: https://yce.perfectcorp.com/document/index.html
- YouCam API Documentation
