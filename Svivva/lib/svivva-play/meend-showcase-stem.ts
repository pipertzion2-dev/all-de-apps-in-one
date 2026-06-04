import type { StemPlayback } from "./sound-engine";
import { meendPitchbendForEvents, prepareMeendPreviewEvents } from "./scale-key-guard";
import type { NormalizedMidiEvent } from "./midi-normalize";

export const MEEND_PREVIEW_STEM_NAME = "Indian Meend (preview)";

type MeendStemLike = {
  name: string;
  role: string;
  instrumentHint: string;
  midiEvents: NormalizedMidiEvent[];
};

/** Best single-voice line for legato meend — never merge overlapping hocket hits. */
export function pickMeendLeadStem(stems: MeendStemLike[]): MeendStemLike | null {
  const withNotes = stems.filter((s) => s.midiEvents.length > 0);
  if (withNotes.length === 0) return null;
  const melody = withNotes.find((s) => {
    const r = s.role.toLowerCase();
    return r === "melody" || r === "lead" || r === "solo";
  });
  if (melody) return melody;
  return withNotes.reduce((best, s) =>
    s.midiEvents.length > best.midiEvents.length ? s : best,
  );
}

export function buildMeendLeadPlayback(stems: MeendStemLike[]): StemPlayback | null {
  const lead = pickMeendLeadStem(stems);
  if (!lead) return null;
  const midiEvents = prepareMeendPreviewEvents([...lead.midiEvents], 1.25);
  if (midiEvents.length === 0) return null;
  return {
    name: MEEND_PREVIEW_STEM_NAME,
    role: "melody",
    instrumentHint: "sitar",
    midiEvents,
    expression: { meend: true, pitchbend: meendPitchbendForEvents(midiEvents) },
    muted: false,
    soloed: false,
    pan: 0,
    gainDb: 4,
  };
}
