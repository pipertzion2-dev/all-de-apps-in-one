import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildLongFormSuiteZipBuffer } from "./export-pack";
import type { CompositionMemory, ImportedMidiTrack } from "./types";

function makeTrack(index: number): ImportedMidiTrack {
  const isBass = index === 0;
  return {
    id: `stem_${index}`,
    filename: isBass ? "808.mid" : `synth-${index}.mid`,
    bpm: 101,
    durationSec: 14,
    role: isBass ? "bass" : "melody",
    ticksPerBeat: 96,
    events: Array.from({ length: isBass ? 4 : 8 }, (_, i) => ({
      note: isBass ? 24 + (i % 3) : 60 + index + (i % 5),
      velocity: 80 + (i % 3),
      startBeat: i * 0.5,
      duration: i % 2 ? 0.25 : 0.5,
      channel: 0,
    })),
  };
}

function makeMemory(tracks: ImportedMidiTrack[]): CompositionMemory {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    sourceFiles: tracks.map((track) => ({
      id: track.id,
      filename: track.filename,
      bpm: 101,
      durationSec: track.durationSec,
    })),
    globalBpm: 101,
    detectedBpm: 120,
    manualBpm: 101,
    timelineStartBeat: 0,
    key: "G# major",
    motifs: [],
    rhythms: [],
    harmonicCenters: [
      { beat: 0, symbol: "D#maj7", pitchClasses: [], confidence: 95 },
      { beat: 4, symbol: "C#maj7", pitchClasses: [], confidence: 95 },
      { beat: 8, symbol: "G#maj7", pitchClasses: [], confidence: 95 },
      { beat: 12, symbol: "A#m7", pitchClasses: [], confidence: 95 },
    ],
    bassPatterns: [],
    phraseRelationships: [],
    motifGenealogy: [],
    emotionalTrajectory: [],
    sectionHierarchy: [],
    generationCount: 0,
  };
}

describe("long-form suite export", () => {
  it("exports 9 versions of every uploaded stem", async () => {
    const tracks = Array.from({ length: 10 }, (_, i) => makeTrack(i));
    const { zip, memory } = await buildLongFormSuiteZipBuffer(makeMemory(tracks), tracks);
    const parsed = await JSZip.loadAsync(zip);
    const midiNames = Object.keys(parsed.files).filter((name) => name.endsWith(".mid"));

    expect(memory.globalBpm).toBe(101);
    expect(memory.completedSections).toEqual(["B", "C", "D", "E", "F", "G", "H", "I", "J"]);
    expect(midiNames).toHaveLength(90);
    expect(midiNames.every((name) => /Sec-[B-J]/.test(name))).toBe(true);
  });
});
