import { describe, expect, it } from "vitest";
import { resolvePatternCellLengths } from "./pattern-length";
import {
  composeOrchestralEnsemble,
  composeBjorkLinsOrchestral,
  BJORK_LINS_ORCHESTRAL_PRESET,
  CINEMATIC_ORCHESTRA_PRESET,
  HYPERREAL_ORCHESTRAL_PRESET,
  ABLETON_ORCHESTRAL_STEMS,
  ENSEMBLE_STEM_COUNT,
  ENSEMBLE_ORCHESTRAL_PRESETS,
  isEnsembleOrchestralPreset,
  tempoFeelForOrchestra,
} from "./orchestral-compose";
import { resolveScale } from "./reich-engine";

describe("resolvePatternCellLengths", () => {
  it("scales cell lengths for extended and long modes", () => {
    expect(resolvePatternCellLengths("standard").cpCellLen).toBe(12);
    expect(resolvePatternCellLengths("extended").hkCellLen).toBe(48);
    expect(resolvePatternCellLengths("long").cpCellLen).toBe(36);
  });
});

describe("tempoFeelForOrchestra", () => {
  it("slows grid at 134 BPM for elegant phrasing", () => {
    const feel = tempoFeelForOrchestra(134);
    expect(feel.themeStepBeats).toBeGreaterThanOrEqual(1);
    expect(feel.themeDurBeats).toBeGreaterThanOrEqual(2);
  });
});

describe("composeOrchestralEnsemble", () => {
  it("exports three ensemble presets only", () => {
    expect(ENSEMBLE_ORCHESTRAL_PRESETS).toEqual([
      BJORK_LINS_ORCHESTRAL_PRESET,
      HYPERREAL_ORCHESTRAL_PRESET,
      CINEMATIC_ORCHESTRA_PRESET,
    ]);
    expect(isEnsembleOrchestralPreset("60s_soul")).toBe(false);
    expect(isEnsembleOrchestralPreset(BJORK_LINS_ORCHESTRAL_PRESET)).toBe(true);
  });

  it("generates distinct pitches and slower notes at 134 BPM", () => {
    const scale = resolveScale("major", "A");
    const voices = composeOrchestralEnsemble({
      durationSec: 16,
      bpm: 134,
      scale,
      seed: 7,
      patternLength: "extended",
      preset: BJORK_LINS_ORCHESTRAL_PRESET,
    });
    const v1 = voices.find((v) => v.name === "Violin 1")!;
    const v2 = voices.find((v) => v.name === "Violin 2")!;
    expect(v1.notes.length).toBeGreaterThan(3);
    expect(v1.notes.length).toBeLessThan(40);
    expect(v1.notes.every((n) => n.duration >= 0.85)).toBe(true);
    expect(new Set(v1.notes.map((n) => n.note)).size).toBeGreaterThan(2);
    expect(v2.notes.map((n) => n.note).join(",")).not.toBe(
      v1.notes.map((n) => n.note).join(","),
    );
  });

  it("includes timpani and separate percussion stems", () => {
    const scale = resolveScale("major", "D");
    const voices = composeBjorkLinsOrchestral({
      durationSec: 12,
      bpm: 100,
      scale,
      seed: 3,
    });
    expect(voices.length).toBe(ENSEMBLE_STEM_COUNT);
    expect(ABLETON_ORCHESTRAL_STEMS.some((s) => s.name === "Timpani")).toBe(true);
    expect(ABLETON_ORCHESTRAL_STEMS.some((s) => s.name === "Suspended Cymbal")).toBe(true);
    expect(ABLETON_ORCHESTRAL_STEMS.some((s) => s.name === "Triangle")).toBe(true);
    expect(ABLETON_ORCHESTRAL_STEMS.some((s) => s.name === "Cabasa")).toBe(true);
  });

  it("keeps each voice in idiomatic register and guarantees minimum notes", () => {
    const scale = resolveScale("major", "A");
    const voices = composeOrchestralEnsemble({
      durationSec: 16,
      bpm: 134,
      scale,
      seed: 11,
      preset: CINEMATIC_ORCHESTRA_PRESET,
    });
    const v1 = voices.find((v) => v.name === "Violin 1")!;
    const bass = voices.find((v) => v.name === "Contrabass")!;
    const flute = voices.find((v) => v.name === "Flute")!;
    expect(v1.notes.every((n) => n.note >= 55 && n.note <= 67)).toBe(true);
    expect(bass.notes.every((n) => n.note >= 28 && n.note <= 45)).toBe(true);
    expect(flute.notes.every((n) => n.note >= 58 && n.note <= 68)).toBe(true);
    expect(flute.notes.length).toBeGreaterThanOrEqual(3);
    expect(voices.find((v) => v.name === "Oboe")!.notes.length).toBeGreaterThanOrEqual(3);
    expect(voices.find((v) => v.name === "Timpani")!.notes.length).toBeGreaterThanOrEqual(2);
  });

  it("snaps all pitched voices to the composition scale", () => {
    const scale = resolveScale("major", "A");
    const voices = composeOrchestralEnsemble({
      durationSec: 16,
      bpm: 100,
      scale,
      seed: 13,
      preset: BJORK_LINS_ORCHESTRAL_PRESET,
    });
    const scalePcs = new Set(scale.pitchClasses);
    for (const voice of voices) {
      if (
        voice.name === "Timpani" ||
        voice.name === "Suspended Cymbal" ||
        voice.name === "Triangle" ||
        voice.name === "Cabasa"
      ) {
        continue;
      }
      for (const n of voice.notes) {
        const pc = ((n.note % 12) + 12) % 12;
        expect(scalePcs.has(pc)).toBe(true);
      }
    }
  });
});
