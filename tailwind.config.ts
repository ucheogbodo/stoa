// tailwind.config.ts
// ─────────────────────────────────────────────────────────────────────────────
// Custom design tokens for Stoa.
// The visual language draws from scholarly, editorial aesthetics:
//   - Lora (serif) for idea titles and headings
//   - Inter (sans-serif) for UI chrome and body text
//   - A muted palette of ink, parchment, sage, and rust
// ─────────────────────────────────────────────────────────────────────────────

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Color Palette ──────────────────────────────────────────────────────
      colors: {
        ink: {
          DEFAULT: "#1a1a2e",  // deep navy-black — primary text
          light: "#2d2d44",    // slightly lighter ink
          muted: "#6b6b8a",    // muted ink — secondary text
        },
        parchment: {
          DEFAULT: "#f5f0e8",  // warm off-white — page background
          dark: "#ede6d6",     // slightly darker — card backgrounds
          border: "#d9d0bc",   // border color
        },
        sage: {
          DEFAULT: "#7a9e7e",  // muted green — "seed" status
          light: "#e8f0e9",    // very light sage — sage tint backgrounds
        },
        amber: {
          DEFAULT: "#c9923a",  // warm amber — "growing" status
          light: "#fdf3e3",    // amber tint backgrounds
        },
        rust: {
          DEFAULT: "#b85c38",  // terracotta rust — "published" status / accents
          light: "#fbeee8",    // rust tint backgrounds
        },
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        // Used for idea titles, section headings — gives a literary, editorial feel
        serif: ["Lora", "Georgia", "serif"],
        // Used for UI elements, body copy, labels
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // ── Spacing & Sizing ───────────────────────────────────────────────────
      maxWidth: {
        prose: "68ch", // ideal reading width — used in the editor
      },
    },
  },
  plugins: [],
};

export default config;
