# Dashboard (Next.js)

The main web UI and API routes for the Paraguay Decision Dashboard.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Fill in API keys
npm run dev
```

## Environment Variables

Copy `.env.local.example` and fill in your values:

| Variable | Description |
|----------|-------------|
| `DASHBOARD_PASSWORD` | Password for dashboard login |
| `DASHBOARD_AUTH_SECRET` | HMAC signing secret for session cookies |
| `ALERT_EMAIL` | Email address for status change alerts |
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |
| `CRON_SECRET` | Bearer token for cron refresh endpoint |
| `RESEND_API_KEY` | Resend API key for email alerts |
| `OPENROUTER_API_KEY` | OpenRouter API key for Grok AI assessments |
| `AGSI_API_KEY` | Gas Infrastructure Europe (AGSI) API key |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest (single run) |
| `npm run test:watch` | Run Vitest in watch mode |

## Key Directories

```
app/
  page.tsx                    Server component — main dashboard
  layout.tsx                  Dark theme, font loading
  api/cron/refresh/route.ts   Cron refresh endpoint
  api/cron/health/route.ts    Health check endpoint
  api/status/route.ts         JSON API for current state
  components/                 UI components (TrafficLight, IndicatorCard, etc.)
  lib/
    indicators.ts             Indicator definitions and thresholds
    indicator-evaluation.ts   Evaluation strategies (numeric, deadline, sustained, AI)
    traffic-light.ts          Overall status calculation
    kv.ts                     Upstash Redis helpers
    email.ts                  Resend email alerts
    fetchers/                 Data source fetchers (AGSI, ONS, Grok, etc.)
```
