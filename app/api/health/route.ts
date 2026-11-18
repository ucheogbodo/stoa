import { connection } from "next/server";
import { sql } from "@/db";
import { checkHealth } from "@/lib/health";

export async function GET() {
  // Always answer at request time; a prerendered health check is meaningless.
  await connection();

  const report = await checkHealth(() => sql`select 1`);
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
