import type { StemPlayback } from "./sound-engine";
import { meendPitchbendForEvents, prepareMeendPreviewEvents } from "./scale-key-guard";
import type { NormalizedMidiEvent } from "./midi-normalize";

export const MEEND_PREVIEW_STEM_NAME = "Indian Meend (preview)";

type MeendStemLike = {
  name: string;
  role: string;
  instrumentHint: string;
  midiEvents: NormalizedMidiEvent[];
  expression?: Record<string, unknown>;
  muted?: boolean;
  soloed?: boolean;
  pan?: number;
  gainDb?: number;
};

/** One legato line for preview — highest note wins on overlap so glides stay audible. */
export function mergeMeendShowcaseEvents(stems: MeendStemLike[]): NormalizedMidiEvent[] {
  const merged: NormalizedMidiEvent[] = [];
  for (const stem of stems) {
    for (const e of stem.midiEvents) merged.push(e);
  }
  if (merged.length === 0) return [];
  merged.sort((a, b) => a.startBeat - b.startBeat || b.note - a.note);

  const out: NormalizedMidiEvent[] = [];
  for (const evt of merged) {
    const last = out[out.length - 1];
    if (!last) {
      out.push({ ...evt });
      continue;
    }
    const overlap = evt.startBeat < last.startBeat + last.duration - 0.02;
    if (overlap) {
      if (evt.note >= last.note) {
        out[out.length - 1] = {
          ...last,
          note: evt.note,
          velocity: Math.max(last.velocity, evt.velocity),
          startBeat: Math.min(last.startBeat, evt.startBeat),
          duration: Math.max(
            last.duration,
            evt.startBeat + evt.duration - Math.min(last.startBeat, evt.startBeat),
          ),
        };
      }
      continue;
    }
    out.push({ ...evt });
  }
  return prepareMeendPreviewEvents(out, 1.35);
}

export function buildMeendShowcasePlayback(stems: MeendStemLike[]): StemPlayback | null {
  const events = mergeMeendShowcaseEvents(stems);
  if (events.length === 0) return null;
  const pitchbend = meendPitchbendForEvents(events);
  return {
    name: MEEND_PREVIEW_STEM_NAME,
    role: "melody",
    instrumentHint: "sitar",
    midiEvents: events,
    expression: { meend: true, pitchbend },
    muted: false,
    soloed: false,
    pan: 0,
    gainDb: 6,
  };
}

export function appendMeendShowcaseForPreview(playbacks: StemPlayback[]): StemPlayback[] {
  const showcase = buildMeendShowcasePlayback(
    playbacks.map((p) => ({
      name: p.name,
      role: p.role,
      instrumentHint: p.instrumentHint,
      midiEvents: p.midiEvents as NormalizedMidiEvent[],
      expression: p.expression as Record<string, unknown> | undefined,
    })),
  );
  if (!showcase) return playbacks;
  return [
    ...playbacks.map((p) =>
      p.name === MEEND_PREVIEW_STEM_NAME ? p : { ...p, muted: true },
    ),
    showcase,
  ];
}
