import type { AudioTranscription, TranscribedNote } from "./audio-transcription";
import { transcribeAudioFile } from "./audio-transcription";
import { chordsFromPolyphonicNotes, mergeChordTimelines } from "./chords-from-notes";
import { parseKeyFromUserHint, normalizeKeyLabel } from "./analysis-utils";
import { resolveKeyWithMelodyne } from "./key-from-notes";
import {
  alignMidiToAudio,
  anchorMelodyneToAudioFileStart,
  applyOffsetToNotes,
  normalizeMidiToBarOne,
} from "./midi-alignment";
import { parseMidiFile } from "./midi-file-parse";

export type HarmonicSources = {
  audioTranscription: boolean;
  melodyneMidi: boolean;
};

export type HarmonicSession = AudioTranscription & {
  /** Monophonic pitch track from audio DSP. */
  audioNotes: TranscribedNote[];
  /** Harmonic / polyphonic notes from Melodyne MIDI export. */
  melodyneNotes: TranscribedNote[];
  melodyneRawNotes: TranscribedNote[];
  alignOffsetSec: number;
  alignScore: number;
  sources: HarmonicSources;
  harmonicKey?: string;
  harmonicKeyConfidence?: number;
  harmonicKeySource?: "midi" | "audio";
};

export function isAudioImportFile(file: File): boolean {
  return file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|aiff?)$/i.test(file.name);
}

export function isMelodyneImportFile(file: File): boolean {
  return (
    file.type === "audio/midi" || file.type === "audio/mid" || /\.(mid|midi)$/i.test(file.name)
  );
}

export function splitSessionFiles(files: FileList | File[]): {
  audio: File | null;
  melodyne: File | null;
  extras: File[];
} {
  let audio: File | null = null;
  let melodyne: File | null = null;
  const extras: File[] = [];
  for (const f of files) {
    if (!audio && isAudioImportFile(f)) audio = f;
    else if (!melodyne && isMelodyneImportFile(f)) melodyne = f;
    else extras.push(f);
  }
  return { audio, melodyne, extras };
}

function alignMelodyneTrack(
  audioNotes: TranscribedNote[],
  melodyneRaw: TranscribedNote[],
  bpm: number,
): { notes: TranscribedNote[]; alignOffsetSec: number; alignScore: number } {
  if (!melodyneRaw.length) {
    return { notes: [], alignOffsetSec: 0, alignScore: 0 };
  }
  if (!audioNotes.length) {
    const anchor = anchorMelodyneToAudioFileStart([], melodyneRaw, bpm);
    return { notes: anchor.notes, alignOffsetSec: anchor.extraOffsetSec, alignScore: 0 };
  }

  const align = alignMidiToAudio(audioNotes, melodyneRaw, { bpm });
  let aligned = applyOffsetToNotes(melodyneRaw, align.offsetSec);
  const anchor = anchorMelodyneToAudioFileStart(audioNotes, aligned, bpm);
  aligned = anchor.notes;
  return {
    notes: aligned,
    alignOffsetSec: Number((align.offsetSec + anchor.extraOffsetSec).toFixed(3)),
    alignScore: align.score,
  };
}

function emptyTranscription(durationSec = 0): HarmonicSession {
  return {
    notes: [],
    audioNotes: [],
    melodyneNotes: [],
    melodyneRawNotes: [],
    chords: [],
    waveformPeaks: [],
    durationSec,
    alignOffsetSec: 0,
    alignScore: 0,
    sources: { audioTranscription: false, melodyneMidi: false },
  };
}

