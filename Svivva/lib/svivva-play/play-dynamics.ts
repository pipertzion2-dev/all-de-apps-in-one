import type { NormalizedMidiEvent } from "./midi-normalize";

type DynamicStem = {
  name?: string;
  role: string;
  instrumentHint?: string;
  midiEvents: NormalizedMidiEvent[];
};

const ROLE_RANGE: Record<string, { floor: number; ceiling: number; accent: number }> = {
  melody: { floor: 52, ceiling: 96, accent: 8 },
  lead: { floor: 52, ceiling: 96, accent: 8 },
  solo: { floor: 54, ceiling: 98, accent: 10 },
  harmony: { floor: 44, ceiling: 82, accent: 5 },
  bass: { floor: 40, ceiling: 78, accent: 6 },
  percussion: { floor: 36, ceiling: 88, accent: 12 },
  pad: { floor: 38, ceiling: 76, accent: 4 },
  chords: { floor: 42, ceiling: 84, accent: 5 },
  comp: { floor: 42, ceiling: 84, accent: 5 },
  hocket: { floor: 50, ceiling: 92, accent: 7 },
  arpeggio: { floor: 40, ceiling: 80, accent: 4 },
};

function roleDynamics(role: string, hint = "") {
  const r = role.toLowerCase();
  const h = hint.toLowerCase();
  if (r.includes("hocket")) return ROLE_RANGE.hocket!;
  if (r.includes("solo") || h.includes("solo")) return ROLE_RANGE.solo!;
  if (r.includes("melody") || r.includes("lead")) return ROLE_RANGE.melody!;
  if (r.includes("bass") || h.includes("contrabass")) return ROLE_RANGE.bass!;
  if (r.includes("percussion") || h.includes("cymbal") || h.includes("timpani"))
    return ROLE_RANGE.percussion!;
  if (r.includes("harmony") || h.includes("viola") || h.includes("cello") || h.includes("harp"))
    return ROLE_RANGE.harmony!;
  if (r.includes("pad")) return ROLE_RANGE.pad!;
  if (r.includes("chord") || r.includes("comp")) return ROLE_RANGE.comp!;
  return { floor: 46, ceiling: 86, accent: 6 };
}

function phraseArc(beat: number, phraseBeats = 16): number {
  const pos = beat % phraseBeats;
  if (pos >= phraseBeats - 1) return 0.76;
  return 0.7 + 0.3 * Math.sin((pos / phraseBeats) * Math.PI);
}

/** Gentle phrase dynamics for all Play modes — preserves timbre, adds musical breathing. */
export function applyPlayDynamicsToStems<T extends DynamicStem>(
  stems: T[],
  bpm: number,
  opts?: { strength?: number; phraseBeats?: number },
): T[] {
  if (!stems.length || bpm <= 0) return stems;
  const strength = Math.max(0.15, Math.min(1, opts?.strength ?? 0.42));
  const phraseBeats = opts?.phraseBeats ?? (bpm >= 120 ? 16 : 8);

  return stems.map((stem) => {
    if (!stem.midiEvents.length) return stem;
    const dyn = roleDynamics(stem.role, stem.instrumentHint ?? stem.name ?? "");
    const events = [...stem.midiEvents].sort((a, b) => a.startBeat - b.startBeat);

    const shaped = events.map((evt, idx) => {
      const arc = phraseArc(evt.startBeat, phraseBeats);
      const barPos = evt.startBeat % 4;
      const downbeat = barPos < 0.15 ? dyn.accent : barPos > 2.8 ? -4 : 0;
      const prev = idx > 0 ? events[idx - 1]! : null;
      const leap = prev ? Math.abs(evt.note - prev.note) : 0;
      const leapSoft = leap > 8 ? -5 : leap > 5 ? -2 : 0;
      const base = evt.velocity > 0 ? evt.velocity : (dyn.floor + dyn.ceiling) / 2;
      const blended = base * (1 - strength) + (dyn.floor + (dyn.ceiling - dyn.floor) * arc) * strength;
      const velocity = Math.round(
        Math.min(118, Math.max(28, blended + downbeat + leapSoft)),
      );
      return { ...evt, velocity };
    });

    return { ...stem, midiEvents: shaped };
  });
}
