import { describe, expect, it } from "vitest";
import { checkHealth } from "./health";

describe("checkHealth", () => {
  it("reports ok when the ping resolves", async () => {
    let t = 0;
    const report = await checkHealth(
      async () => [{ "?column?": 1 }],
      () => (t += 7),
    );
    expect(report).toEqual({ status: "ok", db: "ok", latencyMs: 7 });
  });

  it("reports degraded without leaking the error when the ping rejects", async () => {
    const report = await checkHealth(async () => {
      throw new Error("password authentication failed for user postgres");
    });
    expect(report.status).toBe("degraded");
    expect(report.db).toBe("error");
    expect(JSON.stringify(report)).not.toContain("password");
  });
});
