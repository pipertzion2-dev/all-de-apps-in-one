import { buildMeendStemExpression } from "../meend-midi";
import type { NormalizedMidiEvent } from "../midi-normalize";
import type { MeendLevel } from "./types";

export type OrnamentBends = { beat: number; value: number }[];

/** Pitch-bend ornamentation only — note timing and velocity stay untouched. */
export function buildExpressionBends(
  events: NormalizedMidiEvent[],
  options: { meendLevel?: MeendLevel; stevieSlides?: boolean },
): OrnamentBends {
  const bends: OrnamentBends = [];

  if (options.stevieSlides && events.length) {
    const stevie = buildMeendStemExpression(events, false, {
      legato: false,
      peakSemitones: 1,
    });
    bends.push(...stevie.pitchbend);
  }

  const meend = options.meendLevel;
  if (meend && meend !== "off" && events.length) {
    const peak = meend === "light" ? 0.55 : meend === "medium" ? 0.95 : 1.25;
    const meended = buildMeendStemExpression(events, false, {
      legato: false,
      peakSemitones: peak,
    });
    bends.push(...meended.pitchbend);
  }

  bends.sort((a, b) => a.beat - b.beat);
  const out: OrnamentBends = [];
  for (const p of bends) {
    const last = out[out.length - 1];
    if (!last || Math.abs(last.beat - p.beat) > 1e-4) out.push(p);
  }
  return out;
}
