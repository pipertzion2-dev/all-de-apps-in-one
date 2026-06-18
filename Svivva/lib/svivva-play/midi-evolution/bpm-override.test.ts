import { describe, expect, it } from "vitest";
import {
  averageDetectedBpm,
  clampBpm,
  rescaleEventsToBpm,
  resolveInputBpm,
} from "./bpm-override";
import type { NormalizedMidiEvent } from "../midi-normalize";

describe("bpm override", () => {
  it("clamps manual bpm to safe range", () => {
    expect(clampBpm(10)).toBe(20);
    expect(clampBpm(999)).toBe(400);
    expect(clampBpm(92.4)).toBe(92);
  });

  it("always resolves input bpm (defaults when missing)", () => {
    expect(resolveInputBpm(undefined)).toBe(120);
    expect(resolveInputBpm(null)).toBe(120);
    expect(resolveInputBpm(88)).toBe(88);
  });

  it("averages file tempo markers for reference only", () => {
    expect(averageDetectedBpm([120, 60])).toBe(90);
  });

  it("rescales beats while preserving seconds", () => {
    const events: NormalizedMidiEvent[] = [
      { note: 60, startBeat: 4, duration: 1, velocity: 80, channel: 0 },
    ];
    const rescaled = rescaleEventsToBpm(events, 120, 60);
    expect(rescaled[0]!.startBeat).toBe(2);
    expect(rescaled[0]!.duration).toBe(0.5);
  });
});
