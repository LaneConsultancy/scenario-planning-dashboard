# Paraguay Decision Dashboard

A personal crisis-monitoring tool that tracks 15 geopolitical, energy, agriculture, political, and civil liberties indicators to inform a UK-to-Paraguay relocation decision. Uses a traffic-light system (GREEN/AMBER/RED) based on observable tripwires.

## How It Works

- **15 indicators** across 5 categories, each with defined thresholds
- **Automated data pipeline** fetches from 7 API/scrape sources + Grok AI assessments twice daily
- **Traffic light logic**: 0-1 triggered = GREEN, 2-3 = AMBER, 4+ = RED
- **Email alerts** on status changes or fetch failures
- **Password-protected** dashboard with dark theme UI

## Tech Stack

- **Dashboard**: Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Data store**: Upstash Redis
- **AI assessments**: Grok via OpenRouter (12 qualitative indicators)
- **Scheduling**: Cloudflare Worker (cron) triggers dashboard refresh
- **Email**: Resend
- **Hosting**: Vercel (dashboard) + Cloudflare Workers (cron)

## Repository Structure

```
dashboard/          Next.js app — UI and API routes
cron-worker/        Cloudflare Worker — daily cron trigger
triggers.md         Indicator definitions and thresholds
```

## Setup

### Prerequisites

- Node.js 20+
- API keys for: Upstash Redis, OpenRouter, AGSI (Gas Infrastructure Europe), Resend

### Dashboard

```bash
cd dashboard
npm install
cp .env.local.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

See `dashboard/.env.local.example` for the full list of required environment variables.

### Cron Worker

```bash
cd cron-worker
npm install
cp .dev.vars.example .dev.vars
# Fill in your dashboard URL and secrets
npm run dev
```

## Architecture

```
Cloudflare Worker (cron 08:00 & 20:00 UTC)
    │
    ▼
POST /api/cron/refresh (Bearer token auth)
    │
    ├── Fetch Tier 1: AGSI, OilPrice, ONS, ACLED, UKHSA (parallel)
    ├── Fetch Tier 2: AHDB, Hormuz scraping (parallel)
    └── Fetch Tier 3: Grok AI — 12 qualitative assessments
    │
    ▼
Evaluate thresholds → Store to Redis → Email if status changed
    │
    ▼
Dashboard (server component) reads from Redis and renders
```

## Data Sources

| Source | Indicators |
|--------|-----------|
| AGSI API | EU gas storage fill % |
| TTF gas price | Wholesale gas price |
| ONS Beta API | UK food CPI inflation |
| ACLED API | Houthi attack count |
| UKHSA Dashboard | Health outbreak cases |
| AHDB | Fertilizer prices |
| Web scraping | Hormuz transit data |
| Grok AI (OpenRouter) | 12 qualitative assessments |

## Commands

### Dashboard

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (single run) |

### Cron Worker

| Command | Description |
|---------|-------------|
| `npm run dev` | Wrangler local dev |
| `npm run deploy` | Deploy to Cloudflare Workers |

## License

[MIT](LICENSE)
