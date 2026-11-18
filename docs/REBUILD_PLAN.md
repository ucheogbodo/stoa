# Stoa — Rebuild Master Plan

*Drafted 2026-11-18. Based on a review of the existing codebase (`ucheogbodo/stoa`, 13 commits, ~97 tracked files).*

---

## 1. What went wrong (post-mortem of v1)

Vercel itself wasn't the problem. The deploy failures came from issues that piled up in the codebase and on the machine. Each one below is backed by evidence in the repo:

| # | Problem | Evidence | Effect |
|---|---|---|---|
| 1 | **Incompatible dependency versions** | `package.json`: `next ^16.3.8` with `react ^18` (Next 16 needs React 19); `next-auth ^4` (built for Next 13/14); `eslint ^8` with `eslint-config-next ^16` (needs ESLint 9 flat config); the README says Next 14 / Tiptap v2, but Tiptap 3 is installed | Peer-dependency conflicts and builds that behave differently on each install |
| 2 | **Prisma version drift** | `output.txt`: `npx prisma generate` ran **Prisma CLI 7.5.0**, which rejects `url` in `schema.prisma` (P1012). `package.json` pins 5.13.0 | Client generation failed. Locally, `npx` fetched a different Prisma than the pinned one |
| 3 | **No `prisma generate` at install time** | No `postinstall` script | On Vercel the cached Prisma Client goes stale and the build fails |
| 4 | **Uploads written to local disk** | `api/projects/[id]/files/route.ts` uses `fs.writeFileSync(process.cwd()/uploads)` | Vercel's filesystem is read-only and temporary, so uploads fail or disappear |
| 5 | **Project inside OneDrive, nested two levels deep** | `Desktop/stoa/stoa`, synced by OneDrive | OneDrive locks and syncs `node_modules`/`.next`, which corrupts installs (EPERM errors). The extra folder level makes Vercel's "Root Directory" easy to get wrong |
| 6 | **Your whole home folder is a git repository** | `git status` from `C:\Users\umogb` lists `.ssh/`, `AppData/`, `NTUSER.DAT`… as untracked | Tools that walk up the folder tree to find a repo root can land in the wrong one. One `git add .` in the wrong place could also stage SSH keys |
| 7 | **Workarounds committed instead of fixes** | `dump.js`, `gen.js`, `*.log` (UTF-16 from PowerShell redirects), five `force-dynamic` commits in a row | Each layer of patching hid the underlying cause |
| 8 | **Security gaps** | `GET /api/seed` falls back to the password `changeme123`; admin access is an email string compare; reactions are anonymous with no rate limit; dead invite-token routes | Not safe to put on the public internet as it stands |
| 9 | **Deprecated conventions** | `middleware.ts` (renamed `proxy.ts` in Next 16); `getServerSession` from v4 | Deprecation warnings now, breakage on the next upgrade |

**Takeaway:** deploy on the first day and keep every commit deployable. If v1 had been deployed after its first commit, each of these problems would have shown up when it was cheap to fix.

---

## 2. Product vision (sharpened)

> **Stoa is a garden for thinking, not a feed for content.** You plant raw thoughts, connect them, and let them grow into ideas that are clearly your own. You publish only what has ripened.

v1 had strong ideas (the Encounter, Vestiges, the Silence Metric, the Philosopher Profile) but spread them across too many half-finished features. The rebuild centres on one **core loop** and makes it excellent:

```
  Capture  ──►  Connect  ──►  Synthesize  ──►  Publish
  (seed)       ([[links]],     (growing,        (Agora,
               backlinks,       revisions,       Encounter)
               graph)           vestiges)
```

### Three features that set Stoa apart

1. **Typed connections.** A link carries a relation (`supports`, `contradicts`, `extends`, `questions`) plus an optional note on why. The graph becomes a map of your reasoning rather than a tangle of links. No mainstream garden tool does this well.
2. **Proof of Thought (replaces "verification").** Hashing for exact duplicates is weak, and it catches nothing interesting. Keep a **revision history** for every idea instead. A published idea can show its timeline: planted on a date, revised N times over M days, connected to K other ideas. The Silence Metric comes from the same data. With so much AI-written text around, a visible record of how an idea developed is the strongest evidence of authorship available.
3. **Vestiges as ghost nodes that keep their edges.** v1 copied a reconsidered idea's title into a separate table, which dropped its links. In v2, "reconsidering" is a status change. The node stays in the graph, faded, with its connections and your reflection attached. Intellectual history stays connected.

