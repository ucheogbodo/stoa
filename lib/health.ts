export type HealthReport = {
  status: "ok" | "degraded";
  db: "ok" | "error";
  latencyMs: number;
};

/**
 * Runs a trivial query and reports whether the database answered.
 * Takes the query as a function so it can be unit-tested without a database.
 */
export async function checkHealth(
  ping: () => Promise<unknown>,
  now: () => number = performance.now.bind(performance),
): Promise<HealthReport> {
  const start = now();
  try {
    await ping();
    return { status: "ok", db: "ok", latencyMs: Math.round(now() - start) };
  } catch {
    // Never echo driver errors: they can contain hostnames or credentials.
    return {
      status: "degraded",
      db: "error",
      latencyMs: Math.round(now() - start),
    };
  }
}