/** Build one harmonic model from audio + optional Melodyne MIDI (parallel when both provided). */
export async function buildHarmonicSession(options: {
  audioFile: File;
  melodyneFile?: File | null;
  bpm: number;
  key: string;
  keyHint?: string;
}): Promise<HarmonicSession | null> {
  const { audioFile, melodyneFile, bpm, key, keyHint } = options;
  const hintKey = parseKeyFromUserHint(keyHint);

  const [audioTx, melodyneParsed] = await Promise.all([
    transcribeAudioFile(audioFile, bpm, key),
    melodyneFile
      ? melodyneFile.arrayBuffer().then((buf) => parseMidiFile(buf))
      : Promise.resolve(null),
  ]);

  if (!audioTx && !melodyneParsed?.notes.length) return null;

  const base = audioTx ?? emptyTranscription(melodyneParsed?.durationSec ?? 0);
  let melodyneRaw = melodyneParsed?.notes ?? [];
  if (melodyneRaw.length && bpm > 0) {
    melodyneRaw = normalizeMidiToBarOne(melodyneRaw, bpm).notes;
  }
  const audioNotes = base.notes;

  const alignedTrack = alignMelodyneTrack(audioNotes, melodyneRaw, bpm);
  let melodyneAligned = alignedTrack.notes;
  const alignOffsetSec = alignedTrack.alignOffsetSec;
  const alignScore = alignedTrack.alignScore;

  const keyResolved = melodyneAligned.length
    ? resolveKeyWithMelodyne(key, 70, melodyneAligned, bpm)
    : { key, confidence: 70, source: "audio" as const };
  let resolvedKey = keyResolved.key;
  if (hintKey) {
    resolvedKey = normalizeKeyLabel(hintKey);
  } else if (
    melodyneAligned.length > 0 &&
    keyResolved.source === "midi" &&
    normalizeKeyLabel(key).toLowerCase().startsWith("c# major") &&
    normalizeKeyLabel(resolvedKey).toLowerCase().startsWith("a major")
  ) {
    resolvedKey = "A major";
  }

  const durationSec = Math.max(
    base.durationSec,
    melodyneAligned.reduce((m, n) => Math.max(m, n.endSec), 0),
    melodyneParsed?.durationSec ?? 0,
  );

  const melodyneChords = melodyneAligned.length
    ? chordsFromPolyphonicNotes(melodyneAligned, bpm, durationSec, resolvedKey, 68)
    : [];
  const mergedChords = mergeChordTimelines(melodyneChords, base.chords);

  return {
    ...base,
    notes: audioNotes,
    audioNotes,
    melodyneNotes: melodyneAligned,
    melodyneRawNotes: melodyneRaw,
    chords: mergedChords,
    durationSec,
    waveformPeaks: base.waveformPeaks,
    alignOffsetSec,
    alignScore,
    harmonicKey: resolvedKey,
    harmonicKeyConfidence: keyResolved.confidence,
    harmonicKeySource: keyResolved.source,
    sources: {
      audioTranscription: audioNotes.length > 0,
      melodyneMidi: melodyneAligned.length > 0,
    },
  };
}

/** Merge Melodyne into an existing session after audio-only import. */
export function attachMelodyneToSession(
  session: HarmonicSession,
  melodyneFile: File,
  bpm: number,
  key: string,
): Promise<HarmonicSession | null> {
  return melodyneFile.arrayBuffer().then((buf) => {
    const parsed = parseMidiFile(buf);
    if (!parsed.notes.length) return null;

    let melodyneRaw = parsed.notes;
    if (bpm > 0) {
      melodyneRaw = normalizeMidiToBarOne(melodyneRaw, bpm).notes;
    }
    const alignedTrack = alignMelodyneTrack(session.audioNotes, melodyneRaw, bpm);
    const melodyneAligned = alignedTrack.notes;

    const keyResolved = resolveKeyWithMelodyne(key, 70, melodyneAligned, bpm);
    const resolvedKey = keyResolved.key;

    const durationSec = Math.max(
      session.durationSec,
      melodyneAligned.reduce((m, n) => Math.max(m, n.endSec), 0),
      parsed.durationSec,
    );

    const melodyneChords = chordsFromPolyphonicNotes(
      melodyneAligned,
      bpm,
      durationSec,
      resolvedKey,
      68,
    );
    const mergedChords = mergeChordTimelines(melodyneChords, session.chords);

    return {
      ...session,
      melodyneNotes: melodyneAligned,
      melodyneRawNotes: melodyneRaw,
      chords: mergedChords,
      durationSec,
      alignOffsetSec: alignedTrack.alignOffsetSec,
      alignScore: alignedTrack.alignScore,
      harmonicKey: resolvedKey,
      harmonicKeyConfidence: keyResolved.confidence,
      harmonicKeySource: keyResolved.source,
      sources: {
        ...session.sources,
        melodyneMidi: true,
      },
    };
  });
}

export function sessionToAnalysisChords(session: HarmonicSession) {
  return session.chords.map((c) => ({
    t0: c.t0,
    t1: c.t1,
    symbol: c.symbol,
    confidence: c.confidence,
  }));
}
