import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes without dropping tokens", () => {
    expect(cn("px-2 py-1", "px-4")).toContain("py-1");
    expect(cn("px-2 py-1", "px-4")).toContain("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "block")).toContain("base");
    expect(cn("base", false && "hidden", true && "block")).toContain("block");
    expect(cn("base", false && "hidden", true && "block")).not.toContain("hidden");
  });
});
