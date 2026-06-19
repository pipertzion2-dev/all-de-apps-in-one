import { describe, expect, it } from "vitest";
import { analyzeGlobalComposition } from "./analyze-composition";
import { buildMidiFileBytes } from "../midi-export";
import { notesToMidiEvents } from "./note-bridge";
import type { TranscribedNote } from "../audio-transcription";

function makeNotes(midiSeq: number[]): TranscribedNote[] {
  return midiSeq.map((midi, i) => ({
    midi,
    startSec: i * 0.5,
    endSec: i * 0.5 + 0.4,
    velocity: 80,
    cents: 0,
  }));
}

describe("analyzeGlobalComposition input bpm", () => {
  it("keeps MIDI beat positions stable while applying user BPM metadata", () => {
    const events = notesToMidiEvents(makeNotes([60, 62, 64]), 120);
    const midiBytes = buildMidiFileBytes([{ name: "test", midiEvents: events }], 120);
    const buffer = midiBytes.buffer.slice(
      midiBytes.byteOffset,
      midiBytes.byteOffset + midiBytes.byteLength,
    );

    const at120 = analyzeGlobalComposition([{ filename: "test.mid", buffer }], {
      manualBpm: 120,
    });
    const at96 = analyzeGlobalComposition([{ filename: "test.mid", buffer }], {
      manualBpm: 96,
    });

    expect(at120.memory.globalBpm).toBe(120);
    expect(at96.memory.globalBpm).toBe(96);
    expect(at96.tracks[0]!.events[1]!.startBeat).toBe(at120.tracks[0]!.events[1]!.startBeat);
    expect(at96.tracks[0]!.events[1]!.duration).toBe(at120.tracks[0]!.events[1]!.duration);
  });
});
