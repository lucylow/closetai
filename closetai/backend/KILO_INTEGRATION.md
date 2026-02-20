# Closet AI + Perfect/YouCam Enterprise Integration

## Overview
This document describes the enterprise-grade integration between Closet AI and Perfect/YouCam AI services (YCE API).

## Features Implemented

### 1. YCE API Client (`backend/lib/yceClient.js`)
- **File Registration API**: Registers uploads before creating AI tasks
- **Rate Limiting**: 250 requests per 300s window, 5 QPS
- **Exponential Backoff**: Automatic retry with jitter
- **Credit Tracking**: Monitors X-Credit-Count header

#### Supported AI Tasks:
- `makeupTryOnTask` - Makeup virtual try-on
- `skinAnalysisTask` - Skin analysis
- `hairStyleTask` - Hair styling
- `clothesTryOnTask` - Clothing virtual try-on
- `accessoryTryOnTask` - Accessory virtual try-on
- `getTaskResult` - Poll for job results
- `pollTaskCompletion` - Wait for async job completion

### 2. Credit Tracking Service (`backend/services/creditService.js`)
- Tracks API usage per user
- Enforces credit quotas
- Integrates with Stripe for billing
- Credit costs per operation:
  - `makeup_tryon`: 1 credit
  - `skin_analysis`: 2 credits
  - `hair_style`: 1 credit
  - `fashion_tryon`: 2 credits
  - `accessory_tryon`: 1 credit
  - `creative_lookbook`: 3 credits
  - `fun_filter`: 0.5 credits
  - `avatar_creation`: 2 credits

### 3. Webhook Service (`backend/services/webhookService.js`)
- Real-time job completion notifications
- Credit balance alerts
- Subscription event notifications
- HMAC-signed payloads for security

### 4. Admin Analytics Routes (`backend/routes/admin.analytics.routes.js`)
- `/admin/analytics/overview` - System-wide overview
- `/admin/analytics/trends` - Usage trends
- `/admin/analytics/top-users` - Top users by usage
- `/admin/analytics/job-latency` - Processing latency
- `/admin/analytics/error-rate` - Error metrics
- `/admin/analytics/popular-styles` - Popular styles/effects

### 5. Pricing Service (`backend/services/pricingService.js`)
- Subscription plans: Free, Starter, Professional, Enterprise
- Credit packages for one-time purchases
- Stripe checkout integration
- Feature-based access control
- Daily job limits per tier

## Environment Variables Required

```env
# Perfect/YouCam API
PERFECT_CORP_API_KEY=your_api_key
PERFECT_CORP_YCE_URL=https://yce-api-01.makeupar.com/s2s/v2.0

# Stripe Billing
STRIPE_SECRET_KEY=sk_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_CREDITS_50=price_...
STRIPE_CREDITS_100=price_...
STRIPE_CREDITS_250=price_...
STRIPE_CREDITS_500=price_...

# Frontend
FRONTEND_URL=https://your-frontend.com
```

## API Endpoints

### AI Jobs
- `POST /api/ai/upload-url` - Get signed upload URL
- `POST /api/ai/makeup` - Create makeup try-on job
- `POST /api/ai/skin` - Create skin analysis job
- `POST /api/ai/hair` - Create hair styling job
- `POST /api/ai/fashion` - Create fashion try
