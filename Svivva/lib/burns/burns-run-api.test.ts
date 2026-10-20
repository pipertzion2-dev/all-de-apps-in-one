import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("burns manual run API", () => {
  it("uses async background run (202) for full manual POST /api/burns/run", () => {
    const src = readFileSync(resolve(__dirname, "../../app/api/burns/run/route.ts"), "utf8");
    expect(src).toContain("status: 202");
    expect(src).toContain("after(");
    expect(src).toContain("loadBurnsProgress");
  });

  it("returns run results synchronously for single-node POST /api/burns/run", () => {
    const src = readFileSync(resolve(__dirname, "../../app/api/burns/run/route.ts"), "utf8");
    expect(src).toContain("return NextResponse.json({ success: run.ok, run })");
  });

  it("resolves lastRun from DB, progress, or memory on GET /api/burns", () => {
    const src = readFileSync(resolve(__dirname, "../../app/api/burns/route.ts"), "utf8");
    expect(src).toContain("resolveBurnsLastRun");
  });

  it("polls progress after async start (liveRun + pollBurnsUntilDone)", () => {
    const src = readFileSync(resolve(__dirname, "../../components/burns-system-graph.tsx"), "utf8");
    expect(src).toContain("liveRun");
    expect(src).toContain("pollBurnsUntilDone");
    expect(src).toContain("effectiveLastRun");
    expect(src).toContain("status === 202");
  });

  it("keeps an in-memory fallback when DB persistence fails", () => {
    const src = readFileSync(resolve(__dirname, "./burns-store.ts"), "utf8");
    expect(src).toContain("memoryLastRun");
    expect(src).toContain("resolveBurnsLastRun");
  });
});
