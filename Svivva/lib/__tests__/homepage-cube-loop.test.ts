import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { cubeLoopWrapTarget, nextCubeLoopPanel, prevCubeLoopPanel } from "../homepage-cube-loop";

describe("homepage cube loop", () => {
  it("wraps forward from the last face to the first", () => {
    expect(nextCubeLoopPanel("nav-cube")).toBe("home-beta");
    expect(nextCubeLoopPanel("home-beta")).toBe("nav-cube");
  });

  it("wraps backward from the first face to the last", () => {
    expect(prevCubeLoopPanel("home-beta")).toBe("nav-cube");
    expect(prevCubeLoopPanel("nav-cube")).toBe("home-beta");
  });

  it("maps wheel direction + edge position to a wrap target", () => {
    expect(cubeLoopWrapTarget(40, { nearBottom: true, nearTop: false })).toBe("home-beta");
    expect(cubeLoopWrapTarget(-40, { nearBottom: false, nearTop: true })).toBe("nav-cube");
    expect(cubeLoopWrapTarget(40, { nearBottom: false, nearTop: false })).toBeNull();
    expect(cubeLoopWrapTarget(-40, { nearBottom: true, nearTop: false })).toBeNull();
    expect(cubeLoopWrapTarget(0, { nearBottom: true, nearTop: true })).toBeNull();
  });

  it("mounts the continuous cube loop after the story face on the homepage", () => {
    const pageSrc = readFileSync(resolve(__dirname, "../../app/home-page-client.tsx"), "utf8");
    const loopSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-cube-loop.tsx"),
      "utf8",
    );
    expect(pageSrc).toContain("HomepageCubeLoop");
    expect(pageSrc).toMatch(/HomepageCubePanel[\s\S]*HomepageCubeLoop/);
    expect(loopSrc).toContain('scrollToHomepagePanel("home-beta")');
    expect(loopSrc).toContain("data-homepage-cube-loop");
    expect(loopSrc).toContain("HOMEPAGE_SCROLL_WRAP_TO_FIRST");
    expect(loopSrc).toContain("IntersectionObserver");
  });
});
