// components/ReactionBar.tsx
// Anonymous emoji reaction bar for published Agora ideas.
// Fetches current counts on mount; fires a POST on click with optimistic update.
"use client";

import { useState, useEffect } from "react";

const EMOJIS = ["💡", "🔥", "🌱"] as const;
type Emoji = (typeof EMOJIS)[number];

interface ReactionBarProps {
  ideaId: string;
}

export function ReactionBar({ ideaId }: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<Emoji, number>>({
    "💡": 0,
    "🔥": 0,
    "🌱": 0,
  });
  const [voted, setVoted] = useState<Emoji | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ideas/${ideaId}/reactions`)
      .then((r) => r.json())
      .then((data: Record<string, number>) => {
        setCounts((prev) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ideaId]);

  async function handleReact(emoji: Emoji) {
    if (voted) return; // one vote per session
    setVoted(emoji);
    setCounts((prev) => ({ ...prev, [emoji]: prev[emoji] + 1 }));
    await fetch(`/api/ideas/${ideaId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    }).catch(() => {
      // Roll back optimistic update if error
      setVoted(null);
      setCounts((prev) => ({ ...prev, [emoji]: Math.max(0, prev[emoji] - 1) }));
    });
  }

  if (loading) return null;

  return (
    <div className="flex items-center gap-4 py-6 border-t border-parchment-dark mt-8">
      <span className="text-xs text-ink-muted uppercase tracking-wide">Reactions</span>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleReact(emoji)}
          disabled={!!voted}
          title={voted ? "You've already reacted" : `React with ${emoji}`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all duration-150 ${
            voted === emoji
              ? "border-ink bg-ink text-parchment"
              : voted
              ? "border-parchment-border text-ink-muted opacity-50 cursor-not-allowed"
              : "border-parchment-border text-ink hover:border-ink hover:bg-parchment-dark cursor-pointer"
          }`}
        >
          <span>{emoji}</span>
          <span className="font-medium">{counts[emoji]}</span>
        </button>
      ))}
      {voted && (
        <span className="text-xs text-ink-muted italic">Thanks for reacting!</span>
      )}
    </div>
  );
}
