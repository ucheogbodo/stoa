# Stoa

> A garden for thinking, not a feed for content.

Stoa is a digital garden for cultivating authentic, synthesized ideas: plant raw
thoughts, connect them, and publish only what has ripened. This is the v2 rebuild;
see [docs/REBUILD_PLAN.md](docs/REBUILD_PLAN.md) for the vision, data model and roadmap.

**Status:** Phase 0 (foundation). The app is a landing page plus `/api/health`.

## Stack

Next.js 16 (App Router, Cache Components, React Compiler) · React 19 · TypeScript strict ·
Tailwind CSS 4 · Drizzle ORM + postgres.js · Postgres (Supabase) · Zod + `@t3-oss/env-nextjs` ·
Vitest · Biome · pnpm · GitHub Actions · Vercel.

All dependency versions are pinned exactly. Upgrade deliberately, one major at a time.

## Getting started

Requires Node 24+ and pnpm (`npm i -g pnpm`; the version is pinned in `package.json`).

```bash
pnpm install
cp .env.example .env.local   # then fill in DATABASE_URL
pnpm dev                     # http://localhost:3000
curl localhost:3000/api/health   # → {"status":"ok","db":"ok",...}
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm check` | lint + typecheck + test (run before pushing) |
| `pnpm lint` / `format` | Biome check / auto-fix |
| `pnpm typecheck` | Generate route types, then `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Drizzle migrations and studio |

## Environment

Validated by [lib/env.ts](lib/env.ts), which `next.config.ts` imports, so a missing variable
fails the build. See [.env.example](.env.example).

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Runtime connection. On Vercel use Supabase's **transaction pooler** (port 6543). |
| `DATABASE_URL_DIRECT` | Optional. Direct or session connection for migrations. |

## Deploying (Vercel)

1. Import the GitHub repo in Vercel. Framework: Next.js. Root directory: the repo root (`./`).
2. Add `DATABASE_URL` for Production and Preview.
3. Push to `main`, then check `https://<your-app>.vercel.app/api/health`.

## Rules

Every commit on `main` deploys · pinned versions · no debug artefacts in git (use `/scratch`) ·
no local disk at runtime · Zod on every input · migrations, never `db push` · tests cover the core loop.
