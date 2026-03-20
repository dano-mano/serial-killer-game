# Serial Killer Game

A browser-based multiplayer video game built with Next.js, Phaser 3, and Supabase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24.14.0 LTS |
| Framework | Next.js 16, React 19, TypeScript 5.9 |
| Game Engine | Phaser 3 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| State | Zustand |
| Hosting | Azure App Service (Docker) |
| CI/CD | GitHub Actions |
| Monorepo | Turborepo + npm workspaces |

## Prerequisites

- Node.js 24.14.0 (use `.nvmrc` or `.node-version` with your version manager)
- npm (bundled with Node.js 24)
- Docker (for container builds)

## Setup

```bash
git clone <repo-url>
cd serial-killer-game
npm install

cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase and Sentry credentials
```

## Development

```bash
# Start all packages in dev mode
npm run dev

# Start only the web app
npx turbo run dev --filter=web
```

The application starts at `http://localhost:3000`.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all packages in development mode |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run test` | Run tests across all packages |
| `npm run type-check` | TypeScript type checking |

### Per-Package

```bash
npx turbo run test --filter=@repo/shared
npx turbo run test --filter=web
npx turbo run build --filter=web
```

## Project Structure

```
apps/web/              Next.js 16 application (UI, routing, server actions)
packages/
  game-engine/         Phaser 3 game code (isolated from React)
  shared/              Types, schemas, error handling (used by web + game-engine)
  ui-theme/            Design tokens, brand configuration
supabase/
  migrations/          SQL migrations
  functions/           Edge Functions
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Dashboard > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Dashboard > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Supabase Dashboard > Project Settings > API |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | Sentry > Project Settings > Client Keys |
| `SENTRY_AUTH_TOKEN` | Yes (CI) | Sentry > Settings > Auth Tokens |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog > Project > Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog > Project > Settings |
| `AZURE_BLOB_STORAGE_URL` | No | Azure Portal > Storage Account |

## Testing

```bash
# Unit + component tests
npm run test

# E2E tests (requires dev server running)
npx playwright test --project=chromium

# Install Playwright browsers (first time only)
npx playwright install
```

## Docker

```bash
# Build
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/123 \
  -t serial-killer-game .

# Run
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  serial-killer-game
```

## CI/CD

GitHub Actions workflows are configured for manual dispatch (`workflow_dispatch`):

- **CI** (`.github/workflows/ci.yml`): Lint, test, build, audit
- **Deploy** (`.github/workflows/deploy.yml`): CI + Docker build + push to ghcr.io + Azure App Service
