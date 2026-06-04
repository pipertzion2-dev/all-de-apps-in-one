import { describe, expect, it } from "vitest";
import {
  MEEND_PREVIEW_STEM_NAME,
  buildMeendLeadPlayback,
  pickMeendLeadStem,
} from "./meend-showcase-stem";

describe("meend lead stem", () => {
  it("picks melody role over harmony", () => {
    const lead = pickMeendLeadStem([
      {
        name: "h1",
        role: "harmony",
        instrumentHint: "piano",
        midiEvents: Array.from({ length: 20 }, (_, i) => ({
          note: 60 + i,
          velocity: 80,
          startBeat: i,
          duration: 0.25,
        })),
      },
      {
        name: "m1",
        role: "melody",
        instrumentHint: "sitar",
        midiEvents: [
          { note: 60, velocity: 90, startBeat: 0, duration: 0.5 },
          { note: 64, velocity: 90, startBeat: 1, duration: 0.5 },
        ],
      },
    ]);
    expect(lead?.name).toBe("m1");
  });

  it("builds lead playback with multiple notes (no merge collapse)", () => {
    const playback = buildMeendLeadPlayback([
      {
        name: "Voice 1",
        role: "melody",
        instrumentHint: "piano",
        midiEvents: [
          { note: 60, velocity: 90, startBeat: 0, duration: 0.5 },
          { note: 64, velocity: 90, startBeat: 2, duration: 0.5 },
          { note: 67, velocity: 90, startBeat: 4, duration: 0.5 },
        ],
      },
    ]);
    expect(playback?.name).toBe(MEEND_PREVIEW_STEM_NAME);
    expect(playback!.midiEvents.length).toBe(3);
  });
});
