import { parseRootFromKeyLabel } from "../analysis-utils";
import { chordsFromPolyphonicNotesAgnostic } from "../chords-from-notes";
import { parseMidiFile } from "../midi-file-parse";
import { resolveHarmonicKey } from "../resolve-harmonic-key";
import type { CompositionMemory, HarmonicCenter, ImportedMidiTrack, PhraseRecord } from "./types";
import { inferTrackRole, midiEventsToNotes, notesToMidiEvents } from "./note-bridge";
import { buildMotifGenealogy } from "./motif-genealogy";
import { averageDetectedBpm, resolveInputBpm } from "./bpm-override";

function slugId(name: string, index: number): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase();
  return `${base || "midi"}_${index}`;
}

function segmentPhrases(track: ImportedMidiTrack): PhraseRecord[] {
  const gapThreshold = (60 / track.bpm) * 0.75;
  const sorted = [...track.events].sort((a, b) => a.startBeat - b.startBeat);
  const phrases: PhraseRecord[] = [];
  let bucket: typeof sorted = [];
  let phraseStart = sorted[0]?.startBeat ?? 0;

  const flush = (endBeat: number, idx: number) => {
    if (!bucket.length) return;
    const meanReg = bucket.reduce((s, e) => s + e.note, 0) / bucket.length;
    phrases.push({
      id: `${track.id}_phrase_${idx}`,
      sourceFileId: track.id,
      startBeat: phraseStart,
      endBeat,
      motifIds: [],
      tension: meanReg > 72 ? 0.7 : 0.4,
      release: meanReg < 60 ? 0.65 : 0.35,
      registerMean: meanReg,
    });
    bucket = [];
  };

  let lastEnd = phraseStart;
  let idx = 0;
  for (const e of sorted) {
    const gapBeats = e.startBeat - lastEnd;
    if (bucket.length && gapBeats > gapThreshold) {
      flush(lastEnd, idx++);
      phraseStart = e.startBeat;
    }
    bucket.push(e);
    lastEnd = e.startBeat + e.duration;
  }
  flush(lastEnd, idx);
  return phrases;
}

function harmonicCentersFromTracks(tracks: ImportedMidiTrack[], bpm: number): HarmonicCenter[] {
  const allNotes = tracks.flatMap((t) => midiEventsToNotes(t.events, t.bpm));
  const durationSec = allNotes.reduce((m, n) => Math.max(m, n.endSec), 0);
  const chords = chordsFromPolyphonicNotesAgnostic(allNotes, bpm, durationSec, 55);
  const bps = bpm / 60;
  return chords.map((c) => ({
    beat: c.t0 * bps,
    symbol: c.symbol,
    pitchClasses: [],
    confidence: c.confidence ?? 60,
  }));
}

/** Build a global composition graph from multiple MIDI files (not independent analysis). */
export function analyzeGlobalComposition(
  files: { filename: string; buffer: ArrayBuffer }[],
  options?: { manualBpm?: number | null },
): { tracks: ImportedMidiTrack[]; memory: CompositionMemory; phrases: PhraseRecord[] } {
  const inputBpm = resolveInputBpm(options?.manualBpm);

  const parsedFiles = files.map((f) => ({
    filename: f.filename,
    parsed: parseMidiFile(f.buffer),
  }));

  const detectedBpm = averageDetectedBpm(parsedFiles.map(({ parsed }) => parsed.detectedBpm));

  const tracks: ImportedMidiTrack[] = parsedFiles.map(({ filename, parsed }, i) => {
    const events = parsed.midiEvents.length
      ? parsed.midiEvents
      : notesToMidiEvents(parsed.notes, parsed.bpm);
    const id = slugId(filename, i);
    return {
      id,
      filename,
      bpm: inputBpm,
      durationSec: parsed.durationSec,
      events,
      role: inferTrackRole(events),
    };
  });

  const globalBpm = inputBpm;

  const allNotes = tracks.flatMap((t) => midiEventsToNotes(t.events, t.bpm));
  const keyGuess = resolveHarmonicKey({
    midiNotes: allNotes,
    audioKey: "",
    audioConfidence: 0,
    bpm: globalBpm,
    keyHint: null,
  });

  const phrases = tracks.flatMap(segmentPhrases);
  const harmonicCenters = harmonicCentersFromTracks(tracks, globalBpm);
  const { motifs, genealogy, rhythms, bassPatterns } = buildMotifGenealogy(tracks, phrases);

  for (const phrase of phrases) {
    phrase.motifIds = motifs
      .filter((m) => m.sourceFileIds.includes(phrase.sourceFileId) && m.occurrences > 0)
      .slice(0, 3)
      .map((m) => m.id);
  }

  const phraseRelationships = phrases.slice(0, -1).map((p, i) => {
    const next = phrases[i + 1]!;
    return {
      fromPhraseId: p.id,
      toPhraseId: next.id,
      relation: next.startBeat - p.endBeat < 1 ? "continuation" : "section_shift",
    };
  });

  const now = new Date().toISOString();
  const memory: CompositionMemory = {
    version: 1,
    createdAt: now,
    updatedAt: now,
    sourceFiles: tracks.map((t) => ({
      id: t.id,
      filename: t.filename,
      bpm: t.bpm,
      durationSec: t.durationSec,
    })),
    globalBpm,
    detectedBpm,
    manualBpm: inputBpm,
    key: keyGuess.key,
    motifs,
    rhythms,
    harmonicCenters,
    bassPatterns,
    phraseRelationships,
    motifGenealogy: genealogy,
    emotionalTrajectory: ["introductory", "developing"],
    sectionHierarchy: phrases.map((p, i) => ({
      id: p.id,
      label: `Section ${String.fromCharCode(65 + (i % 26))}`,
      startBeat: p.startBeat,
      endBeat: p.endBeat,
    })),
    generationCount: 0,
  };

  return { tracks, memory, phrases };
}

export function mergeTracksToEvents(tracks: ImportedMidiTrack[]): ImportedMidiTrack["events"] {
  return tracks
    .flatMap((t) => t.events)
    .sort((a, b) => a.startBeat - b.startBeat || a.note - b.note);
}

export { parseRootFromKeyLabel };
