# Sponsor Integrations - PR-01 Demo Guide

This document describes the Sponsor Integrations feature for PR-01.

## Overview

PR-01 adds a Sponsor Integrations UI and demo backend stubs that allow users to connect to four sponsor APIs:
- **Perfect Corp** - Virtual Try-On provider
- **You.com** - Search / embeddings
- **OpenAI** - Text & image generation
- **Stripe** - Payments provider

## Quick Demo Steps

### 1. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Ensure `DEMO_MODE=true` is set (this is the default).

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on port 5000 by default.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend typically runs on port 5173.

### 4. Test the Feature

1. Navigate to `/sponsors` in the frontend
2. You should see 4 sponsor cards with "Disconnected" status
3. Click "Connect" on any sponsor
4. Choose "Demo (no key required)" mode
5. Click "Connect" - the status should change to "Connected (demo)"
6. Click "Test" to verify the connection returns demo data

## API Endpoints

### GET /api/sponsors/list
Returns all sponsors with their connection status.

### POST /api/sponsors/connect
Connects to a sponsor.
- Body: `{ id: string, mode: "demo" | "live", apiKey?: string }`

### POST /api/sponsors/disconnect
Disconnects from a sponsor.
- Body: `{ id: string }`

### POST /api/sponsors/test
Tests the connection to a sponsor.
- Body: `{ id: string }`

## Demo Mode Behavior

When `DEMO_MODE=true`:
- No real network calls are made to provider APIs
- Connect flow sets `mode: 'demo'` and `connected: true`
- Test calls return deterministic demo payloads

## Production Notes

For production deployment:
- Use a secrets manager (Vault, AWS Secrets Manager) for API keys
- Implement OAuth redirect flows for OAuth-based sponsors
- Add server-side rate limits and cost estimation
- Set up monitoring and alerts for failed API calls

## Next Steps (PR-02..PR-10)

- PR-02: Feature wiring - map frontend toggles to sponsor choices
- PR-03: Backend secure storage & token flow
- PR-04: Try-On integration demo (Perfect Corp)
- PR-05: Search integration demo (You.com)
- PR-06: Generation integration demo (OpenAI)
- PR-07: Payments integration demo (Stripe)
- PR-08: Admin page for sponsor usage & logs
- PR-09: E2E tests and CI updates
- PR-10: Documentation & production notes
