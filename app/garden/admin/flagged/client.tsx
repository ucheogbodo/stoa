// app/garden/admin/flagged/client.tsx
// Interactive admin actions for the flagged ideas panel.
"use client";

import { useState } from "react";
import Link from "next/link";

type VerificationStatus = "UNVERIFIED" | "REVIEW" | "VERIFIED" | "FLAGGED";

interface FlaggedIdea {
  id: string;
  title: string;
  verificationStatus: VerificationStatus;
  user: { name: string | null; email: string };
  verificationEvents: { reason: string | null; createdAt: Date }[];
}

export default function AdminFlaggedClient({ ideas }: { ideas: FlaggedIdea[] }) {
  const [localIdeas, setLocalIdeas] = useState(ideas);
  const [actionState, setActionState] = useState<Record<string, "loading" | "done">>({});

  async function setStatus(ideaId: string, status: VerificationStatus) {
    setActionState((s) => ({ ...s, [ideaId]: "loading" }));

    await fetch(`/api/ideas/${ideaId}/verification-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus: status }),
    });

    setLocalIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    setActionState((s) => ({ ...s, [ideaId]: "done" }));
  }

  if (localIdeas.length === 0) {
    return <p className="text-ink-muted py-10 text-center">All cleared. The garden is clean.</p>;
  }

  return (
    <ul className="space-y-4">
      {localIdeas.map((idea) => {
        const latestEvent = idea.verificationEvents[0];
        const busy = actionState[idea.id] === "loading";
        return (
          <li key={idea.id} className="border border-parchment-dark rounded-xl p-5 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/garden/ideas/${idea.id}`}
                  className="font-serif text-lg text-ink hover:text-sage transition-colors block truncate"
                >
                  {idea.title}
                </Link>
                <p className="text-xs text-ink-muted mt-1">
                  By {idea.user.name ?? idea.user.email}
                </p>
                {latestEvent?.reason && (
                  <p className="text-sm text-amber-700 mt-2 bg-amber-50 rounded-lg px-3 py-2">
                    {latestEvent.reason}
                  </p>
                )}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  idea.verificationStatus === "FLAGGED"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {idea.verificationStatus}
              </span>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                disabled={busy}
                onClick={() => setStatus(idea.id, "VERIFIED")}
                className="flex-1 text-sm py-2 rounded-lg bg-green-50 text-green-800 hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
              >
                {busy ? "…" : "✓ Verify"}
              </button>
              <button
                disabled={busy}
                onClick={() => setStatus(idea.id, "FLAGGED")}
                className="flex-1 text-sm py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
              >
                {busy ? "…" : "✕ Block"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
