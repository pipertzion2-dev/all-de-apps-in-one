/**
 * Indian meend — aligned with V-1 INDIAN (gamak in note middle, meend on tail).
 * Same pitch-bend timeline drives browser preview and MIDI export (Ableton).
 */

/** Set Ableton instrument pitch bend range to this value (semtones) for export to match preview. */
export const MEEND_MIDI_BEND_RANGE_SEMITONES = 12;

/** V-1 INDIAN.zip — ornament placement on each beat/note. */
export const V1_GAMAK_START = 0.4;
export const V1_GAMAK_FRAC = 0.3;
export const V1_MEEND_TAIL_START = 0.8;
export const V1_MEEND_TAIL_FRAC = 0.15;

export type MeendNoteEvent = {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
};

export type MeendPitchBend = { beat: number; value: number };

export function semitonesToMidiPitchWheel(semitones: number): number {
  const clamped = Math.max(
    -MEEND_MIDI_BEND_RANGE_SEMITONES,
    Math.min(MEEND_MIDI_BEND_RANGE_SEMITONES, semitones),
  );
  return Math.round((clamped / MEEND_MIDI_BEND_RANGE_SEMITONES) * 8191);
}

export function midiPitchWheelToSemitones(wheel: number): number {
  return (wheel / 8191) * MEEND_MIDI_BEND_RANGE_SEMITONES;
}

/** Preview detune — boosted so gamak is obvious in browser (export MIDI unchanged). */
export const MEEND_PREVIEW_CENT_BOOST = 3.5;

export function meendWheelToPreviewCents(wheel: number): number {
  return midiPitchWheelToSemitones(wheel) * 100 * MEEND_PREVIEW_CENT_BOOST;
}

/** Legato ties for monophonic lines so pitch wheel bends sound during the glide (DAW + preview). */
export function prepareMeendLegatoMidiEvents<T extends MeendNoteEvent>(events: T[]): T[] {
  const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
  return sorted.map((e, i) => {
    const next = sorted[i + 1];
    if (!next) {
      return { ...e, duration: Math.max(e.duration || 0.25, 0.5) };
    }
    const legato = Math.max(0.12, next.startBeat - e.startBeat);
    return { ...e, duration: legato };
  });
}

function sigmoidBend(t: number): number {
  return 1 / (1 + Math.exp(-6 * (t - 0.5))) - 0.5;
}

/** Gamak — oscillating pitch in the middle of the note (V-1: 40%–70% of beat). */
function addGamakBends(
  e: MeendNoteEvent,
  out: MeendPitchBend[],
  peakSemitones = 0.45,
): void {
  const d = Math.max(0.12, e.duration || 0.25);
  const t0 = e.startBeat;
  const gamakStart = t0 + d * V1_GAMAK_START;
  const gamakEnd = gamakStart + d * V1_GAMAK_FRAC;
  const steps = 12;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const beat = gamakStart + t * (gamakEnd - gamakStart);
    const osc = Math.sin(2 * Math.PI * 2 * t) * Math.exp(-1.5 * t);
    out.push({ beat, value: semitonesToMidiPitchWheel(peakSemitones * osc) });
  }
  out.push({ beat: gamakEnd + 0.001, value: 0 });
}

/** Meend tail slide toward the next swara (V-1: starts ~80% into the note). */
function addInterNoteMeendBends(
  from: MeendNoteEvent,
  to: MeendNoteEvent,
  out: MeendPitchBend[],
): void {
  const semitoneDelta = to.note - from.note;
  if (Math.abs(semitoneDelta) < 0.01) return;

  const glideStart = from.startBeat + from.duration * V1_MEEND_TAIL_START;
  const glideEnd = to.startBeat;
  if (glideEnd <= glideStart + 0.02) return;

  const steps = Math.max(8, Math.ceil((glideEnd - glideStart) / 0.035));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const beat = glideStart + t * (glideEnd - glideStart);
    const bendT = sigmoidBend(t) * 2;
    const semitones = semitoneDelta * bendT;
    out.push({ beat, value: semitonesToMidiPitchWheel(semitones) });
  }
  out.push({ beat: glideEnd + 0.001, value: 0 });
}

function dedupeBends(bends: MeendPitchBend[]): MeendPitchBend[] {
  bends.sort((a, b) => a.beat - b.beat);
  const out: MeendPitchBend[] = [];
  for (const p of bends) {
    const last = out[out.length - 1];
    if (!last || Math.abs(last.beat - p.beat) > 1e-4) out.push(p);
  }
  return out;
}

/**
 * Full meend map: gamak (middle) + tail glides between swaras (monophonic only).
 */
export function meendPitchbendForEvents(
  events: MeendNoteEvent[],
  opts?: { interNote?: boolean },
): MeendPitchBend[] {
  const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
  if (sorted.length === 0) return [];

  const interNote = opts?.interNote ?? true;
  const out: MeendPitchBend[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i]!;
    addGamakBends(e, out);
    if (interNote && i < sorted.length - 1) {
      addInterNoteMeendBends(e, sorted[i + 1]!, out);
    }
  }

  return dedupeBends(out);
}

export function buildMeendStemExpression(
  events: MeendNoteEvent[],
  polyphonic: boolean,
  opts?: { legato?: boolean },
): {
  meend: boolean;
  pitchbend: MeendPitchBend[];
  midiEvents: MeendNoteEvent[];
} {
  const legato = opts?.legato ?? false;
  const midiEvents =
    !polyphonic && legato ? prepareMeendLegatoMidiEvents(events) : events;
  return {
    meend: true,
    midiEvents,
    pitchbend: meendPitchbendForEvents(midiEvents, { interNote: !polyphonic }),
  };
}
