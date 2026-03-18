// components/FilterBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Filter controls for the Garden dashboard.
// Uses URL search parameters so the current filter is reflected in the URL
// and the browser back button works correctly.
// This is a CLIENT component because it needs to read + update the URL.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { IdeaStatus } from "@prisma/client";

interface FilterBarProps {
  tags: { id: string; name: string; slug: string }[];
  currentStatus?: string;
  currentTag?: string;
}

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: IdeaStatus.SEED, label: "Seed" },
  { value: IdeaStatus.GROWING, label: "Growing" },
  { value: IdeaStatus.PUBLISHED, label: "Published" },
];

export function FilterBar({ tags, currentStatus, currentTag }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    // Create a new URLSearchParams object from the current params
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Navigate to the updated URL (no full page reload — Next.js soft navigation)
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Status filter */}
      <select
        value={currentStatus ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="input !w-auto text-sm py-1.5"
        aria-label="Filter by status"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Tag filter */}
      <select
        value={currentTag ?? ""}
        onChange={(e) => updateFilter("tag", e.target.value)}
        className="input !w-auto text-sm py-1.5"
        aria-label="Filter by tag"
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.slug}>
            {tag.name}
          </option>
        ))}
      </select>

      {/* Clear filters — only shown when filters are active */}
      {(currentStatus || currentTag) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-sm text-ink-muted hover:text-rust transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
