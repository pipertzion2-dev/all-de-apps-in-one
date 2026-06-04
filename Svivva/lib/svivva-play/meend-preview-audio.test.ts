import { describe, expect, it } from "vitest";
import { buildMeendLegatoTimeline, meendWheelToPreviewCents } from "./meend-preview-audio";

describe("meend preview audio", () => {
  it("maps wheel to 12-semitone preview range (Ableton parity)", () => {
    expect(meendWheelToPreviewCents(8191)).toBeCloseTo(1200, -1);
  });

  it("builds legato glide between consecutive notes", () => {
    const timeline = buildMeendLegatoTimeline(
      [
        { note: 60, velocity: 90, startBeat: 0, duration: 0.5 },
        { note: 64, velocity: 90, startBeat: 1, duration: 0.5 },
      ],
      [{ beat: 0.6, value: 7000 }],
      (b) => b * 0.5,
      (midi) => `N${midi}`,
    );
    expect(timeline.some((e) => e.type === "attack")).toBe(true);
    expect(timeline.some((e) => e.type === "glide")).toBe(true);
    expect(timeline.some((e) => e.type === "bend")).toBe(true);
    expect(timeline.some((e) => e.type === "release")).toBe(true);
  });
});
