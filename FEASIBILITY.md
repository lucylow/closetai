# ClosetAI Startup Feasibility – Technical Implementation

This document maps the business feasibility thesis to the codebase architecture, showing how ClosetAI is structured for scale and investor readiness.

## Architecture Overview

| Business Requirement | Implementation |
|---------------------|----------------|
| **Freemium model** | `src/lib/config.ts` – plan tiers (free/premium/enterprise) with limits |
| **Premium gating** | `src/hooks/useFeatureAccess.ts` – `canUse()`, `checkLimit()`, `showUpgradePrompt()` |
| **Affiliate revenue** | `src/services/analytics.service.ts` – `trackAffiliateClick()`; config `hasAffiliateLinks` |
| **Product metrics** | `src/services/analytics.service.ts` – engagement, conversions, upgrade prompts |
| **API resilience** | `src/lib/api.ts` – retry on 5xx/429, structured error handling |
| **Subscription data** | `backend/models/User.js` – `plan` column; auth returns `plan` in user object |

## Plan Limits (config.ts)

| Limit | Free | Premium | Enterprise |
|-------|------|---------|------------|
| Wardrobe items | 25 | 500 | ∞ |
| Outfit generations/day | 5 | 50 | ∞ |
| Virtual try-ons/month | 3 | 50 | ∞ |
| AI captions/day | 10 | 100 | ∞ |
| Trend reports/week | 2 | 20 | ∞ |
| Advanced styling | ❌ | ✅ | ✅ |
| Affiliate links | ✅ | ✅ | ✅ |

## Feature Flags

Controlled in `src/lib/config.ts` for gradual rollout and A/B testing:

- `virtualTryOn`, `contentGenerator`, `shoppingAnalysis`, `impactDashboard`, `socialSharing`, `affiliateRecommendations`

## Analytics Events

| Event | Purpose |
|-------|---------|
| `outfit_generated` | Engagement, occasion mix |
| `outfit_rated` | Recommendation quality, personalization loop |
| `wardrobe_item_added` | Activation, category mix |
| `affiliate_click` | Revenue attribution |
| `upgrade_prompt_shown` | Conversion funnel |

## Next Steps for Scale

1. **Usage API** – Replace in-memory usage in `useFeatureAccess` with `/api/usage` for server-side limits.
2. **Stripe/payments** – Add subscription endpoints and webhook for plan upgrades.
3. **Analytics provider** – Wire `analytics.service` to Mixpanel, Amplitude, or PostHog.
4. **Affiliate links** – Add product recommendation types with `affiliateUrl` and `trackAffiliateClick()` on click.
