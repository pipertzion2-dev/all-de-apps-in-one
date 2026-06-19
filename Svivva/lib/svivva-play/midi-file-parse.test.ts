import { describe, expect, it } from "vitest";
import { buildMidiFile, buildMidiFileBytes } from "./midi-export";
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

  it("preserves multi-track structure, channels, PPQ, and timeline length", () => {
    const source = buildMidiFileBytes(
      [
        {
          name: "Bass",
          midiEvents: [{ note: 36, velocity: 100, startBeat: 0, duration: 2, channel: 1 }],
        },
        {
          name: "Keys",
          midiEvents: [{ note: 60, velocity: 90, startBeat: 0, duration: 2, channel: 4 }],
        },
      ],
      120,
      { ticksPerBeat: 960 },
    );

    const parsed = parseMidiFile(
      source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
    );

    expect(parsed.ticksPerBeat).toBe(960);
    expect(parsed.layers.filter((l) => l.events.length > 0)).toHaveLength(2);
    expect(parsed.totalEndBeat).toBeGreaterThanOrEqual(2);
    expect(parsed.midiEvents).toHaveLength(2);
    expect(parsed.midiEvents.map((e) => e.channel).sort()).toEqual([1, 4]);

    const roundTrip = buildMidiFileBytes(
      parsed.layers.map((layer) => ({ name: layer.name, midiEvents: layer.events })),
      120,
      { ticksPerBeat: parsed.ticksPerBeat },
    );

    const reparsed = parseMidiFile(
      roundTrip.buffer.slice(roundTrip.byteOffset, roundTrip.byteOffset + roundTrip.byteLength),
    );

    expect(reparsed.ticksPerBeat).toBe(960);
    expect(reparsed.layers.filter((l) => l.events.length > 0)).toHaveLength(2);
    expect(reparsed.midiEvents.map((e) => e.channel).sort()).toEqual([1, 4]);
  });
});
