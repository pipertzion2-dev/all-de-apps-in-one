export type MeendMidiEvent = {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
};

export type MeendTimelineEvent =
  | { type: "attack"; time: number; note: string; velocity: number }
  | { type: "tailBend"; time: number; cents: number; glide: number }
  | { type: "bend"; time: number; cents: number; glide: number }
  | { type: "release"; time: number };

import {
  V1_GAMAK_FRAC,
  V1_GAMAK_START,
  V1_MEEND_TAIL_START,
} from "./meend-midi";

/** Gamak depth — clear under a full mix without clipping. */
export const MEEND_PREVIEW_GAMAK_CENTS = 140;

/** Tail slide strength in preview. */
export const MEEND_PREVIEW_TAIL_BOOST = 1.55;

const EVENT_ORDER = { attack: 0, bend: 1, tailBend: 2, release: 3 } as const;

/**
 * Per-swara attacks with gamak in the middle (40–70%) and tail meend at 80% (V-1 INDIAN).
 */
export function buildMeendLegatoTimeline(
  events: MeendMidiEvent[],
  _pitchBends: { beat: number; value: number }[],
  beatToSeconds: (beat: number) => number,
  noteName: (midi: number) => string,
): MeendTimelineEvent[] {
  const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
  if (sorted.length === 0) return [];

  const timeline: MeendTimelineEvent[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const evt = sorted[i]!;
    const next = sorted[i + 1];
    const d = Math.max(0.12, evt.duration || 0.25);

    timeline.push({
      type: "attack",
      time: beatToSeconds(evt.startBeat),
      note: noteName(evt.note),
      velocity: Math.max(0.28, Math.min(0.55, (evt.velocity / 127) * 0.65)),
    });

    const gamakStart = evt.startBeat + d * V1_GAMAK_START;
    const gamakEnd = gamakStart + d * V1_GAMAK_FRAC;
    const gamakSteps = 12;
    for (let s = 0; s <= gamakSteps; s++) {
      const t = s / gamakSteps;
      const beat = gamakStart + t * (gamakEnd - gamakStart);
      const osc = Math.sin(2 * Math.PI * 2 * t) * Math.exp(-1.5 * t);
      timeline.push({
        type: "bend",
        time: beatToSeconds(beat),
        cents: MEEND_PREVIEW_GAMAK_CENTS * osc,
        glide: 0.04,
      });
    }
    timeline.push({
      type: "bend",
      time: beatToSeconds(gamakEnd + 0.01),
      cents: 0,
      glide: 0.03,
    });

    if (next && next.note !== evt.note) {
      const slideStartBeat = evt.startBeat + d * V1_MEEND_TAIL_START;
      const slideEndBeat = next.startBeat;
      if (slideEndBeat > slideStartBeat + 0.02) {
        const semis = next.note - evt.note;
        const glideSec = Math.max(0.07, beatToSeconds(slideEndBeat - slideStartBeat));
        timeline.push({
          type: "tailBend",
          time: beatToSeconds(slideStartBeat),
          cents: semis * 100 * MEEND_PREVIEW_TAIL_BOOST,
          glide: glideSec,
        });
      }
    }
  }

  const last = sorted[sorted.length - 1]!;
  const releaseBeat =
    last.startBeat + Math.max(last.duration || 0.25, 0.35) + 0.2;
  timeline.push({ type: "release", time: beatToSeconds(releaseBeat) });

  timeline.sort(
    (a, b) =>
      a.time - b.time ||
      EVENT_ORDER[a.type] - EVENT_ORDER[b.type],
  );
  return timeline;
}
