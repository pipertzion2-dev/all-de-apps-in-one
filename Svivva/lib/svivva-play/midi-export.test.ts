import { describe, expect, it } from "vitest";
import { buildMidiFile } from "./midi-export";

describe("buildMidiFile meend", () => {
  it("embeds pitch bend events when expression.meend is set", () => {
    const buf = buildMidiFile(
      [
        {
          name: "Lead",
          midiEvents: [{ note: 60, velocity: 90, startBeat: 0, duration: 1 }],
          expression: { meend: true },
        },
      ],
      120,
    );
    const plain = buildMidiFile(
      [{ name: "Lead", midiEvents: [{ note: 60, velocity: 90, startBeat: 0, duration: 1 }] }],
      120,
    );
    expect(buf.length).toBeGreaterThan(plain.length);
  });
});
