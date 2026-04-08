// app/garden/vestibule/VestibuleClient.tsx
// Client component for the Vestibule page.
// Renders VestigeCards and shows a "Discard" option for empty/accidental vestiges.
"use client";

import { useState } from "react";
import { VestigeCard } from "@/components/VestigeCard";

interface Vestige {
  id: string;
  title: string;
  reconsideredAt: Date;
  reflection: string | null;
  reflectionAt: Date | null;
}

interface Props {
  vestiges: Vestige[];
}

function isEmptyVestige(v: Vestige): boolean {
  const hasTitle = v.title && v.title.trim().length > 0 && v.title.trim().toLowerCase() !== "untitled";
  const hasReflection = v.reflection && v.reflection.trim().length > 0;
  return !hasTitle && !hasReflection;
}

export function VestibuleClient({ vestiges: initial }: Props) {
  const [vestiges, setVestiges] = useState(initial);
  const [discarding, setDiscarding] = useState<string | null>(null);

  async function handleDiscard(id: string) {
    setDiscarding(id);
    const res = await fetch(`/api/vestiges/${id}`, { method: "DELETE" });
    if (res.ok) {
      setVestiges((prev) => prev.filter((v) => v.id !== id));
    }
    setDiscarding(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink">The Vestibule</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ideas you chose to reconsider. They are not gone — they are archived here.
        </p>
        {vestiges.length > 0 && (
          <p className="mt-1 text-xs text-ink-muted/60">
            {vestiges.length} {vestiges.length === 1 ? "vestige" : "vestiges"}
          </p>
        )}
      </div>

      {vestiges.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-serif text-xl text-ink-muted">Nothing reconsidered yet.</p>
          <p className="mt-2 text-sm text-ink-muted">
            Ideas you set aside will appear here — not deleted, only rested.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vestiges.map((vestige) => {
            const empty = isEmptyVestige(vestige);
            return (
              <div key={vestige.id} className="relative">
                <VestigeCard vestige={vestige} />
                {/* Discard option — only shown for truly empty vestiges */}
                {empty && (
                  <div className="mt-1 px-1">
                    <button
                      onClick={() => handleDiscard(vestige.id)}
                      disabled={discarding === vestige.id}
                      className="text-xs text-ink-muted/50 hover:text-rust transition-colors"
                      title="This vestige is empty and may be discarded"
                    >
                      {discarding === vestige.id ? "Discarding…" : "Discard (empty)"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Philosophical note */}
      <p className="mt-16 text-xs text-ink-muted/50 text-center italic max-w-md mx-auto">
        A reflection may be written after 30 days have passed. Vestiges with content are permanent.
      </p>
    </div>
  );
}
