import { describe, expect, it } from "vitest";
import { evolutionExportFilename } from "./per-file-transform";
import { buildEvolutionExportPack } from "./export-pack";
import { buildPerFileOutputs } from "./per-file-export";
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

describe("evolution export filenames", () => {
  it("produces DAW-friendly names with section name, stem, bpm, and key", () => {
    expect(evolutionExportFilename("Bass Line.mid", "J", undefined, 120, "Cm")).toBe(
      "Sec-J_Revelation_Bass-Line_120bpm_Cm.mid",
    );
    expect(evolutionExportFilename("parts/Lead.mid", "B", undefined, 92, "Eb")).toBe(
      "Sec-B_Shadow-Portal_Lead_92bpm_Eb.mid",
    );
    // Without optional bpm/key
    expect(evolutionExportFilename("Bass.mid", "G")).toBe("Sec-G_Glasper-Dimension_Bass.mid");
  });
});

describe("per-file export pack", () => {
  it("exports one midi per source file with matching names", () => {
    const eventsA = notesToMidiEvents(makeNotes([48, 52, 55]), 120);
    const eventsB = notesToMidiEvents(makeNotes([67, 69, 71]), 120);
    const tracks = [
      {
        id: "a",
        filename: "Bass.mid",
        bpm: 120,
        durationSec: 2,
        events: eventsA,
        role: "bass" as const,
      },
      {
        id: "b",
        filename: "Melody.mid",
        bpm: 120,
        durationSec: 2,
        events: eventsB,
        role: "melody" as const,
      },
    ];
    const memory = {
      version: 1 as const,
      createdAt: "",
      updatedAt: "",
      sourceFiles: tracks.map((t) => ({
        id: t.id,
        filename: t.filename,
        bpm: t.bpm,
        durationSec: t.durationSec,
      })),
      globalBpm: 120,
      key: "C",
      motifs: [],
      rhythms: [],
      harmonicCenters: [],
      bassPatterns: [],
      phraseRelationships: [],
      motifGenealogy: [],
      emotionalTrajectory: [],
      sectionHierarchy: [],
      generationCount: 1,
    };
    const options = {
      prompt: "glasper",
      preset: "glasper" as const,
      preservePhraseExactly: true,
      chordPalette: ["Cm11", "AbMaj9(#11)"],
      sectionId: "G" as const,
    };
    const fileOutputs = buildPerFileOutputs(tracks, memory, options, "G");
    expect(fileOutputs).toHaveLength(2);
    expect(fileOutputs[0]!.exportFilename).toBe("Sec-G_Glasper-Dimension_Bass_120bpm_C.mid");
    expect(fileOutputs[1]!.exportFilename).toBe("Sec-G_Glasper-Dimension_Melody_120bpm_C.mid");
    expect(fileOutputs[0]!.transformedEvents).toHaveLength(eventsA.length);
    expect(fileOutputs[1]!.transformedEvents.map((e) => e.note)).not.toEqual(
      eventsB.map((e) => e.note),
    );
    for (let i = 0; i < eventsA.length; i++) {
      expect(fileOutputs[0]!.transformedEvents[i]!.startBeat).toBe(eventsA[i]!.startBeat);
      expect(fileOutputs[0]!.transformedEvents[i]!.duration).toBe(eventsA[i]!.duration);
      expect(fileOutputs[0]!.transformedEvents[i]!.velocity).toBe(eventsA[i]!.velocity);
    }

    const part = {
      id: "gen_1",
      label: "Section G",
      generationNumber: 1,
      preset: "glasper" as const,
      prompt: "",
      events: [],
      bassEvents: [],
      harmonyEvents: [],
      melodyEvents: [],
      filename: "x.mid",
      sectionId: "G" as const,
      sectionTitle: "Glasper Dimension",
      fileOutputs,
    };
    const pack = buildEvolutionExportPack(
      memory,
      part,
      {
        generatedAt: "",
        prompt: "",
        preset: "glasper",
        generationNumber: 1,
        originalHarmonicCenters: [],
        newHarmonicCenters: [],
        motifsTransformed: [],
        voiceLeadingStrategy: "rootless",
        bassStrategy: "melodic",
        ornamentationApplied: [],
      },
      tracks,
    );

    expect(pack.midiFiles).toHaveLength(2);
    expect(pack.midiFiles.map((f) => f.filename)).toEqual([
      "Sec-G_Glasper-Dimension_Bass_120bpm_C.mid",
      "Sec-G_Glasper-Dimension_Melody_120bpm_C.mid",
    ]);
    expect(pack.midiFiles.every((f) => f.data.length > 20)).toBe(true);
  });
});
