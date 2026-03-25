// app/garden/graph/page.tsx
// Full-screen Knowledge Graph — visualises all of the user's ideas and their connections.
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Load GraphView without SSR to avoid canvas API conflicts
const GraphView = dynamic(() => import("@/components/GraphView"), { ssr: false });

interface GraphData {
  nodes: { id: string; label: string; status: "SEED" | "GROWING" | "PUBLISHED" }[];
  links: { source: string; target: string }[];
}

export default function GraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-parchment flex flex-col" style={{ zIndex: 50 }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-parchment-dark bg-white/80 backdrop-blur-sm">
        <h1 className="font-serif text-lg text-ink">Knowledge Graph</h1>
        <div className="flex items-center gap-6">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7FA882] inline-block" /> Seed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D08B4A] inline-block" /> Growing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2C2C2C] inline-block" /> Published
            </span>
          </div>
          <Link href="/garden" className="text-sm text-ink-muted hover:text-sage transition-colors">
            ← Garden
          </Link>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted">
            Loading graph…
          </div>
        )}
        {!loading && data && data.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-ink-muted">
            <p className="text-lg mb-2">Your garden is empty.</p>
            <Link href="/garden/ideas/new" className="text-sage hover:underline text-sm">
              Plant your first idea →
            </Link>
          </div>
        )}
        {!loading && data && data.nodes.length > 0 && (
          <GraphView data={data} />
        )}
      </div>
    </div>
  );
}
