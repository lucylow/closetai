# AI Aging Features - Implementation Guide

## Overview

This document describes the AI Aging Features implementation for Closet AI, integrating with Perfect/YouCam APIs to provide skin diagnostic analysis, aging simulation, and personalized recommendations.

**⚠️ Important Safety Notice**: This feature analyzes facial skin and provides educational, non-medical insights. Results are clearly labeled as illustrative estimates, NOT medical diagnoses. Parental consent is required for users under 13 years old.

## Files Created

### Backend Files

| File | Description |
|------|-------------|
| [`backend/migrations/009_aging_features.sql`](backend/migrations/009_aging_features.sql) | Database schema for aging jobs, reports, consent, feedback |
| [`backend/lib/agingStorage.js`](backend/lib/agingStorage.js) | S3 storage helpers specific to aging features |
| [`backend/lib/perfectAgingClient.js`](backend/lib/perfectAgingClient.js) | Perfect/YouCam API client wrapper for aging |
| [`backend/lib/agingQueue.js`](backend/lib/agingQueue.js) | BullMQ queue wrapper for aging jobs |
| [`backend/workers/agingWorker.js`](backend/workers/agingWorker.js) | Worker for processing aging analysis/simulation |
| [`backend/routes/agingRoutes.js`](backend/routes/agingRoutes.js) | API routes for aging endpoints |
| [`backend/mocks/perfect-mock.js`](backend/mocks/perfect-mock.js) | Mock Perfect API server for testing |

### Frontend Files

| File | Description |
|------|-------------|
| [`src/pages/AgingDashboard.tsx`](src/pages/AgingDashboard.tsx) | Main aging analysis dashboard page |
| [`src/components/aging/AgingUploadWidget.tsx`](src/components/aging/AgingUploadWidget.tsx) | Face image upload component |
| [`src/components/aging/AgingReportCard.tsx`](src/components/aging/AgingReportCard.tsx) | Analysis results display |
| [`src/components/aging/AgingSimulator.tsx`](src/components/aging/AgingSimulator.tsx) | Age progression/regression simulator |
| [`src/components/aging/ConsentModal.tsx`](src/components/aging/ConsentModal.tsx) | Consent dialog component |

## Environment Variables

Add these to your `.env`:

```bash
# Perfect/YouCam API
PERFECT_BASE=https://yce.perfectcorp.com
PERFECT_API_KEY=sk_perfect_xxx
PERFECT_TIMEOUT_MS=90000

# Aging-specific
AGE_SIMULATION_MAX_YEARS=20
MINOR_AGE_CUTOFF=13
PARENTAL_CONSENT_REQUIRED=true
DEFAULT_RETENTION_DAYS=30

# Queue names
AGING_HD_QUEUE_NAME=closetai-aging-hd-queue
AGING_LOW_QUEUE_NAME=closetai-aging-low-queue
```

## Database Setup

Run the migration:

```bash
psql $DATABASE_URL -f backend/migrations/009_aging_features.sql
```

## Running Locally

### 1. Start dependencies

```bash
# Start PostgreSQL, Redis, MinIO
docker-compose up -d postgres redis minio
```

### 2. Run migrations

```bash
cd backend
npm run migrate
```

### 3. Start mock Perfect server (for testing)

```bash
node backend/mocks/perfect-mock.js
# Runs on port 3456
```

### 4. Start backend

```bash
cd backend
npm run dev
```

### 5. Start frontend

```bash
npm run dev
```

### 6. Access Aging Dashboard

Navigate to: `http://localhost:3000/aging` (or wherever your app is mounted)

## API Endpoints

### POST /api/aging/upload-url
Get signed URL for uploading face images.

**Request:**
```json
{
  "userId": "uuid",
  "filename": "selfie.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "uploadUrl": "https://...",
  "key": "aging/user/uuid/uploads/..."
}
```

### POST /api/aging/consent
Record user consent.

**Request:**
```json
{
  "userId": "uuid",
  "consentType": "face_analysis",
  "consentText": "I consent to...",
  "parentalConsent": false
}
```

### POST /api/aging/analyze
Enqueue aging analysis job.

**Request:**
```json
{
  "userId": "uuid",
  "srcKey": "aging/user/uuid/uploads/...",
  "requestedMetrics": ["wrinkle", "pore", "pigment", "moisture"]
}
```

### POST /api/aging/simulate
Enqueue aging simulation.

**Request:**
```json
{
  "userId": "uuid",
  "srcKey": "aging/user/uuid/uploads/...",
  "yearsDelta": 10,
  "direction": "older"
}
```

### GET /api/aging/job/:id
Get job status and results.

### POST /api/aging/feedback
Submit feedback on results.

### DELETE /api/aging/user/:userId/data
Delete all aging data for a user (GDPR compliance).

## Metrics & Scoring

The aging analysis computes the following metrics:

| Metric | Description | Range |
|--------|-------------|-------|
| Wrinkle Index | Aggregate wrinkle severity | 0-1 |
| Pigmentation Index | Spot count + color variance | 0-1 |
| Hydration Index | Moisture level proxy | 0-1 |
| Elasticity Proxy | Firmness indicator | 0-1 |
| UV Damage Score | Sun exposure indicators | 0-1 |
| Estimated Appearance Age | Illustrative age estimate | 18-80 |

**⚠️ All metrics are educational approximations, not medical diagnoses.**

## Privacy & Consent

### Consent Flow
1. User must provide explicit consent before any face upload
2. For users under MINOR_AGE_CUTOFF (13), parental consent is required
3. Consent records are stored with timestamp and IP address

### Data Retention
- Default retention: 30 days (configurable via DEFAULT_RETENTION_DAYS)
- Users can request deletion at any time via `/api/aging/user/:userId/data`

### Minor Protection
- Age detection via date_of_birth field
- Parental consent email verification
- Special opt-out handling

## Credit System

Job types and credit costs:

| Job Type | Credits |
|----------|---------|
| aging_analysis | 3 |
| aging_simulation | 8 |
| diagnostic_report | 2 |
| overlay_render | 1 |

## Testing

### Unit Tests
```bash
cd backend
npm test
```

### Integration Tests
```bash
# Start mock server
node backend/mocks/perfect-mock.js

# Run integration tests
npm run test:integration
```

## Monitoring

Prometheus metrics are exposed at `/metrics` with:

- `aging_jobs_total{type,status}` - Job counts
- `aging_job_duration_seconds` - Job duration histogram
- `perfect_api_calls_total` - API call counts
- `perfect_api_errors_total` - Error counts

## Product Recommendations

Recommendations are generated based on metrics:

| Condition | Recommendation |
|-----------|---------------|
| UV damage > 0.4 | SPF 30+ sunscreen |
| Hydration < 0.5 | Hyaluronic acid serum |
| Wrinkle index > 0.5 | Gentle retinol (OTC) |
| Pigmentation > 0.4 | Vitamin C + Niacinamide |

All recommendations include clear disclaimers about professional consultation for medical concerns.

## License & Disclaimer

This code is provided as-is for implementation reference. The AI aging features are for educational/entertainment purposes only and should not be used for medical diagnosis or treatment decisions.

---

**Last Updated**: 2026-02-19
