// components/VestigeCard.tsx
// Archived idea card — muted, archival in feel, expandable for reflection.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VestigeCardProps {
  vestige: {
    id: string;
    title: string;
    reconsideredAt: Date;
    reflection: string | null;
    reflectionAt: Date | null;
  };
}

export function VestigeCard({ vestige }: VestigeCardProps) {
  const router = useRouter();
  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  const daysPassed = (Date.now() - new Date(vestige.reconsideredAt).getTime()) / MS_IN_DAY;
  const is30DaysPassed = daysPassed >= 30;

  const hasReflection = !!vestige.reflection;
  const [isOpen, setIsOpen] = useState(!hasReflection && is30DaysPassed);
  const [reflectionText, setReflectionText] = useState(vestige.reflection || "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleBlur() {
    if (reflectionText !== vestige.reflection && reflectionText.trim() !== "") {
      setIsSaving(true);
      await fetch(`/api/vestiges/${vestige.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflection: reflectionText }),
      });
      setIsSaving(false);
      router.refresh();
    }
  }

  function toggleOpen() {
    if (hasReflection || is30DaysPassed) setIsOpen((prev) => !prev);
  }

  return (
    <div
      className={`card-muted relative p-5 group/vestige ${
        hasReflection || is30DaysPassed ? "cursor-pointer hover:bg-parchment/60" : ""
      } transition-colors duration-200`}
      onClick={toggleOpen}
    >
      {/* Archived indicator dot */}
      <span className="inline-flex w-1.5 h-1.5 rounded-full bg-ink-muted/25 mb-3" />

      <h2 className="font-serif text-base text-ink-muted/70 font-normal leading-snug line-clamp-2 mb-3">
        {vestige.title || <span className="italic">Untitled</span>}
      </h2>

      <div className="flex items-center gap-2 text-xs text-ink-muted/50">
        <span>
          {new Intl.DateTimeFormat("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }).format(new Date(vestige.reconsideredAt))}
        </span>
        {hasReflection && !isOpen && (
          <span className="w-1 h-1 rounded-full bg-sage/50 inline-block" title="Has reflection" />
        )}
        {!is30DaysPassed && !hasReflection && (
          <span className="text-ink-muted/40 italic">
            reflection in {Math.ceil(30 - daysPassed)}d
          </span>
        )}
      </div>

      {/* Reflection editor */}
      {isOpen && is30DaysPassed && (
        <div
          className="mt-4 pt-4 border-t border-parchment-border/60"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-ink-muted/50 mb-2 uppercase tracking-widest">Reflection</p>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            onBlur={handleBlur}
            placeholder="What do you understand now that you didn't then?"
            className="w-full bg-transparent text-sm text-ink-muted border-none outline-none
                       resize-none placeholder:text-ink-muted/30 focus:ring-0 leading-relaxed"
            rows={5}
            disabled={isSaving}
          />
          {isSaving && (
            <p className="text-xs text-ink-muted/40 mt-1">Saving…</p>
          )}
        </div>
      )}
    </div>
  );
}
