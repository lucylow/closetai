# ClosetAI

## Overview

ClosetAI is an AI-powered personal stylist application built for the DeveloperWeek 2026 Hackathon. It helps users manage their wardrobe, get AI-generated outfit recommendations, perform virtual try-ons, track fashion trends, generate social media content, and receive shopping suggestions — all while reducing decision fatigue and encouraging sustainable fashion through rewearing existing clothes.

The project has two main applications:
1. **Primary app** — A Vite + React + TypeScript frontend (root directory) with an Express.js backend (`/backend`)
2. **Web dashboard** — A separate Next.js app in `/web-dashboard` (secondary, not the main app)

The application supports a `DEMO_MODE` that uses local fixtures and mock data instead of real API keys, making it runnable without external service credentials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Root Directory)
- **Framework**: React 18 with TypeScript, bundled by Vite
- **UI Library**: ShadCN UI components (configured in `components.json`) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, `next-themes` for dark mode toggle
- **Routing**: React Router v6 with a `Layout` wrapper component
- **State Management**: TanStack React Query for server state, React Context for auth (`AuthContext`) and onboarding (`OnboardingContext`)
- **Animations**: Framer Motion
- **Path Aliases**: `@/*` maps to `./src/*`
- **Dev Server**: Runs on port 5000, host `0.0.0.0`, with `allowedHosts: true` for Replit compatibility
- **Testing**: Vitest with jsdom environment, React Testing Library, setup file at `src/test/setup.ts`

Key frontend pages: Home, Dashboard, Wardrobe, Outfits, Trends, Content, Shopping, TryOn, SkinAnalysis, JewelryStudio, Sponsors, AdminBilling, AdminDashboard, StyleExplorer, Onboarding

### Backend (`/backend`)
- **Framework**: Express.js with both JavaScript (CommonJS) and TypeScript files
- **ORM**: Sequelize with PostgreSQL
- **Database**: PostgreSQL (database name: `closetai`)
- **Authentication**: JWT-based auth with middleware protection on routes
- **Job Queue**: Bull/BullMQ with Redis for async image processing, generation jobs, aging analysis, and Kilo agent tasks
- **File Uploads**: Multer for handling multipart uploads, Linode Object Storage (S3-compatible) for file storage
- **API Structure**: RESTful endpoints under `/api` prefix, organized by domain (auth, wardrobe, trends, tryon, content, billing, admin, etc.)
- **Error Handling**: Custom error classes (BadRequest, NotFound, etc.), async handler wrapper, Winston logger
- **Dev Server**: Runs via `ts-node-dev` on port 5000 (configurable via PORT env var)
- **Testing**: Jest with ts-jest, supertest for integration tests

### ML Services (`/ml`)
- Python-based microservices using FastAPI + Uvicorn
- Sentence Transformers for embeddings
- Scikit-learn for ranking models
- Separate embedding service and ranker model servers

### Data Models
Key Sequelize models: User (with plan/subscription tier), WardrobeItem (with embeddings, attributes, tags, wear tracking), Outfit, OutfitHistory, Draft, UserPreference

### TypeScript Data Access Layer (`backend/lib/repos/`)
Typed repository functions using raw `pg` queries (via `backend/lib/db.js`):
- `repos/users.ts` — getUserById, getUserByAnonId, getUserByEmail, createAnonUser, updateCredits, updateLastLogin
- `repos/wardrobe.ts` — createWardrobeItem, listWardrobeItems, getWardrobeItem, deleteWardrobeItem, incrementUsageCount
- `repos/tryon.ts` — createTryOnJob, getTryOnJob, listRecentTryOnJobs, updateTryOnJobStatus, getTryOnStats

### Database Scripts
- `npm run db:migrate` — Apply `db/migrations/001_init.sql` (idempotent, uses IF NOT EXISTS)
- `npm run db:health` — Run health check (`scripts/db-health-check.mjs`)

