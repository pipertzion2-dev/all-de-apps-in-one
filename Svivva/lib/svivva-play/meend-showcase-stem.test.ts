import { describe, expect, it } from "vitest";
import {
  buildMeendAccentPlaybacks,
  buildMeendLeadPlayback,
  meendAccentStemName,
  pickMeendLeadStem,
  pickMeendVoices,
} from "./meend-showcase-stem";

describe("meend accent stems", () => {
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

  it("builds one accent per monophonic hocket voice", () => {
    const voices = pickMeendVoices([
      {
        name: "Voice 1",
        role: "melody",
        instrumentHint: "piano",
        midiEvents: [
          { note: 60, velocity: 90, startBeat: 0, duration: 0.5 },
          { note: 64, velocity: 90, startBeat: 2, duration: 0.5 },
        ],
      },
      {
        name: "Voice 2",
        role: "harmony",
        instrumentHint: "vibes",
        midiEvents: [
          { note: 67, velocity: 80, startBeat: 1, duration: 0.5 },
          { note: 72, velocity: 80, startBeat: 3, duration: 0.5 },
        ],
      },
    ]);
    expect(voices.length).toBe(2);

    const accents = buildMeendAccentPlaybacks(voices);
    expect(accents.length).toBe(2);
    expect(accents[0]!.name).toBe(meendAccentStemName("Voice 1"));
    expect(accents[1]!.name).toBe(meendAccentStemName("Voice 2"));
  });

  it("buildMeendLeadPlayback returns first accent", () => {
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
    expect(playback?.name).toBe(meendAccentStemName("Voice 1"));
    expect(playback!.midiEvents.length).toBe(3);
  });
});
