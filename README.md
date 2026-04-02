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
- `VITE_AI_API_BASE_URL` (optional, external AI API)
- `VITE_AI_API_KEY` (optional, external AI API)
- `VITE_AI_API_TIMEOUT_MS` (optional, default `12000`)

## Local-Only Mode (No Supabase Required)

Set this in `.env.local`:

```env
VITE_DATA_PROVIDER=local
```

Local mode also includes:

- admin invite code: `CIVICUS-ADMIN-ACCESS`
- mocked OTP delivery directly in the auth UI for testing
- direct signup for new local users

All data persists in browser localStorage.

## Switch To Supabase Later

Set:

```env
VITE_DATA_PROVIDER=supabase
VITE_ENABLE_MFA=false
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The app will use real Supabase automatically.

## Auth and MFA

The auth flow now uses:

- password sign-in with email OTP MFA
- visible `Citizen` and `Admin` signup modes
- invite-gated admin signup
- trusted devices for citizen logins only

For development, MFA is disabled by default:

```env
VITE_ENABLE_MFA=false
```

With MFA disabled, the app uses direct email/password auth and still keeps admin signup invite-gated.
Set `VITE_ENABLE_MFA=true` when you want to use the OTP flow again.

For hosted Supabase mode, OTP delivery depends on Edge Functions and Resend. See `supabase/README.md` for the required migrations, secrets, and admin invite SQL.

## Default Demo Accounts In Supabase Mode

This repo includes a bootstrap script for hosted Supabase demo accounts:

```bash
npm run bootstrap:accounts
```

When Supabase CLI is logged in, the script uses the project service-role key automatically.

It creates:

- `admin@civicus.example.com` / `admin12345`
- `citizen@civicus.example.com` / `citizen12345`

The `admin@civicus.example.com` account is promoted to `admin` by the profile bootstrap trigger.
Use these only for demo or non-production environments.

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

## Deploy To GitHub Pages

This repo includes a GitHub Actions workflow for Pages deployment.

1. Push the project to the target GitHub account and repository.
2. In that repository, open `Settings -> Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` or run the `Deploy To GitHub Pages` workflow manually.

Notes:

- The workflow computes the correct Vite base path automatically for the target repo.
- The Pages build uses hash routing so client-side routes work on GitHub Pages.
- If the target repo is `username.github.io`, the site is served at the domain root.
- Otherwise the site is served under `https://username.github.io/repository-name/`.
