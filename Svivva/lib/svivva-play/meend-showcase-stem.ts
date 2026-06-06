import type { StemPlayback } from "./sound-engine";
import { buildMeendStemExpression } from "./meend-midi";
import type { NormalizedMidiEvent } from "./midi-normalize";
import { stemHasOverlappingNotes } from "./scale-key-guard";

/** @deprecated Legacy single-stem name — use {@link MEEND_ACCENT_PREFIX}. */
export const MEEND_PREVIEW_STEM_NAME = "Indian Meend (preview)";

export const MEEND_ACCENT_PREFIX = "Meend · ";

/** Blended under full mix — audible, not clipping. */
export const MEEND_ACCENT_GAIN_DB = 2;

export function meendAccentStemName(sourceName: string): string {
  return `${MEEND_ACCENT_PREFIX}${sourceName}`;
}

export function isMeendAccentStem(name: string): boolean {
  return name.startsWith(MEEND_ACCENT_PREFIX) || name === MEEND_PREVIEW_STEM_NAME;
}

export function meendAccentSourceName(accentName: string): string | null {
  if (accentName.startsWith(MEEND_ACCENT_PREFIX)) {
    return accentName.slice(MEEND_ACCENT_PREFIX.length);
  }
  return null;
}

type MeendStemLike = {
  name: string;
  role: string;
  instrumentHint: string;
  midiEvents: NormalizedMidiEvent[];
  pan?: number;
};

/** Monophonic hocket / melody lines that can carry meend ornaments. */
export function pickMeendVoices(stems: MeendStemLike[]): MeendStemLike[] {
  return stems.filter(
    (s) => s.midiEvents.length > 0 && !stemHasOverlappingNotes(s.midiEvents),
  );
}

/** Best single-voice line (legacy). */
export function pickMeendLeadStem(stems: MeendStemLike[]): MeendStemLike | null {
  const voices = pickMeendVoices(stems);
  if (voices.length === 0) return null;
  const melody = voices.find((s) => {
    const r = s.role.toLowerCase();
    return r === "melody" || r === "lead" || r === "solo";
  });
  return melody ?? voices.reduce((best, s) =>
    s.midiEvents.length > best.midiEvents.length ? s : best,
  );
}

/** One meend accent layer per monophonic voice (hocket-friendly). */
export function buildMeendAccentPlaybacks(stems: MeendStemLike[]): StemPlayback[] {
  const voices = pickMeendVoices(stems);
  const out: StemPlayback[] = [];
  for (let i = 0; i < voices.length; i++) {
    const stem = voices[i]!;
    const built = buildMeendStemExpression([...stem.midiEvents], false);
    if (built.midiEvents.length === 0) continue;
    out.push({
      name: meendAccentStemName(stem.name),
      role: stem.role,
      instrumentHint: "sitar",
      midiEvents: built.midiEvents as NormalizedMidiEvent[],
      expression: { meend: true, monophonic: true, pitchbend: built.pitchbend },
      muted: false,
      soloed: false,
      pan: stem.pan ?? 0,
      gainDb: MEEND_ACCENT_GAIN_DB,
    });
  }
  return out;
}

/** @deprecated Use {@link buildMeendAccentPlaybacks}. */
export function buildMeendLeadPlayback(stems: MeendStemLike[]): StemPlayback | null {
  const accents = buildMeendAccentPlaybacks(stems);
  return accents[0] ?? null;
}
