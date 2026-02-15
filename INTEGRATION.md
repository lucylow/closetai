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
- Optional: `LINODE_*`, `OPENAI_API_KEY`, `YOUCOM_API_KEY`, `REMOVE_BG_API_KEY`, `OPENWEATHERMAP_API_KEY`

### Frontend

- `VITE_API_URL` (optional): Override API base URL. Default uses Vite proxy to `/api`.
