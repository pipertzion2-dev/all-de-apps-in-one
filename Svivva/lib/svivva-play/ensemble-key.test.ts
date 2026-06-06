import { describe, expect, it } from "vitest";
import { composeOrchestralEnsemble, voicePartsToOrchestralStems } from "./orchestral-compose";
import { resolveEnsembleSessionChords } from "./ensemble-harmony";
import {
  constrainEnsembleStemsToScale,
  ensembleCompositionScaleName,
  resolveCompositionScale,
} from "./scale-key-guard";
import { applyMeendToOrchestralMelodyStems } from "./generate-helpers";

describe("ensemble major key lock", () => {
  it("uses diatonic major timeline when user sets A major", () => {
    const chords = resolveEnsembleSessionChords(
      "A minor",
      [{ t0: 0, t1: 8, symbol: "Am", confidence: 80, pitchClasses: [9, 0, 4] }],
      32,
      120,
      "A major",
    );
    const { scaleInfo } = resolveCompositionScale(
      "A major",
      ensembleCompositionScaleName("A major", "A major"),
    );
    expect(scaleInfo.isMinor).toBe(false);
    for (const c of chords) {
      expect(c.symbol).not.toMatch(/^Am$/);
      for (const pc of c.pitchClasses) {
        expect(scaleInfo.scalePcs.has(pc)).toBe(true);
      }
    }
  });

  it("orchestral compose stays in A major pitch classes", () => {
    const composeKey = "A major";
    const chords = resolveEnsembleSessionChords(composeKey, [], 16, 120, composeKey);
    const scaleName = ensembleCompositionScaleName(composeKey, composeKey);
    const { resolution: scale, scaleInfo } = resolveCompositionScale(composeKey, scaleName);
    const voices = composeOrchestralEnsemble({
      durationSec: 16,
      bpm: 120,
      scale,
      seed: 42,
      chords,
    });
    let stems = voicePartsToOrchestralStems(voices);
    stems = constrainEnsembleStemsToScale(stems, scaleInfo, 120);
    const pitchedPcs = stems
      .filter((s) => s.role !== "percussion")
      .flatMap((s) => s.midiEvents.map((e) => ((e.note % 12) + 12) % 12));
    for (const pc of pitchedPcs) {
      expect(scaleInfo.scalePcs.has(pc)).toBe(true);
    }
  });

  it("applies meend to six lyrical orchestral stems", () => {
    const { resolution: scale } = resolveCompositionScale("A major", "major");
    const voices = composeOrchestralEnsemble({
      durationSec: 8,
      bpm: 120,
      scale,
      seed: 1,
      chords: resolveEnsembleSessionChords("A major", [], 8, 120, "A major"),
    });
    const stems = applyMeendToOrchestralMelodyStems(voicePartsToOrchestralStems(voices));
    const meendStems = stems.filter((s) => s.expression?.meend);
    expect(meendStems.length).toBeGreaterThanOrEqual(6);
  });
});
