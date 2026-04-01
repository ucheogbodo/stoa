// app/(public)/profile/[userId]/page.tsx
// Public philosopher's profile page — readable at /profile/[userId].
// Server component: queries the DB directly via Prisma for efficiency.
// Respects the profilePublic flag.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// ── Types matching Prisma JSON fields ─────────────────────────────────────────
interface LineageEntry { name: string; url?: string }
interface Season { period: string; description: string }
interface EpistemicStance {
  reasonFrom?: string;
  holdBeliefs?: string;
  uncertainAbout?: string;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function asStance(v: unknown): EpistemicStance {
  if (v && typeof v === "object") return v as EpistemicStance;
  return {};
}

// ── Garden Gate sentence ───────────────────────────────────────────────────────
function GardenGateSentence({ userId, seed, growing, published }: {
  userId: string; seed: number; growing: number; published: number;
}) {
  if (seed === 0 && growing === 0 && published === 0) return null;

  const parts: React.ReactNode[] = [];
  if (seed > 0) parts.push(
    <Link key="seed" href={`/agora/browse?status=SEED&author=${userId}`} className="hover:text-ink transition-colors">
      {seed} seed{seed !== 1 ? "s" : ""} in the ground
    </Link>
  );
  if (growing > 0) parts.push(
    <Link key="growing" href={`/agora/browse?status=GROWING&author=${userId}`} className="hover:text-ink transition-colors">
      {growing} idea{growing !== 1 ? "s" : ""} in growth
    </Link>
  );
  if (published > 0) parts.push(
    <Link key="published" href={`/agora/browse?author=${userId}`} className="hover:text-ink transition-colors">
      {published} in bloom
    </Link>
  );

  return (
    <p className="text-sm text-ink-muted leading-relaxed">
      {parts.map((part, i) => (
        <span key={`part-${i}`}>
          {i > 0 && ", "}
          {part}
        </span>
      ))}
      {"."}
    </p>
  );
}

// ── Vertical timeline ─────────────────────────────────────────────────────────
function SeasonTimeline({ seasons }: { seasons: Season[] }) {
  if (seasons.length === 0) return null;
  return (
    <ul className="relative border-l border-parchment-border ml-2 space-y-8 py-2">
      {seasons.map((s, i) => (
        <li key={i} className="pl-6 relative">
          <span className="absolute -left-px top-1 w-px h-full bg-parchment-border" />
          <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">{s.period}</p>
          <p className="text-sm text-ink leading-relaxed">{s.description}</p>
        </li>
      ))}
    </ul>
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, profilePublic: true },
  });
  if (!user || !user.profilePublic) return { title: "Profile — Stoa" };
  return { title: `${user.name ?? "Thinker"} — Stoa` };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      profilePublic: true,
      inscription: true,
      epigraph: true,
      intellectualLineage: true,
      epistemicStance: true,
      intellectualSeasons: true,
      unresolvedQuestions: true,
    },
  });

  if (!user) notFound();

  if (!user.profilePublic) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="font-serif text-xl text-ink mb-3">This profile is private.</p>
        <p className="text-sm text-ink-muted">The thinker has chosen to keep their garden gate closed.</p>
        <Link href="/agora" className="text-sage hover:underline text-sm mt-6 inline-block">
          Return to the Agora →
        </Link>
      </div>
    );
  }

  // Garden Gate counts
  const allIdeas = await prisma.idea.findMany({
    where: { userId: params.userId },
    select: { status: true },
  });
  const seed = allIdeas.filter((i) => i.status === "SEED").length;
  const growing = allIdeas.filter((i) => i.status === "GROWING").length;
  const published = allIdeas.filter((i) => i.status === "PUBLISHED").length;

  const lineage = asArray<LineageEntry>(user.intellectualLineage);
  const seasons = asArray<Season>(user.intellectualSeasons);
  const questions = asArray<string>(user.unresolvedQuestions);
  const stance = asStance(user.epistemicStance);
  const hasStance = stance.reasonFrom || stance.holdBeliefs || stance.uncertainAbout;

  return (
    <article className="max-w-2xl mx-auto px-6 py-20">

      {/* ── Name + Epigraph ─────────────────────────────────────────── */}
      <header className="mb-16">
        <p className="text-ink font-sans text-base mb-1">{user.name ?? "Anonymous"}</p>
        {user.epigraph && (
          <p className="text-ink-muted italic text-sm font-serif">{user.epigraph}</p>
        )}
      </header>

      {/* ── Philosopher's Inscription ───────────────────────────────── */}
      {user.inscription && (
        <section className="mb-20">
          <p className="font-serif text-2xl sm:text-3xl text-ink leading-relaxed">
            {user.inscription}
          </p>
        </section>
      )}

      {/* ── Epistemic Stance ────────────────────────────────────────── */}
      {hasStance && (
        <section className="mb-16">
          <h2 className="text-xs font-sans font-medium text-ink-muted uppercase tracking-widest mb-6">
            Epistemic Stance
          </h2>
          <div className="border-l-2 border-parchment-border pl-6 space-y-4">
            {stance.reasonFrom && (
              <p className="text-sm text-ink leading-relaxed">
                <span className="text-ink-muted">I tend to reason from </span>
                {stance.reasonFrom}
              </p>
            )}
            {stance.holdBeliefs && (
              <p className="text-sm text-ink leading-relaxed">
                <span className="text-ink-muted">I hold my beliefs </span>
                {stance.holdBeliefs}
              </p>
            )}
            {stance.uncertainAbout && (
              <p className="text-sm text-ink leading-relaxed">
                <span className="text-ink-muted">I am currently most uncertain about </span>
                {stance.uncertainAbout}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── The Garden Gate ─────────────────────────────────────────── */}
      {(seed > 0 || growing > 0 || published > 0) && (
        <section className="mb-16">
          <h2 className="text-xs font-sans font-medium text-ink-muted uppercase tracking-widest mb-4">
            The Garden
          </h2>
          <GardenGateSentence userId={params.userId} seed={seed} growing={growing} published={published} />
        </section>
      )}

      {/* ── Intellectual Lineage ────────────────────────────────────── */}
      {lineage.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xs font-sans font-medium text-ink-muted uppercase tracking-widest mb-6">
            Intellectual Lineage
          </h2>
          <ul className="space-y-2">
            {lineage.map((entry, i) => (
              <li key={i} className="text-sm text-ink leading-relaxed">
                {entry.url ? (
                  <a href={entry.url} target="_blank" rel="noopener noreferrer"
                    className="hover:text-sage transition-colors underline underline-offset-2 decoration-parchment-border">
                    {entry.name}
                  </a>
                ) : (
                  <span>{entry.name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Intellectual Seasons ────────────────────────────────────── */}
      {seasons.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xs font-sans font-medium text-ink-muted uppercase tracking-widest mb-6">
            Intellectual Seasons
          </h2>
          <SeasonTimeline seasons={seasons} />
        </section>
      )}

      {/* ── The Unresolved ──────────────────────────────────────────── */}
      {questions.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xs font-sans font-medium text-ink-muted uppercase tracking-widest mb-6">
            The Unresolved
          </h2>
          <ol className="space-y-3 list-none">
            {questions.map((q, i) => (
              <li key={i}>
                <Link
                  href={`/garden/ideas/new?prompt=${encodeURIComponent(q)}`}
                  className="text-sm text-ink hover:text-sage transition-colors leading-relaxed group"
                >
                  <span className="text-ink-muted mr-3 font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                  {q}
                  <span className="text-ink-muted text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→ think alongside</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="mt-20 pt-8 border-t border-parchment-border">
        <Link href="/agora" className="text-xs text-ink-muted hover:text-ink transition-colors">
          ← Back to the Agora
        </Link>
      </footer>

    </article>
  );
}
