import { describe, expect, it } from "vitest";
import {
  buildWalkthroughPack,
  buildWalkthroughPackFromInput,
  buildWalkthroughPackZipBuffer,
  walkthroughPackZipFilename,
} from "./walkthrough-pack";

describe("walkthrough pack", () => {
  it("builds a multi-file pack with one file per cube face", () => {
    const pack = buildWalkthroughPackFromInput({ productName: "Test Drone" });
    expect(pack.files.length).toBeGreaterThanOrEqual(12);
    expect(pack.files.some((f) => f.path === "README.md")).toBe(true);
    expect(pack.files.some((f) => f.path === "journey.json")).toBe(true);
    expect(pack.files.some((f) => f.path === "walkthrough.md")).toBe(true);
    expect(pack.files.some((f) => f.path === "checklist.csv")).toBe(true);
    expect(pack.files.some((f) => f.path === "routes.json")).toBe(true);
    expect(pack.files.some((f) => f.path === "cube-geometry.json")).toBe(true);
    expect(pack.files.filter((f) => f.path.startsWith("steps/"))).toHaveLength(6);
  });

  it("names the zip from the product slug", () => {
    const pack = buildWalkthroughPackFromInput({ productName: "Smart Soil Monitor" });
    expect(walkthroughPackZipFilename(pack)).toBe("smart-soil-monitor-cube-walkthrough-pack.zip");
  });

  it("produces a non-empty zip buffer", async () => {
    const pack = buildWalkthroughPack();
    const { buffer, filename } = await buildWalkthroughPackZipBuffer();
    expect(buffer.length).toBeGreaterThan(100);
    expect(filename).toContain("cube-walkthrough-pack.zip");
    expect(pack.files.length).toBe(filename ? pack.files.length : 0);
  });

  it("includes six routes in checklist csv", () => {
    const pack = buildWalkthroughPackFromInput({ productName: "Widget" });
    const csv = pack.files.find((f) => f.path === "checklist.csv")!.content;
    const lines = csv.trim().split("\n");
    expect(lines.length).toBe(7); // header + 6 steps
    expect(csv).toContain("/seeds");
    expect(csv).toContain("/dashboard/hardware-builder");
  });

  it("marks visited faces as done in checklist csv", () => {
    const pack = buildWalkthroughPackFromInput(
      { productName: "Widget" },
      { visitedFaceIds: ["seeds", "api"] },
    );
    const csv = pack.files.find((f) => f.path === "checklist.csv")!.content;
    expect(csv).toMatch(/seeds.*yes/);
    expect(csv).toMatch(/api.*yes/);
    const manifest = JSON.parse(pack.files.find((f) => f.path === "manifest.json")!.content);
    expect(manifest.cubeProgress.visitedFaceIds).toEqual(["seeds", "api"]);
  });
});
