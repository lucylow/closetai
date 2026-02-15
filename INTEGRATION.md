# ClosetAI Backend–Frontend Integration

This document describes how the frontend and backend are integrated.

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Edit .env with your PostgreSQL credentials
```

Create a PostgreSQL database named `closetai`:

```sql
CREATE DATABASE closetai;
```

### 2. Start Backend

```bash
cd backend
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Start Frontend

```bash
npm run dev
```

The frontend runs at `http://localhost:8080` and proxies `/api` and `/uploads` to the backend.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register with email/password |
| POST | /api/auth/login | No | Login |
| GET | /api/wardrobe | Yes | List wardrobe items (query: category, tags, sortBy, sortOrder, limit, offset) |
| GET | /api/wardrobe/stats | Yes | Wardrobe statistics (totalItems, wornLast30Days, avgWearCount, categoryBreakdown) |
| POST | /api/wardrobe | Yes | Add item (multipart: image, tags, purchaseDate, purchasePrice) |
| GET | /api/wardrobe/:id | Yes | Get single item |
| PATCH | /api/wardrobe/:id | Yes | Update item (userTags, extractedAttributes, purchaseDate, purchasePrice) |
| DELETE | /api/wardrobe/:id | Yes | Delete item |
| POST | /api/wardrobe/:id/wear | Yes | Record wear (increments wearCount, updates lastWornDate) |
| DELETE | /api/wardrobe/bulk | Yes | Bulk delete (body: itemIds[]) |
| PATCH | /api/wardrobe/bulk/tags | Yes | Bulk update tags (body: itemIds, tagsToAdd, tagsToRemove) |
| GET | /api/recommendations/daily | Yes | Get daily outfit suggestions |
| POST | /api/content/caption | Yes | Generate social caption (GPT, tone/occasion) |
| POST | /api/content/hashtags | Yes | Suggest hashtags (trend-aware, You.com) |
| POST | /api/content/generate-image | Yes | AI image styling (Perfect Corp text-to-image) |
| POST | /api/tryon | No | Virtual try-on (multipart: model_image, garment_image, category, fit). Add ?share=true for shareable URL |
| POST | /api/tryon/vton | No | Alias for /api/tryon |
| POST | /api/tryon/vton-multi | No | Multi-garment try-on (model_image, garment_images[], categories[]) |
| POST | /api/tryon/generate-image | No | AI image from prompt (body: prompt, style). Returns { url } |
| POST | /api/tryon/visualize-outfit | No | Wardrobe stylist flow: VTON + AI social image (userPhoto, topImage, bottomImage?, outfitDescription, generateSocialImage) |
| POST | /api/tryon/measure | No | Body measurement from photo |
| POST | /api/tryon/share | No | Upload try-on result, return shareable URL |
| GET | /api/content/template | Yes | Get platform template (Instagram, TikTok, etc.) |
| POST | /api/content/format | Yes | Format caption + hashtags for platform |
| GET | /api/weather | Yes | Get weather (lat, lon query params) |

## Frontend Integration

- **Auth**: Sign in/out via navbar. Token stored in `localStorage` as `closetai_token`.
- **Wardrobe**: When signed in, items are fetched from API. Add item uses image upload. When signed out, demo data is used.
- **Outfits**: When signed in, "Today's Picks" comes from the recommendations API. Item selector uses wardrobe from API.
- **Content**: When signed in, caption generation uses OpenAI (or fallback). Hashtags from You.com trends.

## Subscription & Plans

- **User.plan**: `free` | `premium` | `enterprise` (default: `free`)
- Auth responses include `plan` in the user object.
- Feature limits are defined in `src/lib/config.ts` (wardrobe items, outfit generations, try-ons, etc.).
- Use `useFeatureAccess()` for premium gating in the UI.

## Environment Variables

### Backend (backend/.env)

- `PORT`, `NODE_ENV`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- Optional: `LINODE_*`, `OPENAI_API_KEY`, `PERFECT_CORP_API_KEY`, `PERFECT_CORP_API_SECRET`, `PERFECT_CORP_BASE_URL`, `YOUCOM_API_KEY`, `REMOVE_BG_API_KEY`, `OPENWEATHERMAP_API_KEY`

### Frontend

- `VITE_API_URL` (optional): Override API base URL. Default uses Vite proxy to `/api`.

## You.com Integration (Hackathon)

ClosetAI integrates You.com's **Search API** for real-time fashion trend research with citations.

- **Trends** (`/api/trends/fashion`): Category-based fashion trends with source URLs, favicons, and rate-limit metadata
- **Search** (`/api/trends/search?q=...`): Custom search with caching
- **Trend-aware outfits** (`/api/trends/outfits/trend-aware`): Outfit recommendations scored against live trends

See `docs/YOUCOM_INTEGRATION.md` for architecture, demo tips, and curl examples.

## Perfect Corp Integration (Hackathon)

ClosetAI integrates Perfect Corp's **Virtual Try-On** and **AI Text-to-Image** APIs for the $1,500 hackathon prize.

- **Virtual Try-On** (`/api/tryon`): Composite clothing onto user photos. Add `?share=true` to get a shareable URL instead of streaming the image.
- **AI Generation** (`/api/content/generate-image`): Generate fashion images from text prompts (returns blob).
- **AI Generation (shareable)** (`/api/tryon/generate-image`): Same as above but returns `{ url }` for shareable links.
- **Visualize Outfit** (`/api/tryon/visualize-outfit`): Combined flow—VTON for top/bottom + optional AI social post image.

### Implementation details

- **Caching**: VTON results are cached by input hash (6–24h) to avoid burning credits on identical requests.
- **Preprocessing**: Images are resized (max 1400px) and converted to PNG before sending.
- **Retries**: `backend/lib/perfectCorpClient.js` uses exponential backoff on 5xx/429.
- **Credit-aware errors**: 402 responses surface `X-Credit-Count` when available.

Sign up at [yce.perfectcorp.com](https://yce.perfectcorp.com/?affiliate=202602DevWeekHackathon) for 1,000 free API units. Set `PERFECT_CORP_API_KEY` in backend `.env`.
