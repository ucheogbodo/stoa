// components/IdeaCard.tsx
// Garden idea card — elevated, clean, hover-lifted.
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
    tags: { tag: { id: string; name: string; slug: string } }[];
  };
}

const statusConfig: Record<IdeaStatus, { badge: string; label: string; icon: string }> = {
  SEED:      { badge: "badge-seed",      label: "Seed",      icon: "🌱" },
  GROWING:   { badge: "badge-growing",   label: "Growing",   icon: "🌿" },
  PUBLISHED: { badge: "badge-published", label: "Published", icon: "📖" },
};

export function IdeaCard({ idea }: IdeaCardProps) {
  const router = useRouter();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const cfg = statusConfig[idea.status];

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
      <div className="card relative p-6 flex flex-col justify-center items-center text-center space-y-5 min-h-[160px]">
        <p className="font-serif text-base text-ink leading-relaxed">
          Are you setting this aside, or have you reconsidered?
        </p>
        <div className="flex gap-6">
          <button
            onClick={handleSetAside}
            className="text-sm text-ink-muted hover:text-ink transition-colors underline underline-offset-4 decoration-parchment-border"
          >
            Set aside
          </button>
          <button
            onClick={handleReconsidered}
            className="text-sm text-ink-muted hover:text-ink transition-colors underline underline-offset-4 decoration-parchment-border"
          >
            I&apos;ve reconsidered
          </button>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsConfirmingDelete(false); }}
          className="absolute top-3 right-3 text-ink-muted/50 hover:text-ink-muted transition-colors p-1.5 rounded-lg hover:bg-parchment-dark"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="card relative group/card overflow-hidden">
      {/* Delete trigger — appears on hover */}
      <button
        type="button"
        onClick={handleInitiateDelete}
        title="Remove idea"
        aria-label="Remove idea"
        className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 transition-all duration-200
                   text-ink-muted/50 hover:text-rust text-xs leading-none p-1.5 rounded-lg
                   hover:bg-rust-light z-10"
      >
        ✕
      </button>

      <Link href={`/garden/ideas/${idea.id}`} className="block p-5">
        {/* Status badge */}
        <span className={cfg.badge}>
          {cfg.icon} {cfg.label}
        </span>

        {/* Title */}
        <h2 className="font-serif text-lg text-ink mt-3.5 mb-2 leading-snug line-clamp-2
                        group-hover/card:text-sage transition-colors duration-200">
          {idea.title || <span className="italic text-ink-muted/60">Untitled</span>}
        </h2>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {idea.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="text-xs text-ink-muted bg-parchment-dark px-2.5 py-0.5 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-ink-muted/60 mt-auto pt-1">
          {new Intl.DateTimeFormat("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }).format(new Date(idea.updatedAt))}
        </p>
      </Link>
    </div>
  );
}
