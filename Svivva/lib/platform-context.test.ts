import { describe, expect, it } from "vitest";
import { platformModeForCubeFace, platformModeFromPath } from "@/lib/platform-context";

describe("platformModeFromPath", () => {
  it("maps hardware routes to Crest (physical)", () => {
    expect(platformModeFromPath("/dashboard/hardware-builder")).toBe("physical");
    expect(platformModeFromPath("/dashboard/hypothesis-hardware")).toBe("physical");
  });

  it("maps API routes to Signal (digital)", () => {
    expect(platformModeFromPath("/dashboard/api-builder")).toBe("digital");
    expect(platformModeFromPath("/dashboard/hypothesis")).toBe("digital");
  });

  it("leaves shared cube routes unchanged", () => {
    expect(platformModeFromPath("/play")).toBeNull();
    expect(platformModeFromPath("/seeds")).toBeNull();
    expect(platformModeFromPath("/dashboard/orbit")).toBeNull();
    expect(platformModeFromPath("/dashboard/poor-man-protection")).toBeNull();
    expect(platformModeFromPath("/")).toBeNull();
  });
});

describe("platformModeForCubeFace", () => {
  it("maps Hardware and Digital cube faces to the correct bus", () => {
    expect(platformModeForCubeFace("hardware")).toBe("physical");
    expect(platformModeForCubeFace("api")).toBe("digital");
  });

  it("does not force mode for cross-bus faces", () => {
    expect(platformModeForCubeFace("play")).toBeNull();
    expect(platformModeForCubeFace("seeds")).toBeNull();
    expect(platformModeForCubeFace("orbit")).toBeNull();
    expect(platformModeForCubeFace("security")).toBeNull();
  });
});
