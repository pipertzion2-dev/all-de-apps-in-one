import { describe, expect, it } from "vitest";
import { buildMidiFile } from "./midi-export";
import { parseMidiFile } from "./midi-file-parse";

describe("parseMidiFile beat grid", () => {
  it("preserves MIDI tick beat positions independent of tempo", () => {
    const midi = buildMidiFile(
      [
        {
          name: "Lead",
          midiEvents: [
            { note: 60, velocity: 90, startBeat: 0, duration: 0.25 },
            { note: 64, velocity: 88, startBeat: 4, duration: 0.5 },
          ],
        },
      ],
      90,
    );

    const parsed = parseMidiFile(
      midi.buffer.slice(midi.byteOffset, midi.byteOffset + midi.byteLength),
    );

    expect(parsed.detectedBpm).toBe(90);
    expect(parsed.midiEvents).toHaveLength(2);
    expect(parsed.midiEvents[0]!.startBeat).toBe(0);
    expect(parsed.midiEvents[0]!.duration).toBe(0.25);
    expect(parsed.midiEvents[1]!.startBeat).toBe(4);
    expect(parsed.midiEvents[1]!.duration).toBe(0.5);
  });
});
