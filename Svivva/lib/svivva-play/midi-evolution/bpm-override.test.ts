import { describe, expect, it } from "vitest";
import { clampBpm, rescaleEventsToBpm, resolveGlobalBpm } from "./bpm-override";
import type { NormalizedMidiEvent } from "../midi-normalize";

describe("bpm override", () => {
  it("clamps manual bpm to safe range", () => {
    expect(clampBpm(10)).toBe(20);
    expect(clampBpm(999)).toBe(400);
    expect(clampBpm(92.4)).toBe(92);
  });

  it("prefers manual bpm over detected average", () => {
    const { globalBpm, detectedBpm } = resolveGlobalBpm([120, 60], 90);
    expect(detectedBpm).toBe(90);
    expect(globalBpm).toBe(90);
  });

  it("rescales beats when overriding tempo", () => {
    const events: NormalizedMidiEvent[] = [
      { note: 60, startBeat: 4, duration: 1, velocity: 80, channel: 0 },
    ];
    const rescaled = rescaleEventsToBpm(events, 120, 60);
    expect(rescaled[0]!.startBeat).toBe(8);
    expect(rescaled[0]!.duration).toBe(2);
  });
});
