import { describe, expect, it } from "vitest";
import { buildMidiFileBytes } from "./midi-export";
import { parseMidiFile } from "./midi-file-parse";
import { maxContentEndBeat, sessionTimelineStartBeat, shiftEventsByBeat } from "./midi-beat-align";
import type { NormalizedMidiEvent } from "./midi-normalize";

describe("midi beat alignment", () => {
  it("trims shared leading silence so the first note starts at tick 0", () => {
    const events: NormalizedMidiEvent[] = [
      { note: 60, velocity: 90, startBeat: 8, duration: 1 },
      { note: 64, velocity: 88, startBeat: 9, duration: 1 },
    ];
    const offset = sessionTimelineStartBeat([{ events }]);
    expect(offset).toBe(8);

    const trimmed = shiftEventsByBeat(events, offset);
    const bytes = buildMidiFileBytes([{ name: "Lead", midiEvents: trimmed }], 120);
    const parsed = parseMidiFile(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );

    expect(parsed.midiEvents[0]!.startBeat).toBe(0);
    expect(parsed.midiEvents[1]!.startBeat).toBe(1);
    expect(maxContentEndBeat(parsed.midiEvents)).toBe(2);
  });
});
