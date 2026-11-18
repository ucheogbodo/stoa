import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Typed, validated environment variables.
 *
 * Imported by next.config.ts, so a missing or malformed variable fails
 * `next build` instead of failing in production at request time.
 * Set SKIP_ENV_VALIDATION=1 only for jobs that never touch the DB (lint, CI typecheck).
 */
export const env = createEnv({
  server: {
    // Runtime connection. On Vercel use Supabase's *transaction* pooler (port 6543).
    DATABASE_URL: z.url().startsWith("postgres"),
    // Direct (or session-pooler) connection for drizzle-kit migrations. Falls back to DATABASE_URL.
    DATABASE_URL_DIRECT: z.url().startsWith("postgres").optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
