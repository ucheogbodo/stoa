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
    if (hasReflection) {
      setIsOpen(!isOpen);
    }
  }

  return (
    <div 
      className={`relative p-5 transition-colors border rounded-md border-ink-muted/10 bg-transparent ${hasReflection ? 'cursor-pointer hover:bg-parchment/50' : ''}`}
      onClick={toggleOpen}
    >
      <h2 className="font-serif text-[17px] text-ink-muted/80 font-normal leading-snug line-clamp-2">
        {vestige.title || <span className="italic">Untitled</span>}
      </h2>
      
      <div className="flex items-center mt-3 text-xs text-ink-muted/60 gap-2">
        <span>
          Reconsidered on{" "}
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date(vestige.reconsideredAt))}
        </span>
        {hasReflection && !isOpen && (
          <span title="Contains reflection" className="w-[5px] h-[5px] rounded-full bg-ink-muted/40 inline-block"></span>
        )}
      </div>

      {isOpen && is30DaysPassed && (
        <div className="mt-4 border-t border-ink-muted/10 pt-3" onClick={e => e.stopPropagation()}>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            onBlur={handleBlur}
            placeholder="What do you understand now that you didn't then?"
            className="w-full bg-transparent text-sm text-ink-muted border-none outline-none resize-none placeholder:text-ink-muted/30 focus:ring-0"
            rows={5}
            disabled={isSaving}
          />
        </div>
      )}
    </div>
  );
}
