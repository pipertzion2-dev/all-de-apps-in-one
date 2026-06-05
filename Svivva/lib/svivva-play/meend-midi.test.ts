import { describe, expect, it } from "vitest";
import {
  meendPitchbendForEvents,
  prepareMeendLegatoMidiEvents,
  semitonesToMidiPitchWheel,
  V1_MEEND_TAIL_START,
} from "./meend-midi";

describe("meend MIDI (V-1 style)", () => {
  it("ties monophonic notes legato for sustained bends", () => {
    const legato = prepareMeendLegatoMidiEvents([
      { note: 60, velocity: 90, startBeat: 0, duration: 0.25 },
      { note: 64, velocity: 90, startBeat: 1, duration: 0.25 },
    ]);
    expect(legato[0]!.duration).toBe(1);
  });

  it("adds tail meend bends after 80% of the note (V-1 INDIAN)", () => {
    const bends = meendPitchbendForEvents(
      [
        { note: 60, velocity: 90, startBeat: 0, duration: 1 },
        { note: 67, velocity: 90, startBeat: 1, duration: 1 },
      ],
      { interNote: true },
    );
    const tailGlide = bends.filter(
      (b) => b.beat >= V1_MEEND_TAIL_START - 0.01 && b.beat < 1 && b.value !== 0,
    );
    expect(tailGlide.length).toBeGreaterThan(3);
    expect(Math.max(...tailGlide.map((b) => Math.abs(b.value)))).toBeGreaterThan(500);
    const early = bends.filter((b) => b.beat < 0.35 && b.value !== 0);
    expect(early.length).toBe(0);
  });

  it("maps semitones to wheel for 12-st bend range", () => {
    expect(semitonesToMidiPitchWheel(6)).toBeGreaterThan(4000);
    expect(semitonesToMidiPitchWheel(12)).toBe(8191);
  });
});
