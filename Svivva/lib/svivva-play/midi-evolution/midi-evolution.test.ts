import { describe, expect, it } from "vitest";
import { buildMotifGenealogy, pickMotifFamily } from "./motif-genealogy";
import { transformComposition } from "./transform-engine";
import { notesToMidiEvents } from "./note-bridge";
import { repitchPreservingPhrase } from "./rhythmic-dna";
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

describe("motif genealogy", () => {
  it("clusters interval n-grams across tracks", () => {
    const eventsA = notesToMidiEvents(makeNotes([60, 62, 64, 65]), 120);
    const eventsB = notesToMidiEvents(makeNotes([60, 62, 64, 67]), 120);
    const tracks = [
      {
        id: "a",
        filename: "a.mid",
        bpm: 120,
        durationSec: 2,
        events: eventsA,
        role: "melody" as const,
      },
      {
        id: "b",
        filename: "b.mid",
        bpm: 120,
        durationSec: 2,
        events: eventsB,
        role: "melody" as const,
      },
    ];
    const { motifs, genealogy } = buildMotifGenealogy(tracks, []);
    expect(motifs.length).toBeGreaterThan(0);
    expect(motifs[0]?.kind).toBe("primary");
    const family = pickMotifFamily(motifs);
    expect(family.length).toBeGreaterThan(0);
    if (genealogy.length) {
      expect(genealogy[0]?.parentId).toBe(motifs[0]?.id);
    }
  });
});

describe("phrase preservation", () => {
  it("keeps velocity and timing when repitching", () => {
    const events = notesToMidiEvents(makeNotes([60, 62, 64]), 120);
    events[0]!.velocity = 95;
    events[1]!.startBeat = 1.25;
    const repitched = events.map((e) => ({ ...e, note: e.note + 5 }));
    const out = repitchPreservingPhrase(events, repitched);
    expect(out[0]!.velocity).toBe(95);
    expect(out[1]!.startBeat).toBe(1.25);
    expect(out[0]!.note).toBe(65);
  });
});

describe("transform composition", () => {
  it("preserves melody velocity and phrasing", () => {
    const events = notesToMidiEvents(makeNotes([67, 69, 71, 74]), 120);
    events.forEach((e, i) => {
      e.velocity = 70 + i * 5;
      e.startBeat = i * 0.55;
    });
    const memory = {
      version: 1 as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceFiles: [{ id: "t1", filename: "seed.mid", bpm: 120, durationSec: 4 }],
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
      generationCount: 0,
    };
    const { part } = transformComposition(
      events,
      memory,
      { prompt: "glasper cinematic", preset: "glasper", preservePhraseExactly: true },
      "seed.mid",
    );
    const melody = part.melodyEvents;
    expect(melody.length).toBe(events.length);
    for (let i = 0; i < melody.length; i++) {
      expect(melody[i]!.velocity).toBe(events[i]!.velocity);
      expect(melody[i]!.startBeat).toBe(events[i]!.startBeat);
      expect(melody[i]!.duration).toBe(events[i]!.duration);
    }
  });

  it("produces labeled generation with stems", () => {
    const events = notesToMidiEvents(makeNotes([48, 52, 55, 60, 62, 64, 67]), 120);
    const memory = {
      version: 1 as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceFiles: [{ id: "t1", filename: "seed.mid", bpm: 120, durationSec: 4 }],
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
      generationCount: 0,
    };
    const { part, memory: updated } = transformComposition(
      events,
      memory,
      { prompt: "glasper cinematic", preset: "glasper" },
      "seed.mid",
    );
    expect(part.generationNumber).toBe(1);
    expect(part.filename).toMatch(/Glasper_A\.mid$/);
    expect(part.bassEvents.length).toBeGreaterThan(0);
    expect(part.harmonyEvents.length).toBeGreaterThan(0);
    expect(updated.generationCount).toBe(1);
  });
});
