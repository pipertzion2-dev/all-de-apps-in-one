import type { AudioTranscription, TranscribedNote } from "./audio-transcription";
import { transcribeAudioFile } from "./audio-transcription";
import { mergeChordTimelines } from "./chords-from-notes";
import { normalizeKeyLabel } from "./analysis-utils";
import { resolveHarmonicKey } from "./resolve-harmonic-key";
import { chordsFromPolyphonicNotesAgnostic } from "./chords-from-notes";
import {
  alignMidiToAudio,
  anchorMelodyneToAudioFileStart,
  applyOffsetToNotes,
  normalizeMidiToBarOne,
} from "./midi-alignment";
import { parseMidiFile } from "./midi-file-parse";
import { fitMelodyneToAudioDuration } from "./session-duration";
import { alignChordTimelineToBeatGrid } from "./scale-key-guard";

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
  keyConfidence?: number;
  keyHint?: string;
}): Promise<HarmonicSession | null> {
  const { audioFile, melodyneFile, bpm, key, keyConfidence = 70, keyHint } = options;

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

  const fitted = fitMelodyneToAudioDuration(base.durationSec, melodyneAligned, melodyneRaw, bpm);
  melodyneAligned = fitted.melodyneNotes;
  melodyneRaw = fitted.melodyneRaw;

  const durationSec =
    base.durationSec > 0
      ? fitted.durationSec
      : fitted.durationSec ||
        Math.max(
          melodyneAligned.reduce((m, n) => Math.max(m, n.endSec), 0),
          melodyneParsed?.durationSec ?? 0,
        );

  const agnosticChords = melodyneAligned.length
    ? alignChordTimelineToBeatGrid(
        chordsFromPolyphonicNotesAgnostic(melodyneAligned, bpm, durationSec),
        bpm,
      )
    : [];

  const keyResolved = melodyneAligned.length
    ? resolveHarmonicKey({
        audioKey: key,
        audioConfidence: keyConfidence,
        midiNotes: melodyneAligned,
        chords: agnosticChords,
        bpm,
        keyHint,
      })
    : { key, confidence: keyConfidence, source: "audio" as const };
  const resolvedKey = normalizeKeyLabel(keyResolved.key);

  const melodyneChords = agnosticChords;
  const mergedChords = mergeChordTimelines(melodyneChords, base.chords)
    .filter((c) => c.t0 < durationSec)
    .map((c) => ({ ...c, t1: Math.min(c.t1, durationSec) }));

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
    harmonicKeySource: keyResolved.source === "audio" ? "audio" : "midi",
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
  audioConfidence = 70,
): Promise<HarmonicSession | null> {
  return melodyneFile.arrayBuffer().then((buf) => {
    const parsed = parseMidiFile(buf);
    if (!parsed.notes.length) return null;

    let melodyneRaw = parsed.notes;
    if (bpm > 0) {
      melodyneRaw = normalizeMidiToBarOne(melodyneRaw, bpm).notes;
    }
    const alignedTrack = alignMelodyneTrack(session.audioNotes, melodyneRaw, bpm);
    const fitted = fitMelodyneToAudioDuration(
      session.durationSec,
      alignedTrack.notes,
      melodyneRaw,
      bpm,
    );
    const melodyneAligned = fitted.melodyneNotes;
    melodyneRaw = fitted.melodyneRaw;

    const durationSec =
      session.durationSec > 0 ? fitted.durationSec : fitted.durationSec || parsed.durationSec;

    const agnosticChords = alignChordTimelineToBeatGrid(
      chordsFromPolyphonicNotesAgnostic(melodyneAligned, bpm, durationSec),
      bpm,
    );
    const keyResolved = resolveHarmonicKey({
      audioKey: key,
      audioConfidence,
      midiNotes: melodyneAligned,
      chords: agnosticChords,
      bpm,
    });
    const resolvedKey = normalizeKeyLabel(keyResolved.key);
    const melodyneChords = agnosticChords;
    const mergedChords = mergeChordTimelines(melodyneChords, session.chords)
      .filter((c) => c.t0 < durationSec)
      .map((c) => ({ ...c, t1: Math.min(c.t1, durationSec) }));

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
      harmonicKeySource: keyResolved.source === "audio" ? "audio" : "midi",
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
