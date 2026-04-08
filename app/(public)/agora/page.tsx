// app/(public)/agora/page.tsx
// The Agora Encounter — one random published idea, refreshed on demand.
"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

interface EncounteredIdea {
  id: string;
  title: string;
  body: unknown;
  createdAt: string;
  publishedAt: string | null;
  updatedAt: string;
  user: { id: string; name: string | null };
  tags: { tag: { name: string; slug: string } }[];
}

function renderBody(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const doc = body as { content?: unknown[] };
  if (!doc.content) return "";

  function recurse(nodes: unknown[]): string {
    return nodes
      .map((node) => {
        const n = node as { text?: string; content?: unknown[] };
        if (n.text) return n.text;
        if (n.content) return recurse(n.content);
        return "";
      })
      .join(" ");
  }
  return recurse(doc.content);
}

export default function AgoraEncounterPage() {
  const [idea, setIdea] = useState<EncounteredIdea | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [encounterCount, setEncounterCount] = useState(0);
  const [gated, setGated] = useState(false);

  // Read encounter count from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = parseInt(localStorage.getItem("stoa_encounter_count") ?? "0", 10);
    setEncounterCount(isNaN(stored) ? 0 : stored);
  }, []);

  const fetchIdea = useCallback(async () => {
    // Check gate: if they've already encountered 3 ideas, show the gate instead
    const next = encounterCount + 1;
    if (idea !== null && encounterCount >= 3) {
      setGated(true);
      return;
    }

    setLoading(true);
    setError(null);
    setRevealed(false);
    setGated(false);

    const res = await fetch("/api/agora/encounter");
    if (!res.ok) {
      setError("No published ideas found yet. Come back soon.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setIdea(data);
    setLoading(false);
    setTimeout(() => setRevealed(true), 50);

    // Persist updated count
    localStorage.setItem("stoa_encounter_count", String(next));
    setEncounterCount(next);
  }, [idea, encounterCount]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <p className="text-ink-muted text-sm uppercase tracking-widest mb-2">
          The Encounter
        </p>
        <h1 className="font-serif text-4xl text-ink">
          {idea ? idea.title : "What will you find today?"}
        </h1>
      </div>

      {!idea && !loading && !error && (
        <div className="text-center">
          <button onClick={fetchIdea} className="btn-primary text-lg px-8 py-3">
            Encounter an Idea &rarr;
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center text-ink-muted py-12">Drawing from the garden…</div>
      )}

      {error && (
        <div className="text-center">
          <p className="text-rust mb-4">{error}</p>
          <Link href="/garden" className="text-sage hover:underline text-sm">
            Plant the first seed &rarr;
          </Link>
        </div>
      )}

      {idea && !loading && (
        <div
          className={`transition-all duration-500 ${
            revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Tags */}
          {idea.tags.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {idea.tags.map(({ tag }) => (
                <span
                  key={tag.slug}
                  className="text-xs px-3 py-1 bg-parchment-dark text-ink-muted rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="prose prose-sage max-w-none text-ink leading-relaxed mb-10">
            {idea.body ? (
              <p className="whitespace-pre-wrap">{renderBody(idea.body)}</p>
            ) : (
              <p className="text-ink-muted italic">This idea has no body yet.</p>
            )}
          </div>

          {/* Attribution & Silence Metric */}
          <div className="flex flex-col gap-1 text-sm text-ink-muted border-t border-parchment-dark pt-4 mb-8">
            <p>
              By{" "}
              <Link href={`/profile/${idea.user.id}`} className="hover:text-ink transition-colors underline decoration-parchment-border underline-offset-4">
                {idea.user.name ?? "Anonymous"}
              </Link>
              {" "}&middot;{" "}
              {new Date(idea.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {idea.publishedAt && (
              <p className="italic text-xs">
                Cultivated for {Math.max(1, Math.floor(
                  Math.abs(new Date(idea.publishedAt).getTime() - new Date(idea.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                ))} day{Math.max(1, Math.floor(
                  Math.abs(new Date(idea.publishedAt).getTime() - new Date(idea.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                )) !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
            {gated ? (
              // Encounter Gate — soft prompt after 3 encounters
              <div className="w-full border border-parchment-border rounded-lg p-6 text-center space-y-3 bg-parchment/50">
                <p className="font-serif text-lg text-ink">
                  You&rsquo;ve wandered the Agora a while.
                </p>
                <p className="text-sm text-ink-muted">
                  Sign in to encounter more ideas, or browse the full archive.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                  <Link href="/login" className="btn-primary text-center">
                    Sign in
                  </Link>
                  <Link
                    href="/agora/browse"
                    className="text-sm text-ink-muted hover:text-sage transition-colors py-2"
                  >
                    Browse the archive →
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={fetchIdea}
                  className="btn-primary w-full sm:w-auto justify-center"
                >
                  Encounter Another &rarr;
                </button>
                <Link
                  href={`/idea/${idea.id}`}
                  className="text-sm text-ink-muted hover:text-sage transition-colors"
                >
                  Read full idea
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
