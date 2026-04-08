// components/FilterBar.tsx
// Pill-based filter controls for the Garden dashboard.
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { IdeaStatus } from "@prisma/client";

interface FilterBarProps {
  tags: { id: string; name: string; slug: string }[];
  currentStatus?: string;
  currentTag?: string;
}

const statusOptions = [
  { value: IdeaStatus.SEED,      label: "🌱 Seeds" },
  { value: IdeaStatus.GROWING,   label: "🌿 Growing" },
  { value: IdeaStatus.PUBLISHED, label: "📖 Published" },
];

export function FilterBar({ tags, currentStatus, currentTag }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() { router.push(pathname); }

  const hasFilters = !!(currentStatus || currentTag);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Status pills */}
      {statusOptions.map((opt) => {
        const active = currentStatus === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => updateFilter("status", active ? "" : opt.value)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 ${
              active
                ? "bg-ink text-parchment"
                : "bg-parchment-dark text-ink-muted hover:bg-parchment-border hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}

      {/* Divider — only if we also have tags */}
      {tags.length > 0 && (
        <span className="w-px h-4 bg-parchment-border mx-1 hidden sm:block" />
      )}

      {/* Tag pills */}
      {tags.map((tag) => {
        const active = currentTag === tag.slug;
        return (
          <button
            key={tag.id}
            onClick={() => updateFilter("tag", active ? "" : tag.slug)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 ${
              active
                ? "bg-sage text-white"
                : "bg-parchment-dark text-ink-muted hover:bg-sage/15 hover:text-sage"
            }`}
          >
            {tag.name}
          </button>
        );
      })}

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-ink-muted/60 hover:text-rust transition-colors ml-1"
        >
          Clear
        </button>
      )}
    </div>
  );
}
