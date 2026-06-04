import { describe, expect, it } from "vitest";
import { applySwingHumanize } from "./swing-humanize";

describe("applySwingHumanize", () => {
  it("delays off-beat 16ths when swing amount > 0", () => {
    const events = [
      { note: 60, velocity: 80, startBeat: 0, duration: 0.2 },
      { note: 62, velocity: 80, startBeat: 0.25, duration: 0.2 },
    ];
    const out = applySwingHumanize(events, 120, { amount: 1 });
    expect(out[1]!.startBeat).toBeGreaterThan(0.25);
  });
});
