// components/SearchBar.tsx
// Instant search input for the Garden nav. Queries /api/search and shows
// a floating dropdown of matching ideas.
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  status: "SEED" | "GROWING" | "PUBLISHED";
  snippet: string;
}

const statusEmoji: Record<string, string> = {
  SEED: "🌱",
  GROWING: "🌿",
  PUBLISHED: "📖",
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
        setSelectedIndex(-1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 280);
  }

  function navigateTo(id: string) {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push(`/garden/ideas/${id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      navigateTo(results[selectedIndex].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm pointer-events-none">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search ideas…"
          className="pl-8 pr-3 py-1.5 text-sm rounded border border-parchment-border bg-white/80 text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-ink w-44 focus:w-56 transition-all duration-200"
        />
        {loading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted text-xs animate-pulse">
            …
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-lg border border-parchment-border shadow-lg z-50 overflow-hidden">
          <ul>
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseDown={() => navigateTo(r.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    i === selectedIndex ? "bg-parchment-dark" : "hover:bg-parchment"
                  } ${i !== 0 ? "border-t border-parchment-border" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{statusEmoji[r.status]}</span>
                    <span className="text-sm font-medium text-ink truncate">{r.title}</span>
                  </div>
                  {r.snippet && (
                    <p className="text-xs text-ink-muted mt-0.5 truncate">{r.snippet}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