### Subscription/Billing Architecture
- Freemium model with Free, Premium (Starter), and Enterprise tiers
- Feature gating via `useFeatureAccess` hook on frontend and plan-based limits in config
- Stripe integration for payments (customer creation, subscriptions, webhooks, metered billing)
- Usage tracking and quota enforcement per user
- Credit system for AI operations (different costs per operation type)

### Key Design Patterns
- **DEMO_MODE**: When enabled, the app uses fixture files (`backend/fixtures/`) and mock services instead of real API calls. This is critical for demos and development without API keys.
- **Feature Flags**: Controlled in `src/lib/config.ts` for gradual feature rollout
- **Proxy Pattern**: Frontend was designed to proxy `/api` requests to the backend (proxy currently disabled since backend isn't running on Replit yet)
- **Queue-based Processing**: Heavy AI tasks (image processing, try-on, aging analysis) are queued via Bull/BullMQ for async processing with progress tracking via Redis pub/sub

## External Dependencies

### APIs & Services
- **Perfect Corp / YouCam (YCE API)**: Virtual try-on (clothes, shoes, accessories, scarves), skin analysis, aging simulation, makeup try-on. API key via `YOUCAM_API_KEY` Replit Secret with fallback chain: `YOUCAM_API_KEY` → `PERFECT_CORP_API_KEY` → `PERFECT_API_KEY`. Base URL: `https://yce-api-01.makeupar.com`
- **You.com Search API**: Fashion trend research with citations, cached via NodeCache + Redis. Used for trend-aware outfit recommendations.
- **OpenAI**: Text generation (captions, outfit explanations, style advice) and image generation
- **Stripe**: Subscription billing, metered usage reporting, webhooks for payment events
- **Linode Object Storage**: S3-compatible file storage for processed images, try-on results, and user uploads
- **Weather API**: Weather-based outfit recommendations (location-aware)

### Database
- **PostgreSQL**: Primary data store via Sequelize ORM. Required for backend operation. Migrations in `backend/migrations/`.
- **Redis**: Job queue backend (Bull/BullMQ), caching layer, pub/sub for real-time job progress. Optional — the app degrades gracefully without Redis (falls back to synchronous processing).

### Monitoring (Optional)
- Grafana dashboard config in `/grafana` for Prometheus metrics
- Winston file logging (`backend/logs/`)
- Analytics service with event tracking (outfit_generated, affiliate_click, etc.)

### Dev Tools
- Vite for frontend bundling
- ESLint with TypeScript and React plugins
- Vitest (frontend) and Jest (backend) for testing
- Docker Compose for local development environment (`docker-compose.demo.yml`)
- Postman collections in `/postman` for API testing

### Recent Changes (Feb 2026)

#### KendoReact Enterprise UI Enhancement
- **Dashboard**: Complete rebuild with enterprise KPI cards ($2.1M MRR, 1.2M DAU, 42% conversion, 3.8x LTV:CAC), MRR area chart (recharts), wardrobe distribution pie chart, sortable/pageable brand performance data grid, recent activity list, and AI feature usage progress bars
- **Wardrobe**: Added "table" view mode (third option alongside grid/list) with KendoReact-style enterprise data grid — sortable columns, AI confidence/trend score progress bars, Try-On buttons, and pagination controls
- **KendoPoweredBadge**: "Built with Progress KendoReact Enterprise v12.0.1" badge component displayed on Dashboard header and as floating badge on all pages (via Layout)
- **Nova Theme CSS**: k-card, k-grid-header, hover-elevate, kendo-enterprise-badge CSS classes for consistent enterprise styling
- **Key files**: `src/components/KendoPoweredBadge.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Wardrobe.tsx`, `src/index.css`

#### Demo Mode Enhancements
- Rich mock data for virtual try-on gallery, AI-generated outfits, skin analysis, API statistics
- YouComTrends with immediate demo data fallback for 4 occasions
- PerfectCorpTryOn with tabbed interface (Try-On, Gallery, AI Outfits)
- Sponsors page API stats dashboard (156 calls, 98.7% success rate)