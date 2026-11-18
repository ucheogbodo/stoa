import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next's env files; load .env.local locally (CI/Vercel set real env vars).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url)
  throw new Error("Set DATABASE_URL (or DATABASE_URL_DIRECT) in .env.local");

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  casing: "snake_case",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
