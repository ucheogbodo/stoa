// components/GraphView.tsx
// Interactive knowledge graph with:
//   - Idea nodes: coloured by status (SEED / GROWING / PUBLISHED)
//   - Project nodes: larger, warm-ink bubbles
//   - Idea-to-idea edges: solid, warm parchment
//   - Idea-to-project edges: dashed, lighter weight
//   - Tag cluster halos: semi-transparent rings behind ideas that share a tag
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface GraphNode {
  id: string;
  label: string;
  type: "idea" | "project" | "vestige";
  status?: "SEED" | "GROWING" | "PUBLISHED";
  tags?: string[];   // tag slugs, for cluster halo colouring
  tagNames?: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "idea-idea" | "idea-project";
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ── Colour palette ─────────────────────────────────────────────────────────
const IDEA_COLOR: Record<NonNullable<GraphNode["status"]>, string> = {
  SEED:      "#7a9e7e",  // sage
  GROWING:   "#c9923a",  // amber
  PUBLISHED: "#1a1a2e",  // ink
};

const PROJECT_FILL   = "#2d2d44";   // ink-light — large node fill
const PROJECT_STROKE = "#7a9e7e";   // sage accent ring

// Tag-slug → halo colour (deterministic, theme-harmonious palette)
const HALO_PALETTE = [
  "rgba(122, 158, 126, 0.18)",    // sage
  "rgba(201, 146,  58, 0.18)",    // amber
  "rgba(184,  92,  56, 0.14)",    // rust
  "rgba(107, 107, 138, 0.16)",    // ink-muted / violet
  "rgba( 80, 140, 180, 0.14)",    // quiet blue
  "rgba(160, 120,  80, 0.16)",    // warm brown
];

function tagHaloColor(slug: string): string {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = (h * 33) ^ slug.charCodeAt(i);
  return HALO_PALETTE[Math.abs(h) % HALO_PALETTE.length];
}

// ── Sizes ──────────────────────────────────────────────────────────────────
const IDEA_RADIUS    = 7;
const PROJECT_RADIUS = 18;
const HALO_BASE      = IDEA_RADIUS + 4;   // innermost halo ring radius
const HALO_STEP      = 5;                 // each additional tag adds 5px radius

export default function GraphView({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "project") router.push(`/garden/projects/${node.id}`);
      else router.push(`/garden/ideas/${node.id}`);
    },
    [router],
  );

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const container = containerRef.current;
    const width  = container.clientWidth;
    const height = container.clientHeight;

    import("react-force-graph-2d").then(async ({ default: ForceGraph2D }) => {
      const { createRoot } = await import("react-dom/client");

      const el = document.createElement("div");
      el.style.width  = "100%";
      el.style.height = "100%";
      container.innerHTML = "";
      container.appendChild(el);

      const root = createRoot(el);

      root.render(
        <ForceGraph2D
          width={width}
          height={height}
          graphData={data}

          // ── Node sizing for force simulation collision ──────────────────
          nodeVal={(node: GraphNode) => node.type === "project" ? 30 : 4}

          // ── Custom node rendering ───────────────────────────────────────
          nodeCanvasObjectMode={() => "replace"}
          nodeCanvasObject={(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const x = node.x ?? 0;
            const y = node.y ?? 0;

            if (node.type === "project") {
              // ── Project: large filled circle + accent ring ──────────────
              ctx.beginPath();
              ctx.arc(x, y, PROJECT_RADIUS, 0, Math.PI * 2);
              ctx.fillStyle = PROJECT_FILL;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(x, y, PROJECT_RADIUS + 2, 0, Math.PI * 2);
              ctx.strokeStyle = PROJECT_STROKE;
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Label below
              const fontSize = Math.max(9, 12 / globalScale);
              ctx.font = `500 ${fontSize}px Inter, sans-serif`;
              ctx.fillStyle = PROJECT_FILL;
              ctx.textAlign = "center";
              ctx.fillText(node.label, x, y + PROJECT_RADIUS + fontSize + 4);
              return;
            }

            if (node.type === "vestige") {
              // ── Vestige: faded ghost node (hollow, dashed) ──────────────
              ctx.beginPath();
              ctx.arc(x, y, IDEA_RADIUS - 1, 0, Math.PI * 2);
              ctx.setLineDash([2, 1.5]);
              ctx.strokeStyle = "rgba(107, 107, 138, 0.4)"; // ink-muted
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.setLineDash([]); // reset dash

              // Label below (faded outline)
              const fontSize = Math.max(8, 11 / globalScale);
              ctx.font = `italic ${fontSize}px Lora, serif`;
              ctx.fillStyle = "rgba(107, 107, 138, 0.5)";
              ctx.textAlign = "center";
              ctx.fillText(node.label, x, y + IDEA_RADIUS + fontSize + 2);
              return;
            }

            // ── Idea: halos + node circle + label ─────────────────────────
            const tags = node.tags ?? [];

            // Draw halos outermost-first so inner ones sit on top
            [...tags].reverse().forEach((slug, ri) => {
              const i = tags.length - 1 - ri;
              const haloR = HALO_BASE + (tags.length - 1 - i) * HALO_STEP;
              ctx.beginPath();
              ctx.arc(x, y, haloR, 0, Math.PI * 2);
              ctx.fillStyle = tagHaloColor(slug);
              ctx.fill();
            });

            // Node circle
            ctx.beginPath();
            ctx.arc(x, y, IDEA_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = IDEA_COLOR[node.status ?? "SEED"];
            ctx.fill();

            // Label below
            const fontSize = Math.max(8, 11 / globalScale);
            ctx.font = `${fontSize}px Lora, serif`;
            ctx.fillStyle = "rgba(26, 26, 46, 0.85)";
            ctx.textAlign = "center";
            ctx.fillText(node.label, x, y + IDEA_RADIUS + fontSize + 3);
          }}

          // ── Tooltip on hover ────────────────────────────────────────────
          nodeLabel={(node: GraphNode) => {
            if (node.type === "project") return `📁 ${node.label}`;
            if (node.type === "vestige") return `🍂 ${node.label} (Reconsidered)`;
            const tags = node.tagNames?.join(", ");
            return tags ? `${node.label}\n${tags}` : node.label;
          }}

          // ── Edge styling ────────────────────────────────────────────────
          linkColor={(link: GraphLink) =>
            link.type === "idea-project"
              ? "rgba(122, 158, 126, 0.4)"    // sage — project connection
              : "rgba(217, 208, 188, 0.9)"    // parchment-border — idea link
          }
          linkWidth={(link: GraphLink) => link.type === "idea-project" ? 1 : 1.5}
          linkLineDash={(link: GraphLink) => link.type === "idea-project" ? [4, 3] : null}

          // ── Interaction ─────────────────────────────────────────────────
          onNodeClick={handleNodeClick}

          // ── Simulation tuning ───────────────────────────────────────────
          cooldownTicks={120}
          d3AlphaDecay={0.018}
          d3VelocityDecay={0.28}
          backgroundColor="transparent"
        />,
      );

      return () => root.unmount();
    });
  }, [data, handleNodeClick]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
