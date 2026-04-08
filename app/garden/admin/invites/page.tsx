// app/garden/admin/invites/page.tsx
// Admin page to generate and manage single-use invite tokens.
// Only the admin account (SEED_ADMIN_EMAIL) can access this.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface InviteToken {
  id: string;
  token: string;
  createdAt: string;
  usedAt: string | null;
  usedBy: { name: string | null; email: string } | null;
}

function buildInviteUrl(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/signup?token=${token}`;
}

export default function AdminInvitesPage() {
  useSession();
  const router = useRouter();

  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    const res = await fetch("/api/admin/invite-tokens");
    if (res.status === 403) { router.push("/garden"); return; }
    const data = await res.json();
    setTokens(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/admin/invite-tokens", { method: "POST" });
    if (res.ok) {
      const invite = await res.json();
      setTokens((prev) => [invite, ...prev]);
    }
    setGenerating(false);
  }

  async function copyLink(token: string) {
    const url = buildInviteUrl(token);
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2500);
  }

  const pending = tokens.filter((t) => !t.usedAt);
  const used = tokens.filter((t) => t.usedAt);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-ink">Invite Tokens</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Each token is a single-use link. Share it with someone you&apos;d like to invite into the Garden.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary"
        >
          {generating ? "Generating…" : "+ Generate Invite"}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-parchment-dark rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* Pending tokens */}
          {pending.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
                Available — {pending.length} unused
              </h2>
              <ul className="divide-y divide-parchment-dark">
                {pending.map((t) => (
                  <li key={t.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-ink-muted truncate">
                        {buildInviteUrl(t.token)}
                      </p>
                      <p className="text-xs text-ink-muted/60 mt-0.5">
                        Created{" "}
                        {new Date(t.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => copyLink(t.token)}
                      className="btn-ghost text-xs shrink-0"
                    >
                      {copied === t.token ? "✓ Copied" : "Copy Link"}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pending.length === 0 && (
            <p className="text-ink-muted text-sm mb-10">
              No unused tokens. Generate one above.
            </p>
          )}

          {/* Used tokens */}
          {used.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
                Claimed — {used.length}
              </h2>
              <ul className="divide-y divide-parchment-dark">
                {used.map((t) => (
                  <li key={t.id} className="py-4 flex items-center justify-between gap-4 opacity-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-ink-muted truncate">
                        {t.token}
                      </p>
                      <p className="text-xs text-ink-muted/60 mt-0.5">
                        Used by {t.usedBy?.name ?? t.usedBy?.email ?? "unknown"}{" · "}
                        {t.usedAt && new Date(t.usedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-xs text-ink-muted shrink-0">claimed</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