### Kept from v1, done properly
The Encounter (one random published idea at a time, no ranking), the chronological archive, the Philosopher Profile, and stages (Seed → Growing → Ripe/Published).

### Deferred until the core is solid
Public discussions, reactions, and file workbenches. These are community features that need moderation and rate limiting. They come back in Phase 6, if at all.

---

## 3. Technology choices

Principles: **boring, pinned, serverless-native, one source of truth.**

| Layer | Choice | Why (vs. v1) |
|---|---|---|
| Framework | **Next.js 16** (App Router) + **React 19**, exact versions pinned | v1 combined incompatible majors |
| Language | TypeScript `strict`, plus **Zod** at every input boundary | Catches the TS errors that ended up in `tsc.log` |
| Database | **Postgres** (Supabase or Neon), pooled URL for the app, direct URL for migrations | Same database as v1, configured correctly |
| ORM | **Drizzle ORM** + `drizzle-kit` migrations | No generate step and no engine binaries, so the whole Prisma 5→7 problem goes away. SQL-first, and it fits serverless well |
| Auth | **Better Auth** (email/password + magic link, optional GitHub) | NextAuth v4 is legacy; Better Auth is typed and stores users in your own DB |
| File storage | **Supabase Storage** or **Vercel Blob** | Replaces local-disk writes |
| Editor | **Tiptap 3** with a custom `[[wikilink]]` extension and `@`-mentions | Links are created inline while you write, not in a side panel |
| Search | Postgres full-text search (`tsvector`), later **pgvector** | No extra services needed |
| Graph | `react-force-graph-2d` at first; switch to **Sigma.js** (WebGL) above ~2k nodes | Keeps rendering fast as the garden grows |
| Styling | **Tailwind CSS v4** + a small token-based design system | |
| Testing | **Vitest** (unit), **Playwright** (key end-to-end flows) | v1 had no tests |
| Tooling | **pnpm**, Biome or ESLint 9 flat config, `.nvmrc` for Node 22 LTS | Reproducible installs |
| CI/CD | GitHub Actions (typecheck → lint → test → build) + Vercel preview deploy on every PR | Broken builds never reach `main` |

---

## 4. Data model (v2)

```
user ─┬─< idea >─┬─< revision            (snapshot of body on meaningful saves)
      │          ├─< idea_tag >── tag
      │          └─< link >── idea       (from, to, relation, note)
      ├─< collection >─< collection_idea  (replaces "projects")
      ├─< attachment                      (object-storage key, not a disk path)
      └── profile                         (inscription, epigraph, lineage, stance, seasons, questions)
```

**`idea`**: `id, user_id, slug, title, body_json, body_text (for search), stage [seed|growing|ripe|reconsidered], visibility [private|public], planted_at, published_at, reconsidered_at, reflection, search_vector, updated_at`

**`link`**: `from_id, to_id, relation [relates|supports|contradicts|extends|questions], note, created_at`. Links come from the editor's wikilinks, so the document is the source of truth and a sync step updates the table on save.

**`revision`**: `idea_id, body_json, word_count, created_at`. Written at most once every 10 minutes per idea, plus at every stage change. This drives Proof of Thought and the Silence Metric.

Users get a `role` column for admin access. Admin is no longer decided by matching an email string.

---

## 5. Phased roadmap

Each phase ends **deployed to production** with its exit criteria met. Phases are sized for evenings and weekends.

### Phase 0 — Clean foundation *(1–2 days)*
- [ ] Move development **out of OneDrive** to something like `C:\dev\stoa`
- [ ] Deal with the stray `C:\Users\umogb\.git` (check what it holds before removing anything)
- [ ] Tag the old repo `v1-legacy` and keep it for reference. Start v2 as a fresh repo (or an orphan branch)
- [ ] Scaffold Next 16 + React 19 + TS strict + Tailwind 4 with pnpm. Pin exact versions and add `.nvmrc`
- [ ] Drizzle + Postgres connection, first migration, and a `/api/health` route that queries the DB
- [ ] Connect the repo to Vercel and set env vars per environment
- [ ] GitHub Actions CI
- **Exit:** the production URL returns `{"db":"ok"}`. Every later commit deploys on its own.

