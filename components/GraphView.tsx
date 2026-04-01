// components/GraphView.tsx
// Interactive force-directed knowledge graph powered by react-force-graph-2d.
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface GraphNode {
  id: string;
  label: string;
  status: "SEED" | "GROWING" | "PUBLISHED";
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Color palette matching Stoa's design tokens
const NODE_COLOR: Record<GraphNode["status"], string> = {
  SEED: "#7FA882",    // sage green
  GROWING: "#D08B4A", // amber
  PUBLISHED: "#2C2C2C", // ink
};

interface GraphViewProps {
  data: GraphData;
}

export default function GraphView({ data }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      router.push(`/garden/ideas/${node.id}`);
    },
    [router]
  );

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Dynamically import to avoid SSR issues with canvas-based library
    import("react-force-graph-2d").then(async ({ default: ForceGraph2D }) => {
      const { createRoot } = await import("react-dom/client");

      const el = document.createElement("div");
      el.style.width = "100%";
      el.style.height = "100%";
      container.innerHTML = "";
      container.appendChild(el);

      const root = createRoot(el);
      root.render(
        <ForceGraph2D
          width={width}
          height={height}
          graphData={data}
          nodeLabel={(node: GraphNode) => node.label}
          nodeColor={(node: GraphNode) => NODE_COLOR[node.status] ?? "#999"}
          nodeRelSize={6}
          linkColor={() => "#D4C5A9"}
          linkWidth={1.5}
          onNodeClick={handleNodeClick}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.label;
            const fontSize = Math.max(10, 14 / globalScale);
            ctx.font = `${fontSize}px serif`;
            ctx.fillStyle = "#2C2C2C";
            ctx.textAlign = "center";
            ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + 12);
          }}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      );

      return () => root.unmount();
    });
  }, [data, handleNodeClick]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
