import { describe, expect, it } from "vitest";
import type { TranscribedNote } from "./audio-transcription";
import {
  alignMidiToAudio,
  anchorMelodyneToAudioFileStart,
  analyzeMidiTiming,
  downbeatOffsetGuess,
  normalizeMidiToBarOne,
} from "./midi-alignment";

function note(startSec: number, dur = 0.2, midi = 60): TranscribedNote {
  return { midi, startSec, endSec: startSec + dur, velocity: 80, cents: 0 };
}

describe("midi alignment", () => {
  it("detects bar-aligned pre-roll in Melodyne exports", () => {
    const bpm = 120;
    const barSec = 2;
    const notes = [note(barSec * 4), note(barSec * 4 + 0.5, 0.3, 64)];
    const timing = analyzeMidiTiming(notes, bpm);
    expect(timing.preRollBars).toBe(4);
    expect(timing.normalizeToBarOneSec).toBe(-barSec * 4);
    const { notes: trimmed } = normalizeMidiToBarOne(notes, bpm);
    expect(trimmed[0]!.startSec).toBeCloseTo(0, 2);
  });

  it("aligns MIDI that starts late to audio on downbeat", () => {
    const bpm = 120;
    const barSec = 2;
    const audio = [note(0.1), note(0.6), note(1.1), note(2.1)];
    const midi = [note(barSec * 2), note(barSec * 2 + 0.5), note(barSec * 3)];
    const guess = downbeatOffsetGuess(audio, midi, bpm);
    expect(guess).toBeCloseTo(-barSec * 2, 1);
    const { offsetSec } = alignMidiToAudio(audio, midi, { bpm });
    expect(offsetSec).toBeCloseTo(-barSec * 2, 0);
  });

  it("anchors MIDI first hit to audio file start when audio begins near t=0", () => {
    const bpm = 120;
    const audio = [note(0.05), note(0.5), note(1)];
    const midi = [note(2.1), note(2.6), note(3.1)];
    const { notes, extraOffsetSec } = anchorMelodyneToAudioFileStart(audio, midi, bpm);
    expect(extraOffsetSec).toBeCloseTo(-2.1, 1);
    expect(notes[0]!.startSec).toBeCloseTo(0, 2);
  });

  it("aligns MIDI that starts early when audio has intro bars", () => {
    const bpm = 120;
    const barSec = 2;
    const audio = [note(barSec * 2), note(barSec * 2 + 0.5), note(barSec * 3)];
    const midi = [note(0), note(0.5), note(barSec)];
    const { offsetSec } = alignMidiToAudio(audio, midi, { bpm });
    expect(offsetSec).toBeCloseTo(barSec * 2, 0);
  });
});
