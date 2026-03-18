# Quickstart: Project Scaffold

**Branch**: `001-project-scaffold` | **Date**: 2026-03-18

## Prerequisites

- Node.js 24.14.0 (use `.nvmrc` or `.node-version` with your version manager)
- npm (bundled with Node.js 24)
- Docker (for container builds)

## Setup

```bash
# Clone and install
git clone <repo-url>
cd serial-killer-game
npm install

# Copy environment template and fill in values
cp .env.example .env.local
# Edit .env.local with your Supabase and Sentry credentials
```

## Development

```bash
# Start all packages in dev mode
npm run dev

# Start only the web app
npx turbo run dev --filter=web
```

The application starts at `http://localhost:3000`.

## Common Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start all packages in development mode |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run test` | Run tests across all packages |
| `npm run test:watch` | Run tests in watch mode |
| `npm run type-check` | TypeScript type checking |

### Per-Package Commands

```bash
# Run tests for a specific package
npx turbo run test --filter=@repo/shared
npx turbo run test --filter=web

# Build a specific package and its dependencies
npx turbo run build --filter=web
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

| Variable | Required | Where to get it |
|----------|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Dashboard > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Dashboard > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Supabase Dashboard > Project Settings > API |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | Sentry > Project Settings > Client Keys |
| `SENTRY_AUTH_TOKEN` | Yes (CI) | Sentry > Settings > Auth Tokens |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog > Project > Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog > Project > Settings |
| `AZURE_BLOB_STORAGE_URL` | No | Azure Portal > Storage Account |

## Docker

```bash
# Build the container
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/123 \
  -t serial-killer-game .

# Run the container
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  serial-killer-game
```

## Project Structure

```
apps/web/          Next.js 16 application (UI, routing, API)
packages/
  game-engine/     Phaser 3 game code (MUST NOT import React)
  shared/          Types, schemas, utilities (used by web + game-engine)
  ui-theme/        Design tokens, brand configuration
supabase/          Database migrations and Edge Functions
```

## Testing

```bash
# Unit + component tests
npm run test

# End-to-end tests (requires dev server running)
npx playwright test --project=chromium

# Install Playwright browsers (first time only)
npx playwright install
```
