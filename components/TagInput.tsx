// components/TagInput.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Tag input with autocomplete.
// Shows existing user tags as suggestions; lets the user add new tags on the fly.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useRef, useEffect } from "react";

export interface TagData {
  id: string;
  name: string;
  slug: string;
}

interface TagInputProps {
  // Tags currently attached to the idea
  selectedTags: TagData[];
  // Called when the set of selected tags changes
  onChange: (tags: TagData[]) => void;
}

// Converts a tag name to a URL-friendly slug (e.g. "My Tag!" → "my-tag")
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch tag suggestions from the API whenever the input changes
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/tags?q=${encodeURIComponent(inputValue)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: TagData[]) => {
        // Filter out tags that are already selected
        const selectedIds = new Set(selectedTags.map((t) => t.id));
        setSuggestions(data.filter((t) => !selectedIds.has(t.id)));
      })
      .catch(() => {}) // ignore AbortError on cleanup
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [inputValue, selectedTags]);

  // Add a tag (from suggestion or create new)
  function addTag(tag: TagData) {
    if (!selectedTags.find((t) => t.id === tag.id)) {
      onChange([...selectedTags, tag]);
    }
    setInputValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  // Create and add a brand-new tag (not yet in the database)
  async function createAndAddTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, slug: toSlug(trimmed) }),
    });

    if (res.ok) {
      const newTag: TagData = await res.json();
      addTag(newTag);
    }
  }

  // Remove a tag from the selection
  function removeTag(tagId: string) {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      // If there's an exact match in suggestions, use it; otherwise create new
      const exact = suggestions.find(
        (s) => s.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      if (exact) {
        addTag(exact);
      } else if (inputValue.trim()) {
        createAndAddTag(inputValue);
      }
    }

    if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      // Remove the last tag when backspacing in an empty input
      removeTag(selectedTags[selectedTags.length - 1].id);
    }
  }

  return (
    <div>
      {/* Selected tags + input inline */}
      <div
        className="flex flex-wrap gap-1.5 p-2 border border-parchment-border rounded bg-white min-h-[40px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 text-xs bg-parchment-dark text-ink px-2 py-0.5 rounded"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="text-ink-muted hover:text-rust ml-0.5"
              aria-label={`Remove ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? "Add tags…" : ""}
          className="flex-1 min-w-[120px] outline-none text-sm text-ink bg-transparent"
        />
      </div>

      {/* Autocomplete dropdown */}
      {(suggestions.length > 0 || (inputValue.trim() && !loading)) && (
        <div className="mt-1 border border-parchment-border rounded bg-white shadow-sm overflow-hidden">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-parchment-dark transition-colors"
            >
              {tag.name}
            </button>
          ))}

          {/* "Create new tag" option if the input doesn't match an existing tag exactly */}
          {inputValue.trim() &&
            !suggestions.find(
              (s) => s.name.toLowerCase() === inputValue.trim().toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => createAndAddTag(inputValue)}
                className="w-full text-left px-3 py-2 text-sm text-ink-muted hover:bg-parchment-dark transition-colors border-t border-parchment-border"
              >
                Create &ldquo;<strong>{inputValue.trim()}</strong>&rdquo;
              </button>
            )}
        </div>
      )}

      <p className="mt-1 text-xs text-ink-muted">
        Press Enter or comma to add. Backspace to remove.
      </p>
    </div>
  );
}
