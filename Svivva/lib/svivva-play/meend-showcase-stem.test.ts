import { describe, expect, it } from "vitest";
import {
  MEEND_PREVIEW_STEM_NAME,
  appendMeendShowcaseForPreview,
  mergeMeendShowcaseEvents,
} from "./meend-showcase-stem";

describe("meend showcase stem", () => {
  it("merges overlapping voices to one legato line", () => {
    const merged = mergeMeendShowcaseEvents([
      {
        name: "v1",
        role: "melody",
        instrumentHint: "piano",
        midiEvents: [
          { note: 60, velocity: 80, startBeat: 0, duration: 0.25 },
          { note: 64, velocity: 80, startBeat: 1, duration: 0.25 },
        ],
      },
      {
        name: "v2",
        role: "harmony",
        instrumentHint: "piano",
        midiEvents: [{ note: 67, velocity: 70, startBeat: 0, duration: 0.25 }],
      },
    ]);
    expect(merged.length).toBeGreaterThanOrEqual(2);
    expect(merged[0]!.duration).toBeGreaterThanOrEqual(1.15);
  });

  it("appends a preview stem and mutes the rest", () => {
    const out = appendMeendShowcaseForPreview([
      {
        name: "Voice 1",
        role: "melody",
        instrumentHint: "piano",
        midiEvents: [{ note: 60, velocity: 90, startBeat: 0, duration: 0.5 }],
        muted: false,
        soloed: false,
        pan: 0,
        gainDb: 0,
      },
    ]);
    const showcase = out.find((s) => s.name === MEEND_PREVIEW_STEM_NAME);
    expect(showcase).toBeDefined();
    expect(showcase!.muted).toBe(false);
    expect(out.filter((s) => s.muted).length).toBe(1);
  });
});
