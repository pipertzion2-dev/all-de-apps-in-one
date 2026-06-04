import { describe, expect, it } from "vitest";
import {
  meendPitchbendForEvents,
  prepareMeendLegatoMidiEvents,
  semitonesToMidiPitchWheel,
} from "./meend-midi";

describe("meend MIDI (V-1 style)", () => {
  it("ties monophonic notes legato for sustained bends", () => {
    const legato = prepareMeendLegatoMidiEvents([
      { note: 60, startBeat: 0, duration: 0.25 },
      { note: 64, startBeat: 1, duration: 0.25 },
    ]);
    expect(legato[0]!.duration).toBe(1);
  });

  it("adds inter-note pitch bends between swaras", () => {
    const bends = meendPitchbendForEvents(
      [
        { note: 60, startBeat: 0, duration: 1 },
        { note: 67, startBeat: 1, duration: 1 },
      ],
      { interNote: true },
    );
    const midGlide = bends.filter((b) => b.beat > 0.4 && b.beat < 1 && b.value !== 0);
    expect(midGlide.length).toBeGreaterThan(3);
    expect(Math.max(...midGlide.map((b) => Math.abs(b.value)))).toBeGreaterThan(500);
  });

  it("maps semitones to wheel for 12-st bend range", () => {
    expect(semitonesToMidiPitchWheel(6)).toBeGreaterThan(4000);
    expect(semitonesToMidiPitchWheel(12)).toBe(8191);
  });
});
