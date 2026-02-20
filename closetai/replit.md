# ClosetAI - Intelligent Stylist Application

## Overview
ClosetAI is an AI-powered fashion/styling application that helps users manage their wardrobe, get outfit suggestions, virtual try-on, trend insights, and social content. Originally built on Lovable, now migrated to Replit.

## Current State
- Frontend is running on Vite + React + TypeScript on port 5000
- Backend (Express/Node.js) exists in `/backend` directory but is not yet configured to run (requires database + environment variables)
- The frontend uses mock data and local state for now

## Project Architecture
- **Frontend**: React 18 + TypeScript + Vite, ShadCN UI, Tailwind CSS, React Router v6, TanStack React Query, Framer Motion
- **Backend**: Express.js (in `/backend`), Sequelize ORM, PostgreSQL
- **Styling**: Tailwind CSS with ShadCN components, next-themes for dark mode

### Directory Structure
- `src/` - Frontend source code
  - `components/` - React components (UI, layout, admin, onboarding, style, etc.)
  - `pages/` - Page components (Home, Dashboard, Wardrobe, Outfits, Trends, Content, Shopping, TryOn, etc.)
  - `contexts/` - React contexts (Auth, Onboarding)
  - `hooks/` - Custom hooks
  - `services/` - API service layers
  - `utils/` - Utility functions
  - `lib/` - Library utilities
  - `assets/` - Static assets
- `backend/` - Backend Express server (separate package.json)
  - `config/` - Configuration (env, database)
  - `controllers/` - Route controllers
  - `models/` - Sequelize models
  - `routes/` - API routes
  - `services/` - Business logic services
  - `middleware/` - Express middleware
  - `jobs/` - Background job processors
  - `migrations/` - Database migrations

## Recent Changes
- 2026-02-19: Unified YouCam/PerfectCorp API key usage
  - All backend API clients now use `YOUCAM_API_KEY` (Replit Secret) as the primary API key
  - `YOUCAM_SECRET_KEY` (Replit Secret) is used as the API secret
  - Fallback chain: YOUCAM_API_KEY -> PERFECT_CORP_API_KEY -> PERFECT_API_KEY
  - Corrected API base URL to `https://yce-api-01.makeupar.com` across all clients
  - Removed hardcoded API keys from backend .env file
  - Updated files: config/env.js, lib/perfectClient.js, lib/yceClient.js, lib/perfectCorpClient.js, lib/perfectAgingClient.js, lib/perfectClient.ts, controllers/skinAnalysis.controller.js, controllers/tryon.controller.js, services/jewelryTryon.service.js, services/perfectCorp.service.js
- 2026-02-15: Migrated from Lovable to Replit
  - Updated vite.config.ts: port 5000, host 0.0.0.0, allowedHosts: true
  - Removed lovable-tagger plugin
  - Removed backend proxy from vite config (backend not running yet)

## User Preferences
- (None recorded yet)

## Database
- **PostgreSQL** via Replit built-in (Neon-backed)
- Connected via `DATABASE_URL` env var (also PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)
- **18 tables**: users, brand_accounts, storage_objects, wardrobe_items, tryon_jobs, brand_analytics, user_cohorts, revenue_attribution, stripe_customers, stripe_subscriptions, user_credits, anonymized_tryon_dataset, ai_training_models, user_settings, user_preferences, outfits, outfit_history, drafts
- **Triggers**: update_brand_mrr (auto MRR calc), deduct_user_credits (credit deduction on try-on), update_updated_at (timestamp auto-update)
- **Materialized Views**: dataset_aggregates, user_ltv_prediction
- **Enums**: wardrobe_category (11 values), subscription_status (5 values)
- Backend config (config/env.js) uses DATABASE_URL with fallback to individual PG* vars
- Sequelize (config/database.js) and raw pg Pool (lib/db.js) both support DATABASE_URL

## Notes
- YouCam/PerfectCorp API keys are stored as Replit Secrets: YOUCAM_API_KEY, YOUCAM_SECRET_KEY
- Webhook secret: PERFECT_CORP_WEBHOOK_SECRET
- You.com API: YOUCOM_API_KEY
- API Server: https://yce-api-01.makeupar.com (v2 API uses /s2s/v2.0 prefix)
- Auth: Bearer token using YOUCAM_API_KEY
- Backend uses Sequelize with PostgreSQL
- Frontend currently works standalone with mock/local data
