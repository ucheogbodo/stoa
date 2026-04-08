// tailwind.config.ts
// Design tokens for Stoa — all color values use CSS custom properties
// so that the data-theme="light" toggle cascades correctly through
// every Tailwind utility class (bg-*, text-*, border-*, etc.).
// The `<alpha-value>` placeholder allows opacity modifiers like bg-parchment/80.

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Color Palette ────────────────────────────────────────────────────────
      // Values reference CSS custom properties defined in :root (globals.css).
      // This makes every utility class responsive to the data-theme switch.
      colors: {
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          light:   "rgb(var(--color-ink-light) / <alpha-value>)",
          muted:   "rgb(var(--color-ink-muted) / <alpha-value>)",
        },
        parchment: {
          DEFAULT: "rgb(var(--color-parchment) / <alpha-value>)",
          dark:    "rgb(var(--color-parchment-dark) / <alpha-value>)",
          border:  "rgb(var(--color-parchment-border) / <alpha-value>)",
        },
        sage: {
          DEFAULT: "rgb(var(--color-sage) / <alpha-value>)",
          light:   "rgb(var(--color-sage-light) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "rgb(var(--color-amber) / <alpha-value>)",
          light:   "rgb(var(--color-amber-light) / <alpha-value>)",
        },
        rust: {
          DEFAULT: "rgb(var(--color-rust) / <alpha-value>)",
          light:   "rgb(var(--color-rust-light) / <alpha-value>)",
        },
      },

      // ── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans:  ["Inter", "system-ui", "sans-serif"],
      },

      // ── Prose width ─────────────────────────────────────────────────────────
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
