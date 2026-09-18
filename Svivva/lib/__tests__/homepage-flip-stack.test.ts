import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  flipPanelFromHash,
  flipPanelIndex,
  hashForFlipPanel,
} from "../homepage-flip-stack";

describe("homepage flip stack", () => {
  it("maps legacy hash ids to flip panels", () => {
    expect(flipPanelFromHash("nav-cube")).toBe("nav-cube");
    expect(flipPanelFromHash("home-game")).toBe("home-game");
    expect(flipPanelFromHash("clean-sneaks")).toBe("home-game");
    expect(flipPanelFromHash("home-explore")).toBe("home-explore");
  });

  it("round-trips hash helpers", () => {
    expect(hashForFlipPanel("nav-cube")).toBe("nav-cube");
    expect(hashForFlipPanel("home-game")).toBe("home-game");
    expect(hashForFlipPanel("home-explore")).toBe("home-explore");
  });

  it("orders begin, game, home", () => {
    expect(flipPanelIndex("nav-cube")).toBe(0);
    expect(flipPanelIndex("home-game")).toBe(1);
    expect(flipPanelIndex("home-explore")).toBe(2);
  });

  it("locks wheel navigation to the settled panel index", () => {
    const flipSrc = readFileSync(
      resolve(__dirname, "../../components/homepage-flip-stack.tsx"),
      "utf8",
    );
    expect(flipSrc).toContain("targetIndexRef.current");
    expect(flipSrc).toContain("FLIP_SETTLE_EPSILON");
    expect(flipSrc).not.toContain("Math.round(displayedIndexRef.current)");
  });
});
