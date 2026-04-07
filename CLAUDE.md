# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paraguay Decision Dashboard: a personal crisis-monitoring tool that tracks 15 geopolitical, energy, agriculture, political, and civil liberties indicators to inform a UK-to-Paraguay relocation decision. It uses a traffic-light system (GREEN/AMBER/RED) based on observable tripwires defined in `triggers.md`.

## Repository Structure

This is a **monorepo** with two packages at the root (no workspace manager):

- **`dashboard/`** — Next.js 16 app (React 19, Tailwind CSS 4, TypeScript). The main web UI and all API routes.
- **`cron-worker/`** — Cloudflare Worker that triggers dashboard data refreshes on a daily cron (`0 8 * * *`). Deployed via Wrangler.

## Commands

All commands run from within the respective package directory.

### Dashboard (`cd dashboard`)
```bash
npm run dev          # Next.js dev server (localhost:3000)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint (next/core-web-vitals + typescript)
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
```

### Cron Worker (`cd cron-worker`)
```bash
npm run dev          # Wrangler local dev
npm run deploy       # Deploy to Cloudflare Workers
```

## Architecture

### Data Flow

1. **Cron Worker** (`cron-worker/src/index.ts`) fires daily at 08:00 UTC, calling `POST /api/cron/refresh` on the dashboard with a bearer token.
2. **Refresh route** (`dashboard/app/api/cron/refresh/route.ts`) orchestrates the full pipeline:
   - Fetches data from 7 API/scrape sources in parallel (`app/lib/fetchers/`)
   - Calls Grok AI (via OpenRouter) for 12 qualitative assessments (`app/lib/fetchers/grok.ts`)
   - Evaluates each indicator against its definition (`app/lib/indicator-evaluation.ts`)
   - Persists state + history to Upstash Redis (`app/lib/kv.ts`)
   - Sends email alerts on status changes or fetch errors via Resend (`app/lib/email.ts`)
3. **Dashboard page** (`app/page.tsx`) is a server component that reads state from Redis and renders the traffic-light UI.

### Indicator System

- **15 indicators** across 5 categories defined in `app/lib/indicators.ts`, each with a category, threshold, fetch tier (`api`/`scrape`/`ai`), and evaluation strategy.
- **Evaluation strategies** (`app/lib/indicator-evaluation.ts`):
  - `numeric-threshold` — simple value vs threshold
  - `deadline-threshold` — only evaluates after a date (e.g., gas storage by June 30)
  - `sustained-threshold` — requires N consecutive breach points
  - `ai-assessment` — evaluated by Grok AI, not numerically
  - `reference-only` — displayed but never triggers
- **Traffic light logic** (`app/lib/traffic-light.ts`): 4+ triggered = RED, 2-3 = AMBER, 0-1 = GREEN.

### Data Sources (Fetchers in `app/lib/fetchers/`)

| Fetcher | Source | Indicator |
|---------|--------|-----------|
| `agsi.ts` | AGSI API (Gas Infrastructure Europe) | EU gas storage fill % |
| `oilprice.ts` | TTF gas price | Wholesale gas price |
| `ons.ts` | ONS Beta API | UK food CPI inflation |
| `acled.ts` | ACLED API | Houthi attack count |
| `ukhsa.ts` | UKHSA Dashboard API | Health outbreak cases |
| `ahdb.ts` | AHDB | Fertilizer prices |
| `hormuz.ts` | Web scraping | Hormuz transit data |
| `grok.ts` | Grok AI via OpenRouter | 12 qualitative assessments (incl. civil liberties) |

### Auth

- Dashboard is password-protected via `/login` page and cookie-based sessions (`app/lib/auth.ts`).
- Cron endpoint is protected by bearer token (`CRON_SECRET`).
- Auth uses HMAC-SHA256 signed payloads with expiry, no external auth library.

### Key Dependencies

- **Upstash Redis** (`@upstash/redis`) — serverless KV store for dashboard state and indicator history
- **OpenAI SDK** (`openai`) — used as OpenRouter client for Grok AI assessments
- **Resend** (`resend`) — email alerts on status changes and fetch failures
- **Wrangler** — Cloudflare Workers CLI for the cron worker

## Environment Variables

### Dashboard
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — Upstash Redis
- `OPENROUTER_API_KEY` — for Grok AI via OpenRouter
- `AGSI_API_KEY` — Gas Infrastructure Europe API
- `RESEND_API_KEY`, `ALERT_EMAIL` — email alerts
- `CRON_SECRET` — authenticates cron refresh requests
- `DASHBOARD_PASSWORD`, `DASHBOARD_AUTH_SECRET` — login auth

### Cron Worker (in `.dev.vars` / Cloudflare secrets)
- `DASHBOARD_URL` — base URL of the deployed dashboard
- `CRON_SECRET` — must match dashboard's CRON_SECRET
- `TRIGGER_SECRET` — for manual `/trigger` endpoint

## Important Notes

- **Next.js 16**: This uses Next.js 16 with breaking changes from earlier versions. Always check `node_modules/next/dist/docs/` before using Next.js APIs (see `dashboard/AGENTS.md`).
- **Grok response cleaning**: `grok.ts` strips Grok-specific XML citation tags (`<grok:render>`) and bracket citations (`[web:36]`) at the API boundary.
- **Fetcher error handling**: All fetchers are wrapped in `safeFetch` — individual failures don't crash the refresh; they generate email alerts and the indicator retains its previous value.
- **All 15 indicators must surface errors visibly** — no silent/graceful degradation for fetcher failures.
- **Vitest** uses jsdom environment with `@` path alias mapped to the dashboard root.
- **CSS custom properties** define the dark theme in `globals.css` (no light mode). Components use inline `style={{ color: "var(--text-primary)" }}` patterns alongside Tailwind classes.
- **No middleware** — auth check happens at the page/route level.
