// components/IdeaCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// A card displaying a summary of one Idea in the garden grid.
// Clicking the card navigates to the full editor for that idea.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { IdeaStatus } from "@prisma/client";

// The shape of the idea data passed to this card
// (Prisma result with the tags relation included)
interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    status: IdeaStatus;
    updatedAt: Date;
    tags: {
      tag: {
        id: string;
        name: string;
        slug: string;
      };
    }[];
  };
}

// Map each status to a CSS class (defined in globals.css)
const statusBadgeClass: Record<IdeaStatus, string> = {
  SEED: "badge-seed",
  GROWING: "badge-growing",
  PUBLISHED: "badge-published",
};

// Human-readable label for each status
const statusLabel: Record<IdeaStatus, string> = {
  SEED: "Seed",
  GROWING: "Growing",
  PUBLISHED: "Published",
};

export function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <Link
      href={`/garden/ideas/${idea.id}`}
      className="card block p-5 group"
    >
      {/* Status badge */}
      <span className={statusBadgeClass[idea.status]}>
        {statusLabel[idea.status]}
      </span>

      {/* Title */}
      <h2 className="font-serif text-lg text-ink mt-3 leading-snug group-hover:text-ink-light transition-colors line-clamp-2">
        {idea.title || <span className="italic text-ink-muted">Untitled</span>}
      </h2>

      {/* Tags */}
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {idea.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs text-ink-muted bg-parchment-dark px-2 py-0.5 rounded"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Last updated date */}
      <p className="mt-4 text-xs text-ink-muted">
        Updated{" "}
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(idea.updatedAt))}
      </p>
    </Link>
  );
}
