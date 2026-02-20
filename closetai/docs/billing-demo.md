# ClosetAI Billing Demo

Judge-friendly walkthrough: deterministic migrations, explicit plan/limit definitions, real Stripe metered billing.

## Prerequisites

- PostgreSQL running
- Redis (for Stripe usage queue)
- `STRIPE_SECRET_KEY` (test mode key)
- Run migrations + seed: `cd backend && npm run migrate && npm run seed-plans`

## High-Level Flow

1. Sign up user
2. Create Stripe customer
3. Create subscription
4. Generate usage
5. Check quota
6. Exceed quota (demo enforcement)

## curl Demo (Bash)

```bash
export API=http://localhost:5000/api
export USER_ID=$(uuidgen)   # or use a fixed UUID
export EMAIL=test@example.com

# Step 1 — Sign up user
curl -X POST $API/users -H "Content-Type: application/json" \
  -d '{"id":"'$USER_ID'","email":"'$EMAIL'","full_name":"Test User"}'

# Step 2 — Create Stripe customer
curl -X POST $API/billing/create-customer -H "Content-Type: application/json" \
  -d '{"userId":"'$USER_ID'","email":"'$EMAIL'","name":"Test User"}'
# Save customer ID from response (cus_xxx)

# Step 3 — Create subscription
curl -X POST $API/billing/create-subscription -H "Content-Type: application/json" \
  -d '{"customerId":"cus_xxx","priceId":"price_starter_123"}'

# Step 4 — Generate usage
curl -X POST $API/usage/report -H "Content-Type: application/json" \
  -d '{"userId":"'$USER_ID'","metric":"ai_generations","value":1}'

# Step 5 — Check quota
curl "$API/usage/check?userId=$USER_ID&metric=ai_generations"

# Step 6 — Exceed quota (run 60 times to hit limit of 50)
for i in {1..60}; do
  curl -s -X POST $API/usage/report -H "Content-Type: application/json" \
    -d '{"userId":"'$USER_ID'","metric":"ai_generations","value":1}'
done
# Eventually returns: {"error":"quota_exceeded"}
```

## Scripts

- **Bash**: `./scripts/billing-demo.sh`
- **PowerShell**: `./scripts/billing-demo.ps1`

## Postman

Import `postman/ClosetAI-Billing-Demo.postman_collection.json` and `postman/ClosetAI-Billing-Demo.postman_environment.json`.

Set `customer_id` after Step 2 (create-customer) before running Step 3.

## What Judges See

- Usage is server-enforced, not client-reported
- Billing is real Stripe metered billing, not fake counters
- Analytics are server-side authoritative
- Limits are configurable per plan and overrideable
- Reproducible via CI/CD and curl

## Stripe Invoice Visibility

Usage is reported asynchronously via Stripe's metered billing API. Stripe automatically aggregates usage into the invoice at the end of the billing cycle — no cron jobs, no manual math.

To show live: **Stripe Dashboard → Customer → Invoices → Usage breakdown**
