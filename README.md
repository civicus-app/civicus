# CIVICUS MVP

React + TypeScript + Vite client for the CIVICUS civic engagement MVP.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Add your Supabase values to `.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Local-Only Mode (No Supabase Required)

Set this in `.env.local`:

```env
VITE_DATA_PROVIDER=local
```

You can then log in with seeded demo accounts:

- `admin@civicus.local` / `admin12345`
- `citizen@civicus.local` / `citizen12345`

All data persists in browser localStorage.

## Switch To Supabase Later

Set:

```env
VITE_DATA_PROVIDER=supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The app will use real Supabase automatically.

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Typecheck

```bash
npm run typecheck
```
