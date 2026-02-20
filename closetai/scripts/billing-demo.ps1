# ClosetAI Billing Demo - Full lifecycle (PowerShell, copy-paste runnable for judges)
# Prerequisites: Server running, migrations + seed applied, Stripe test keys configured

$API = if ($env:API) { $env:API } else { "http://localhost:5000/api" }
$USER_ID = if ($env:USER_ID) { $env:USER_ID } else { [guid]::NewGuid().ToString() }
$EMAIL = if ($env:EMAIL) { $env:EMAIL } else { "test@example.com" }

Write-Host "=== ClosetAI Billing Demo ==="
Write-Host "API=$API USER_ID=$USER_ID EMAIL=$EMAIL"
Write-Host ""

# Step 1 — Sign up user
Write-Host "Step 1 — Sign up user"
$body1 = @{ id = $USER_ID; email = $EMAIL; full_name = "Test User" } | ConvertTo-Json
Invoke-RestMethod -Uri "$API/users" -Method Post -Body $body1 -ContentType "application/json"
Write-Host ""

# Step 2 — Create Stripe customer
Write-Host "Step 2 — Create Stripe customer"
$body2 = @{ userId = $USER_ID; email = $EMAIL; name = "Test User" } | ConvertTo-Json
$custResp = Invoke-RestMethod -Uri "$API/billing/create-customer" -Method Post -Body $body2 -ContentType "application/json"
$CUSTOMER_ID = $custResp.customer
Write-Host "customer: $CUSTOMER_ID"
Write-Host ""

# Step 3 — Create subscription
Write-Host "Step 3 — Create subscription"
$body3 = @{ customerId = $CUSTOMER_ID; priceId = "price_starter_123" } | ConvertTo-Json
Invoke-RestMethod -Uri "$API/billing/create-subscription" -Method Post -Body $body3 -ContentType "application/json"
Write-Host ""

# Step 4 — Generate usage
Write-Host "Step 4 — Generate usage (AI generation)"
$body4 = @{ userId = $USER_ID; metric = "ai_generations"; value = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "$API/usage/report" -Method Post -Body $body4 -ContentType "application/json"
Write-Host ""

# Step 5 — Check quota
Write-Host "Step 5 — Check quota"
Invoke-RestMethod -Uri "$API/usage/check?userId=$USER_ID&metric=ai_generations" -Method Get
Write-Host ""

# Step 6 — Exceed quota
Write-Host "Step 6 — Exceed quota (run 60 calls)"
for ($i = 1; $i -le 60; $i++) {
  try {
    $body5 = @{ userId = $USER_ID; metric = "ai_generations"; value = 1 } | ConvertTo-Json
    Invoke-RestMethod -Uri "$API/usage/report" -Method Post -Body $body5 -ContentType "application/json"
    Write-Host "Call $i : ok"
  } catch {
    if ($_.Exception.Response.StatusCode -eq 402) {
      Write-Host "Call $i : quota_exceeded (expected)"
      break
    }
    throw
  }
}

Write-Host ""
Write-Host "=== Demo complete ==="