### Phase 1 — The private garden *(1–2 weeks)*
- [ ] Better Auth: sign-up, sign-in, sign-out, protected `/garden` via `proxy.ts`
- [ ] Idea CRUD with server actions and Zod validation
- [ ] Tiptap editor: autosave (debounced, with a "saved" indicator), `Ctrl+S`, offline-tolerant retry
- [ ] Stages and tags. Garden dashboard with filtering and sorting
- [ ] Quick-capture: a global `Ctrl+K` "plant a seed" box
- **Exit:** you can write and organise real notes in production every day.

### Phase 2 — Connections *(1–2 weeks)*
- [ ] `[[wikilink]]` Tiptap extension with autocomplete. Typing `[[New idea]]` creates a seed
- [ ] Link sync on save; typed relations through a small popover on each link
- [ ] Backlinks panel ("ideas that point here", grouped by relation)
- [ ] Graph view: colour by stage, edge style by relation, click to open, local graph (2 hops) on each idea page
- [ ] Full-text search
- **Exit:** the garden can be navigated as a network, not only as a list.

### Phase 3 — Synthesis and Proof of Thought *(1 week)*
- [ ] Revision snapshots and a timeline / diff viewer per idea
- [ ] Silence Metric (planted → ripened), revision count, connection count
- [ ] Reconsider flow: write a reflection, the idea becomes a ghost node and keeps its edges
- [ ] Collections (the former Projects), with attachments in object storage
- [ ] **Export everything** as Markdown with frontmatter (Obsidian-compatible). Users have to be able to take their garden with them.
- **Exit:** every idea has a visible history.

### Phase 4 — The Agora *(1–2 weeks)*
- [ ] Publish flow: an idea becomes `ripe` + `public` and gets a stable `/@handle/slug` URL
- [ ] Public idea pages with ISR, OG images, and a Proof of Thought badge
- [ ] Public links are shown only when both ideas are public (no private titles leak)
- [ ] The Encounter (uniform random, no ranking) and a chronological archive
- [ ] Philosopher Profile and an RSS feed per gardener
- [ ] Rate limiting (e.g. Upstash) on every public endpoint
- **Exit:** a stranger can find, read, and share your published thinking.

### Phase 5 — Quiet intelligence *(optional, 1–2 weeks)*
AI assists synthesis and never writes for the user, in keeping with the authenticity principle.
- [ ] Embeddings with pgvector, used to suggest **latent connections** ("these two seeds may be related"). The user accepts or dismisses each one.
- [ ] Orphan review: ideas with no links get surfaced
- [ ] Resurfacing: a daily "revisit this seed", spaced over time
- **Exit:** the garden suggests connections you hadn't noticed.

### Phase 6 — Community *(only once the core is in daily use)*
Discussions seeded from Unresolved Questions, responses as linked ideas ("reply with an idea"), moderation tools, reporting.

---

## 6. Engineering rules for v2

1. **Every commit on `main` deploys.** Keep CI green.
2. **Pin exact versions.** Upgrade on purpose, one major at a time, on a branch.
3. **No debug artefacts in git.** Logs and scratch scripts belong in a gitignored `scratch/` folder.
4. **No local disk at runtime.** All files go to object storage.
5. **Validate every input with Zod.** Check authorisation on every server action.
6. **Use migrations, not `db push`,** against any shared database.
7. **Secrets live only in Vercel/env**, with startup validation of env vars (e.g. `@t3-oss/env-nextjs`) so a missing var fails the build instead of production.
8. **Tests cover the core loop:** sign up → plant → link → publish → encounter.

---

## 7. Decisions still open

| Decision | Recommendation |
|---|---|
| **Single-user or multi-user?** | Make the schema multi-user from day one and launch sign-ups invite-only. This keeps the Agora possible without moderation work at launch. |
| **Supabase or Neon?** | Supabase if you want DB + Storage + (optionally) Auth from one vendor; Neon if you want the database only, with branch-per-preview. |
| **Migrate v1 data?** | If the old Supabase DB holds real writing, write a one-off Drizzle script that maps `Idea`/`IdeaLink`/`Tag` to the v2 tables and turns `Vestige` rows into `reconsidered` ideas. |
| **Name of the published stage** | "Ripe" fits the garden metaphor and separates *mature* from *public*. You can hold a ripe idea privately. |

---

## 8. What to carry over from v1

- The writing in the README's **Philosophy** section, and the Agora manifesto
- Concepts: Encounter, Vestiges, Silence Metric, Philosopher Profile fields
- `lib/verification.ts` → `extractText()` (reuse it for `body_text`)
- `components/GraphView.tsx` as a reference for the graph styling

Everything else gets rewritten.
