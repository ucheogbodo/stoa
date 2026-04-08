# Stoa

> *A private digital garden for cultivating ideas — with a public agora for serendipitous discovery.*

Stoa is a personal knowledge-management application built with **Next.js 15**, **Prisma**, **Supabase**, and **NextAuth**. It combines a private writing environment (the Garden) with an intentionally non-algorithmic public space (the Agora) where readers encounter ideas purely by chance.

---

## Table of Contents

- [Philosophy](#philosophy)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Routes Reference](#routes-reference)
- [Architecture Notes](#architecture-notes)

---

## Philosophy

Stoa rejects the engagement-maximising logic of a social media platform. There are no likes, no trending lists, no algorithmic feeds. The Agora surface is built around a single mechanic — the **Encounter** — where a reader is shown one random published idea at a time. Discovery is pure chance, not optimised relevance.

---

## Features

### The Garden (Private Workspace)
- **Idea Editor** — Rich-text Tiptap editor with live formatting toolbar, debounced auto-save (1.5s), and keyboard shortcut (`Ctrl+S`).
- **Idea Lifecycle** — Three growth stages per idea: `🌱 Seed → 🌿 Growing → 📖 Published`.
- **Tags** — Create and assign tags to filter and categorise ideas.
- **Idea Linking** — Connect ideas to each other, building a bidirectional knowledge graph.
- **Project Workbenches** — Group ideas into named Projects and attach reference files (PDFs, images, documents) to each project workbench.
- **Knowledge Graph** — Full-screen interactive force-directed graph (`/garden/graph`) visualising every idea as a node and every link as an edge, colour-coded by status. Includes "Ghost Nodes" (Vestiges) for visualising intellectual history and reconsidered thoughts.

### Philosopher Profile
- **Scholarly Identity** — A personal, non-performative profile encompassing an Inscription, Epigraph, Epistemic Stance, and Intellectual Lineage.
- **Inquiry Timeline & Seasons** — Track the growth of your garden through intellectual seasons and list Unresolved Questions.
- **Public Profile View** — Share your intellectual journey securely with the outside world, or keep it perfectly private.
- **Silence Metric** — Honors the virtue of deliberation by displaying a visual metric of time spent cultivating an idea before publishing.

### The Verification System
- **Content Fingerprinting** — Every saved idea generates a SHA-256 hash of its body text as a tamper-proof authorship timestamp.
- **Publish-Gate Check** — When an idea is set to `Published`, the system automatically checks for near-duplicate content in the database and sets `verificationStatus` accordingly: `VERIFIED`, `REVIEW`, or `FLAGGED`.
- **Admin Review Panel** — `/garden/admin/flagged` lists all ideas under review with one-click Verify/Block actions.

### The Agora (Public Space)
- **Public Landing** — A short manifesto page explaining the non-algorithmic philosophy.
- **The Encounter** — `/agora` shows one random published, verified idea at a time. Clicking *"Encounter Another"* fetches the next without a page reload.
- **Browse Archive** — `/agora/browse` lists all published ideas chronologically with no ranking signals whatsoever.
- **Read-Only Idea View** — `/idea/[id]` renders a single published idea cleanly for any reader.
- **Public Discussions** — `/agora/discussions` allows readers to engage in public threads seeded from Unresolved Questions or opened freely.

### Authentication
- Credentials-based login via **NextAuth** (bcrypt-hashed passwords).
- All Garden routes are protected. The Agora is fully public.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (custom design tokens) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma v5 |
| Auth | NextAuth.js v4 (Credentials provider) |
| Editor | Tiptap v2 (ProseMirror) |
| Graph | react-force-graph-2d |
| File Storage | Supabase Storage (via multipart upload) |

---

## Project Structure

```
stoa/
├── app/
│   ├── (public)/           # Public Agora routes (no auth required)
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Public landing page
│   │   ├── agora/
│   │   │   ├── page.tsx    # Encounter view
│   │   │   └── browse/page.tsx
│   │   └── idea/[id]/page.tsx
│   ├── api/
│   │   ├── agora/encounter/route.ts
│   │   ├── graph/route.ts
│   │   ├── ideas/[id]/
│   │   │   ├── route.ts
│   │   │   ├── verify/route.ts
│   │   │   └── verification-status/route.ts
│   │   ├── projects/[id]/
│   │   │   ├── route.ts
│   │   │   ├── files/route.ts
│   │   │   └── ideas/[ideaId]/route.ts
│   │   └── tags/route.ts
│   ├── garden/             # Private Garden routes (auth required)
│   │   ├── layout.tsx      # Garden nav bar
│   │   ├── page.tsx        # Idea dashboard
│   │   ├── ideas/[id]/page.tsx   # Idea editor
│   │   ├── graph/page.tsx        # Knowledge graph
│   │   ├── projects/
│   │   │   ├── page.tsx          # Projects dashboard
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx     # Project workbench
│   │   └── admin/flagged/        # Admin review panel
│   └── login/page.tsx
├── components/
│   ├── Editor.tsx          # Tiptap editor with toolbar
│   ├── FileUpload.tsx      # Drag-and-drop file uploader
│   ├── FilterBar.tsx       # Garden idea filter/sort bar
│   ├── GraphView.tsx       # react-force-graph-2d canvas component
│   ├── IdeaCard.tsx
│   ├── LinkedIdeasPanel.tsx
│   ├── TagInput.tsx
│   └── SessionProvider.tsx
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client singleton
│   └── verification.ts     # SHA-256 hashing + duplicate detection
└── prisma/
    └── schema.prisma       # Database schema
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- A **Supabase** project (free tier works fine)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd stoa
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) below for full details.

### 4. Push the database schema

```bash
npx prisma db push
```

> **Important:** Use the **Connection Pooler** URL from your Supabase dashboard (`Settings → Database → Connection string → Transaction mode`) to avoid IPv6 connectivity issues. Append `?pgbouncer=true` to the URL.

### 5. Seed the admin user

Start the dev server first, then visit:

```
http://localhost:3000/api/seed
```

This creates the admin user using the credentials from your `.env` file.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in at `/login` with your seed credentials.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (use the pooler URL with `?pgbouncer=true`) |
| `NEXTAUTH_SECRET` | Random secret for signing JWTs — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | The URL your app is running at, e.g. `http://localhost:3000` |
| `SEED_ADMIN_EMAIL` | Email for the initial admin account |
| `SEED_ADMIN_PASSWORD` | Password for the initial admin account |
| `SEED_ADMIN_NAME` | Display name for the initial admin account |

Copy `.env.example` to `.env` and populate every value before running.

---

## Database Setup

The schema is managed by Prisma. Key models:

| Model | Purpose |
|---|---|
| `User` | Authenticated users |
| `Idea` | Core content unit with status lifecycle and verification state |
| `Tag` / `IdeaTag` | Tagging system (many-to-many) |
| `IdeaLink` | Self-referential idea connections for the knowledge graph |
| `Project` / `IdeaProject` | Project workbenches and idea membership |
| `ProjectFile` | Reference files attached to project workbenches |
| `VerificationEvent` | Audit trail for all originality checks |
| `Vestige` | Private record of deliberately reconsidered ideas (Ghost Nodes) |
| `Discussion` / `DiscussionPost` | Public philosophical threads and replies |

After any schema change, run:

```bash
npx prisma db push
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed the database via ts-node (use the `/api/seed` route as an alternative) |

---

## Routes Reference

### Private (requires authentication)

| Route | Description |
|---|---|
| `/garden` | Idea dashboard — filter, sort, and browse all ideas |
| `/garden/ideas/new` | Create a new idea |
| `/garden/ideas/[id]` | Edit an existing idea |
| `/garden/graph` | Interactive knowledge graph (includes Vestiges) |
| `/garden/projects` | Project dashboard |
| `/garden/projects/new` | Create a new project |
| `/garden/projects/[id]` | Project workbench (linked ideas + files) |
| `/garden/admin/flagged` | Admin review panel for flagged ideas |
| `/garden/settings` | Philosopher profile and account settings |
| `/garden/vestibule` | Review and manage reconsidered ideas (Vestiges) |

### Public (no authentication required)

| Route | Description |
|---|---|
| `/` | Public landing page |
| `/agora` | The Encounter — one random published idea |
| `/agora/browse` | Chronological archive of all published ideas |
| `/agora/discussions` | Public discussion threads |
| `/idea/[id]` | Read-only view of a single published idea |
| `/profile/[id]` | Public view of a Philosopher's profile |
| `/login` | Login page |
| `/api/seed` | One-time admin user seed endpoint |

---

## Architecture Notes

- **App Router** — All routes use the Next.js 15 App Router. Server Components are used by default; Client Components are opted-in with `"use client"` only where interactivity is required.
- **Prisma singleton** — `lib/prisma.ts` uses a module-level singleton to avoid exhausting the Supabase connection pool in development hot-reload cycles.
- **Authentication flow** — NextAuth Credentials provider validates email + bcrypt hash. Session exposes `user.id` via a custom `session` callback in `lib/auth.ts`.
- **Verification** — `lib/verification.ts` extracts plain text from Tiptap's ProseMirror JSON and SHA-256 hashes it. Duplicate detection currently uses exact hash matching — fuzzy matching can be added without schema changes.
- **Knowledge Graph** — `react-force-graph-2d` is dynamically imported (`next/dynamic` with `ssr: false`) to avoid canvas API conflicts with Next.js's server-side rendering.
- **Agora Encounter randomness** — The `/api/agora/encounter` route uses a random integer offset (`Math.floor(Math.random() * count)`) to return a uniformly random published idea with no weighting, ranking, or session context.
