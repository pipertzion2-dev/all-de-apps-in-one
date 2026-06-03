import { describe, expect, it } from "vitest";
import { stemPackHasMidiContent } from "./midi-stems-zip";

describe("stemPackHasMidiContent", () => {
  it("is false when stems and melodyne are empty", () => {
    expect(stemPackHasMidiContent({ stems: [{ name: "x", midiEvents: [] }] })).toBe(false);
  });

  it("is true when a stem has normalized MIDI", () => {
    expect(
      stemPackHasMidiContent({
        stems: [
          { name: "Melody", midiEvents: [{ note: 60, velocity: 80, startBeat: 0, duration: 1 }] },
        ],
      }),
    ).toBe(true);
  });

  it("is true when melodyne notes are present", () => {
    expect(
      stemPackHasMidiContent({
        stems: [],
        melodyneNotes: [{ midi: 60, velocity: 80, startSec: 0, endSec: 0.5, cents: 0 }],
      }),
    ).toBe(true);
  });
});
