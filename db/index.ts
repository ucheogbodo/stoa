import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

declare global {
  // Reuse one client across dev hot-reloads instead of leaking connections.
  var __stoaSql: postgres.Sql | undefined;
}

const sql =
  globalThis.__stoaSql ??
  postgres(env.DATABASE_URL, {
    // Supabase's transaction pooler doesn't support prepared statements.
    prepare: false,
    // Serverless functions are short-lived; keep the pool small.
    max: env.NODE_ENV === "production" ? 1 : 5,
  });

if (env.NODE_ENV !== "production") globalThis.__stoaSql = sql;

export { sql };
export const db = drizzle(sql, { schema, casing: "snake_case" });
