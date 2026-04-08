// app/garden/graph/page.tsx
// Full-screen Knowledge Graph with projects, idea links, and tag cluster halos.
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { GraphData } from "@/components/GraphView";

const GraphView = dynamic(() => import("@/components/GraphView"), { ssr: false });

export default function GraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const ideaCount    = data?.nodes.filter((n) => n.type === "idea").length    ?? 0;
  const projectCount = data?.nodes.filter((n) => n.type === "project").length ?? 0;
  const vestigeCount = data?.nodes.filter((n) => n.type === "vestige").length ?? 0;
  const linkCount    = data?.links.length ?? 0;

  return (
    <div className="fixed inset-0 bg-parchment flex flex-col" style={{ zIndex: 50 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-parchment-border bg-parchment/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-lg text-ink">Knowledge Graph</h1>
          {!loading && data && (
            <span className="text-xs text-ink-muted/60">
              {ideaCount} idea{ideaCount !== 1 ? "s" : ""}
              {projectCount > 0 && ` · ${projectCount} project${projectCount !== 1 ? "s" : ""}`}
              {vestigeCount > 0 && ` · ${vestigeCount} vestige${vestigeCount !== 1 ? "s" : ""}`}
              {linkCount > 0 && ` · ${linkCount} link${linkCount !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7a9e7e] inline-block" /> Seed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9923a] inline-block" /> Growing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a1a2e] inline-block" /> Published
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#2d2d44] ring-[1.5px] ring-[#7a9e7e] inline-block" /> Project
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-dashed border-ink-muted/60 inline-block" /> Vestige
            </span>
            <span className="flex items-center gap-1.5 opacity-60">
              <span className="w-6 border-t border-dashed border-[#7a9e7e] inline-block" /> Linked to project
            </span>
          </div>

          <Link href="/garden" className="text-sm text-ink-muted hover:text-sage transition-colors">
            ← Garden
          </Link>
        </div>
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted animate-pulse">
            Drawing the garden…
          </div>
        )}

        {!loading && (!data || data.nodes.length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3">
            <p className="font-serif text-xl text-ink-muted">Your garden is empty.</p>
            <Link href="/garden/ideas/new" className="btn-primary">
              Plant your first idea →
            </Link>
          </div>
        )}

        {!loading && data && data.nodes.length > 0 && (
          <GraphView data={data} />
        )}
      </div>

      {/* ── Hint bar ───────────────────────────────────────────────────── */}
      <div className="px-6 py-2 border-t border-parchment-border/60 text-xs text-ink-muted/50 text-center shrink-0">
        Click a node to open it · Tag halos show shared intellectual territory · Scroll to zoom
      </div>
    </div>
  );
}
