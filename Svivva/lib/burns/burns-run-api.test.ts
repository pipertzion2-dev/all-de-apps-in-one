import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("burns manual run API", () => {
  it("returns run results synchronously from POST /api/burns/run", () => {
    const src = readFileSync(resolve(__dirname, "../../app/api/burns/run/route.ts"), "utf8");
    expect(src).toContain("return NextResponse.json({ success: run.ok, run })");
    expect(src).not.toContain("after(");
    expect(src).not.toContain("status: 202");
  });

  it("resolves lastRun from DB, progress, or memory on GET /api/burns", () => {
    const src = readFileSync(resolve(__dirname, "../../app/api/burns/route.ts"), "utf8");
    expect(src).toContain("resolveBurnsLastRun");
  });

  it("paints node results from the POST response (liveRun)", () => {
    const src = readFileSync(resolve(__dirname, "../../components/burns-system-graph.tsx"), "utf8");
    expect(src).toContain("liveRun");
    expect(src).toContain("setLiveRun");
    expect(src).toContain("effectiveLastRun");
    expect(src).not.toContain("pollUntilSettled");
  });

  it("keeps an in-memory fallback when DB persistence fails", () => {
    const src = readFileSync(resolve(__dirname, "./burns-store.ts"), "utf8");
    expect(src).toContain("memoryLastRun");
    expect(src).toContain("resolveBurnsLastRun");
  });
});
