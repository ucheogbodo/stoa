// components/LinkedIdeasPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Side panel for managing bidirectional idea links (the knowledge graph).
// Lets you search for other ideas by title and attach/detach them as connections.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";

export interface LinkedIdea {
  id: string;
  title: string;
  status: string;
}

interface LinkedIdeasPanelProps {
  // The ID of the idea currently being edited
  currentIdeaId: string | null;
  // Ideas already linked to this idea
  linkedIdeas: LinkedIdea[];
  // Called when the set of linked ideas changes
  onChange: (ideas: LinkedIdea[]) => void;
}

export function LinkedIdeasPanel({
  currentIdeaId,
  linkedIdeas,
  onChange,
}: LinkedIdeasPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LinkedIdea[]>([]);
  const [searching, setSearching] = useState(false);

  // Search ideas by title
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    fetch(`/api/ideas?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: LinkedIdea[]) => {
        // Don't show the current idea or ideas already linked
        const linkedIds = new Set(linkedIdeas.map((i) => i.id));
        setResults(
          data.filter((i) => i.id !== currentIdeaId && !linkedIds.has(i.id))
        );
      })
      .catch(() => {})
      .finally(() => setSearching(false));

    return () => controller.abort();
  }, [query, linkedIdeas, currentIdeaId]);

  function linkIdea(idea: LinkedIdea) {
    onChange([...linkedIdeas, idea]);
    setQuery("");
    setResults([]);
  }

  function unlinkIdea(ideaId: string) {
    onChange(linkedIdeas.filter((i) => i.id !== ideaId));
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-sm text-ink mb-2">Linked Ideas</h3>
        <p className="text-xs text-ink-muted mb-3">
          Connect this idea to others to build your knowledge graph.
        </p>
      </div>

      {/* Currently linked ideas */}
      {linkedIdeas.length > 0 && (
        <div className="space-y-2">
          {linkedIdeas.map((idea) => (
            <div
              key={idea.id}
              className="flex items-start justify-between gap-2 p-2 rounded bg-parchment-dark border border-parchment-border"
            >
              <span className="text-sm text-ink font-serif leading-tight line-clamp-2">
                {idea.title || "Untitled"}
              </span>
              <button
                type="button"
                onClick={() => unlinkIdea(idea.id)}
                className="text-ink-muted hover:text-rust text-xs shrink-0 mt-0.5"
                aria-label="Remove link"
              >
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ideas to link…"
          className="input text-sm"
        />

        {/* Search results */}
        {results.length > 0 && (
          <div className="mt-1 border border-parchment-border rounded bg-white shadow-sm overflow-hidden">
            {results.map((idea) => (
              <button
                key={idea.id}
                type="button"
                onClick={() => linkIdea(idea)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-parchment-dark transition-colors font-serif"
              >
                {idea.title || "Untitled"}
              </button>
            ))}
          </div>
        )}

        {searching && (
          <p className="mt-1 text-xs text-ink-muted">Searching…</p>
        )}

        {!searching && query.trim() && results.length === 0 && (
          <p className="mt-1 text-xs text-ink-muted">No matching ideas found.</p>
        )}
      </div>
    </div>
  );
}
