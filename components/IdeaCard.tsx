// components/IdeaCard.tsx
// A card displaying a summary of one Idea in the garden grid.
// Clicking the card navigates to the full editor for that idea.
// A small trash button in the top-right allows deletion directly from the dashboard.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdeaStatus } from "@prisma/client";
import { useState } from "react";

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

const statusBadgeClass: Record<IdeaStatus, string> = {
  SEED: "badge-seed",
  GROWING: "badge-growing",
  PUBLISHED: "badge-published",
};

const statusLabel: Record<IdeaStatus, string> = {
  SEED: "Seed",
  GROWING: "Growing",
  PUBLISHED: "Published",
};

export function IdeaCard({ idea }: IdeaCardProps) {
  const router = useRouter();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  function handleInitiateDelete(e: React.MouseEvent) {
    e.preventDefault(); 
    e.stopPropagation();
    setIsConfirmingDelete(true);
  }

  async function handleSetAside(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
    router.refresh(); 
  }

  async function handleReconsidered(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/vestiges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaId: idea.id }),
    });
    router.refresh();
  }

  if (isConfirmingDelete) {
    return (
      <div className="card relative p-5 flex flex-col justify-center items-center text-center space-y-4 min-h-[160px] bg-parchment bg-opacity-50">
        <p className="font-serif text-[16px] text-ink text-balance leading-snug">
          Are you setting this aside, or have you changed your mind?
        </p>
        <div className="flex gap-5 mt-2">
          <button
            onClick={handleSetAside}
            className="text-sm text-ink-muted hover:text-ink transition-colors pb-0.5 border-b border-transparent hover:border-ink-muted"
          >
            Set aside
          </button>
          <button
            onClick={handleReconsidered}
            className="text-sm text-ink-muted hover:text-ink transition-colors pb-0.5 border-b border-transparent hover:border-ink-muted"
          >
            I&apos;ve reconsidered
          </button>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsConfirmingDelete(false); }}
          className="absolute top-2 right-3 text-ink-muted hover:text-ink text-sm leading-none p-1"
          title="Cancel"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="card relative group/card">
      {/* Delete button — visible on hover */}
      <button
        type="button"
        onClick={handleInitiateDelete}
        title="Delete idea"
        className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 transition-opacity text-ink-muted hover:text-rust text-sm leading-none p-1 rounded hover:bg-rust-light z-10"
        aria-label="Delete idea"
      >
        🗑
      </button>

      <Link href={`/garden/ideas/${idea.id}`} className="block p-5">
        {/* Status badge */}
        <span className={statusBadgeClass[idea.status]}>
          {statusLabel[idea.status]}
        </span>

        {/* Title */}
        <h2 className="font-serif text-lg text-ink mt-3 leading-snug group-hover/card:text-ink-light transition-colors line-clamp-2">
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
    </div>
  );
}
