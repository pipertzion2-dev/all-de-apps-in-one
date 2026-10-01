import { describe, expect, it } from "vitest";
import { estimateKleanRunScore } from "./klean-run-estimate";

describe("klean run score estimate", () => {
  it("rewards cleaner longer runs", () => {
    const dirty = estimateKleanRunScore({ distanceM: 80, cleanliness: 40, streak: 1 });
    const clean = estimateKleanRunScore({ distanceM: 80, cleanliness: 92, streak: 1 });
    expect(clean).toBeGreaterThan(dirty);
  });

  it("applies bonus past destination distance", () => {
    const pre = estimateKleanRunScore({ distanceM: 100, cleanliness: 80, streak: 3 });
    const post = estimateKleanRunScore({ distanceM: 130, cleanliness: 80, streak: 3 });
    expect(post).toBeGreaterThan(pre);
  });
});
