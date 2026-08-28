import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("burns manual run API", () => {
  it("starts full manual runs in the background (202 + after)", () => {
    const src = readFileSync(resolve(__dirname, "../../app/api/burns/run/route.ts"), "utf8");
    expect(src).toContain('from "next/server"');
    expect(src).toContain("after(");
    expect(src).toContain("status: 202");
    expect(src).toContain("setBurnsProgress");
  });

  it("returns graph progress from GET /api/burns", () => {
    const src = readFileSync(resolve(__dirname, "../../app/api/burns/route.ts"), "utf8");
    expect(src).toContain("loadBurnsProgress");
    expect(src).toContain("progress");
  });

  it("applies run results in the graph UI instead of reload-only", () => {
    const src = readFileSync(resolve(__dirname, "../../components/burns-system-graph.tsx"), "utf8");
    expect(src).toContain("pollUntilSettled");
    expect(src).toContain("mergeBurnsRuns");
    expect(src).toContain("res.status === 202");
  });
});
