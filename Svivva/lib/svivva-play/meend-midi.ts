/**
 * Indian meend — aligned with V-1 INDIAN (sigmoid pitch slides + legato between swaras).
 * Same pitch-bend timeline drives browser preview and MIDI export (Ableton).
 */

/** Set Ableton instrument pitch bend range to this value (semtones) for export to match preview. */
export const MEEND_MIDI_BEND_RANGE_SEMITONES = 12;

export type MeendNoteEvent = {
  note: number;
  velocity?: number;
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

/** Preview detune uses the same bend range as exported MIDI. */
export function meendWheelToPreviewCents(wheel: number): number {
  return midiPitchWheelToSemitones(wheel) * 100;
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

/** S-curve ornament on each note body (V-1 meend tail ~6% pitch ratio → ~1 semitone at peak). */
function addIntraNoteMeendBends(
  e: MeendNoteEvent,
  out: MeendPitchBend[],
  peakSemitones = 0.85,
): void {
  const d = Math.max(0.08, e.duration || 0.25);
  const t0 = e.startBeat;
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const beat = t0 + d * (0.55 + t * 0.38);
    const value = semitonesToMidiPitchWheel(peakSemitones * sigmoidBend(t) * 2);
    out.push({ beat, value });
  }
  out.push({ beat: t0 + d * 0.98, value: 0 });
}

/** Glide pitch from one swara to the next (core meend between notes). */
function addInterNoteMeendBends(
  from: MeendNoteEvent,
  to: MeendNoteEvent,
  out: MeendPitchBend[],
): void {
  const semitoneDelta = to.note - from.note;
  if (Math.abs(semitoneDelta) < 0.01) return;

  const glideStart = from.startBeat + from.duration * 0.45;
  const glideEnd = to.startBeat;
  if (glideEnd <= glideStart + 0.02) return;

  const steps = Math.max(8, Math.ceil((glideEnd - glideStart) / 0.04));
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
 * Full meend map: intra-note S-curves + inter-note glides (monophonic streams only).
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
    addIntraNoteMeendBends(e, out);
    if (interNote && i < sorted.length - 1) {
      addInterNoteMeendBends(e, sorted[i + 1]!, out);
    }
  }

  return dedupeBends(out);
}

export function buildMeendStemExpression(
  events: MeendNoteEvent[],
  polyphonic: boolean,
): {
  meend: boolean;
  pitchbend: MeendPitchBend[];
  midiEvents: MeendNoteEvent[];
} {
  const midiEvents = polyphonic ? events : prepareMeendLegatoMidiEvents(events);
  return {
    meend: true,
    midiEvents,
    pitchbend: meendPitchbendForEvents(midiEvents, { interNote: !polyphonic }),
  };
}
