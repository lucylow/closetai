# ClosetAI — Onboarding Demo (PR-01)

This document describes the PR-01 implementation for the improved user experience and onboarding flow for ClosetAI.

## Overview

PR-01 implements the foundational UX scaffolding:
- Onboarding modal for first-time users
- File uploader component with drag & drop
- Analytics stub for tracking user events
- Demo mode support

## Files Created/Modified

### Backend
- `backend/src/routes/analytics.ts` - Analytics API endpoint
- `backend/src/server.ts` - Mount analytics route
- `backend/tests/analytics.test.ts` - Analytics tests

### Frontend
- `src/components/OnboardingModal.tsx` - Onboarding modal component
- `src/components/FileUploader.tsx` - Drag & drop file uploader
- `src/pages/Dashboard.tsx` - Dashboard page with onboarding
- `src/lib/analytics.ts` - Analytics client library
- `src/vite-env.d.ts` - TypeScript declarations for Vite env
- `.env.example` - Updated with Vite environment variables

## Setup

### 1. Copy environment files

```bash
cp .env.example .env
```

### 2. Start backend

```bash
cd backend
npm ci
npm run dev
```

Server will start on http://localhost:5000

### 3. Start frontend

```bash
npm ci
npm run dev
```

Open the site (Vite will show URL, usually http://localhost:5173)

## Testing the Flow

1. **First Visit**: On first visit you will see the onboarding modal
2. **Click Start**: Click "Start (Upload)" to jump to the uploader
3. **Upload Image**: Upload an image to see preview and analytics events sent
4. **Backend Logs**: Check backend console