import type { StemPlayback } from "./sound-engine";
import { buildMeendStemExpression } from "./meend-midi";
import type { NormalizedMidiEvent } from "./midi-normalize";
import { isOrchestralMeendStem } from "./orchestral-compose";
import { stemHasOverlappingNotes } from "./scale-key-guard";

/** @deprecated Legacy single-stem name — use {@link MEEND_ACCENT_PREFIX}. */
export const MEEND_PREVIEW_STEM_NAME = "Indian Meend (preview)";

export const MEEND_ACCENT_PREFIX = "Meend · ";

/** Blended under full mix — audible, not clipping. */
export const MEEND_ACCENT_GAIN_DB = 2;

/** Louder sitar accent under dense orchestral mix. */
export const ORCHESTRAL_MEEND_ACCENT_GAIN_DB = 6;

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

/** Sitar accent layers for lyrical ensemble stems (Violin 1, Solo Violin, Flute, Oboe). */
export function buildOrchestralMeendAccentPlaybacks(stems: MeendStemLike[]): StemPlayback[] {
  const lyrical = stems.filter(
    (s) =>
      isOrchestralMeendStem(s.name) &&
      s.midiEvents.length > 0 &&
      !stemHasOverlappingNotes(s.midiEvents),
  );
  const out: StemPlayback[] = [];
  for (let i = 0; i < lyrical.length; i++) {
    const stem = lyrical[i]!;
    const built = buildMeendStemExpression([...stem.midiEvents], false, {
      peakSemitones: 0.9,
      shouldOrnament: (idx, e) => {
        if ((e.duration ?? 0.25) < 0.22) return false;
        const bar = Math.floor(e.startBeat / 4);
        return (bar + idx + i) % 3 !== 1;
      },
    });
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
      gainDb: ORCHESTRAL_MEEND_ACCENT_GAIN_DB,
    });
  }
  return out;
}

/** @deprecated Use {@link buildMeendAccentPlaybacks}. */
export function buildMeendLeadPlayback(stems: MeendStemLike[]): StemPlayback | null {
  const accents = buildMeendAccentPlaybacks(stems);
  return accents[0] ?? null;
}
