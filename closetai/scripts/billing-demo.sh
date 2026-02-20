#!/bin/bash
# ClosetAI Billing Demo - Full lifecycle (copy-paste runnable for judges)
# Prerequisites: Server running, migrations + seed applied, Stripe test keys configured

set -e

# Set once
export API="${API:-http://localhost:5000/api}"
export USER_ID="${USER_ID:-$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo '00000000-0000-0000-0000-000000000001')}"
export EMAIL="${EMAIL:-test@example.com}"

echo "=== ClosetAI Billing Demo ==="
echo "API=$API USER_ID=$USER_ID EMAIL=$EMAIL"
echo ""

# Step 1 — Sign up user
echo "Step 1 — Sign up user"
curl -s -X POST "$API/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$USER_ID\",
    \"email\": \"$EMAIL\",
    \"full_name\": \"Test User\"
  }"
echo ""
echo ""

# Step 2 — Create Stripe customer
echo "Step 2 — Create Stripe customer"
CUSTOMER_RESP=$(curl -s -X POST "$API/billing/create-customer" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"email\": \"$EMAIL\",
    \"name\": \"Test User\"
  }")
echo "$CUSTOMER_RESP"
CUSTOMER_ID=$(echo "$CUSTOMER_RESP" | grep -o '"customer":"[^"]*"' | cut -d'"' -f4)
echo ""

# Step 3 — Create subscription (use price_starter_123 from seed)
echo "Step 3 — Create subscription"
SUB_RESP=$(curl -s -X POST "$API/billing/create-subscription" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"priceId\": \"price_starter_123\"
  }")
echo "$SUB_RESP"
echo ""

# Step 4 — Generate usage (AI generation)
echo "Step 4 — Generate usage (AI generation)"
curl -s -X POST "$API/usage/report" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"metric\": \"ai_generations\",
    \"value\": 1
  }"
echo ""
echo ""

# Step 5 — Check quota
echo "Step 5 — Check quota"
curl -s "$API/usage/check?userId=$USER_ID&metric=ai_generations"
echo ""
echo ""

# Step 6 — Exceed quota (demo)
echo "Step 6 — Exceed quota (run 60 calls, expect quota_exceeded)"
for i in $(seq 1 60); do
  RESP=$(curl -s -X POST "$API/usage/report" \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"$USER_ID\",
      \"metric\": \"ai_generations\",
      \"value\": 1
    }")
  if echo "$RESP" | grep -q "quota_exceeded"; then
    echo "Call $i: quota_exceeded (expected)"
    break
  fi
  echo "Call $i: ok"
done

echo ""
echo "=== Demo complete ==="
