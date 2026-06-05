export type MeendMidiEvent = {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
};

export type MeendTimelineEvent =
  | { type: "attack"; time: number; note: string; velocity: number }
  | { type: "glide"; time: number; note: string; glide: number; velocity: number }
  | { type: "bend"; time: number; cents: number; glide: number }
  | { type: "release"; time: number };

import { meendWheelToPreviewCents } from "./meend-midi";

export { meendWheelToPreviewCents };

const EVENT_ORDER = { attack: 0, glide: 1, bend: 2, release: 3 } as const;

/**
 * Legato meend: one sustained voice per stem, pitch glides between notes (Indian meend style).
 */
export function buildMeendLegatoTimeline(
  events: MeendMidiEvent[],
  pitchBends: { beat: number; value: number }[],
  beatToSeconds: (beat: number) => number,
  noteName: (midi: number) => string,
): MeendTimelineEvent[] {
  const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
  if (sorted.length === 0) return [];

  const glideSec = 0.38;
  const timeline: MeendTimelineEvent[] = [];
  const first = sorted[0]!;

  timeline.push({
    type: "attack",
    time: beatToSeconds(first.startBeat),
    note: noteName(first.note),
    velocity: Math.max(0.2, Math.min(1, first.velocity / 127)),
  });

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const evt = sorted[i]!;
    const gapBeats = Math.max(0.08, evt.startBeat - prev.startBeat);
    const glide = Math.min(0.6, Math.max(0.18, beatToSeconds(gapBeats) * 0.9));
    timeline.push({
      type: "glide",
      time: beatToSeconds(evt.startBeat),
      note: noteName(evt.note),
      glide,
      velocity: Math.max(0.15, Math.min(1, evt.velocity / 127)),
    });
  }

  for (const pb of pitchBends) {
    timeline.push({
      type: "bend",
      time: beatToSeconds(pb.beat),
      cents: meendWheelToPreviewCents(pb.value),
      glide: 0.12,
    });
  }

  let releaseBeat = first.startBeat + Math.max(first.duration, 1.25);
  for (let i = 0; i < sorted.length; i++) {
    const evt = sorted[i]!;
    const next = sorted[i + 1];
    const endBeat = next
      ? next.startBeat + 0.25
      : evt.startBeat + Math.max(evt.duration, 1.25);
    releaseBeat = Math.max(releaseBeat, endBeat);
  }
  timeline.push({ type: "release", time: beatToSeconds(releaseBeat + 0.35) });

  timeline.sort(
    (a, b) =>
      a.time - b.time ||
      EVENT_ORDER[a.type] - EVENT_ORDER[b.type],
  );
  return timeline;
}
