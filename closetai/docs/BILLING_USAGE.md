# Billing, Usage & Analytics Implementation

This document describes the Usage API, Stripe integration, and Segment analytics added to ClosetAI.

## Quick Start

1. **Run migrations**
   ```bash
   cd backend && npm run migrate
   ```

2. **Seed plans and quotas**
   ```bash
   npm run seed-plans
   ```

3. **Set environment variables** (see `.env.example`):
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `SEGMENT_WRITE_KEY`
   - `ADMIN_TOKEN`

4. **Start the Stripe usage worker** (for metered billing):
   ```bash
   npm run stripe-worker
   ```

## API Endpoints

### Usage
- `POST /api/usage/report` — Report usage (auth required). Body: `{ metric, value? }`
- `GET /api/usage/check?metric=...` — Check quota (auth required)

### Billing
- `POST /api/billing/create-customer` — Create Stripe customer (auth required)
- `POST /api/billing/create-subscription` — Create subscription. Body: `{ customerId, priceId }`
- `POST /api/billing/webhook` — Stripe webhook (raw body, no auth)

### Admin
- `GET /api/admin/status` — Queue depth, credits (Bearer ADMIN_TOKEN)
- `GET /api/admin/billing` — Stripe queue, users near quota (Bearer ADMIN_TOKEN)

## Integrating Usage Reporting

When a billable action completes (e.g. VTON, AI generation), call:

```js
const usageService = require('./services/usageService');
await usageService.reportUsage({
  userId: req.user.id,
  metric: 'vton_calls',
  value: 1,
  reportedBy: 'vton-service',
});
```

## Docker Compose (Local Dev)

```bash
docker-compose -f docker-compose.billing.yml up -d
```

Then run migrations against the `db` service.

## Admin Dashboard

Visit `/admin/billing` with `VITE_ADMIN_TOKEN` set for the admin token, or while logged in as admin.
