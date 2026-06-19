export interface NormalizedMidiEvent {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
  channel?: number;
}

const DEFAULT_TICKS_PER_BEAT = 480;

/** Accept snake_case or camelCase MIDI events from API/DB/LLM. */
export function normalizeMidiEvent(
  raw: unknown,
  ticksPerBeat = DEFAULT_TICKS_PER_BEAT,
): NormalizedMidiEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const note = Number(e.note);
  const startBeat = Number(e.startBeat ?? e.start_beat);
  const duration = Number(e.duration ?? e.duration_beats ?? e.durationBeats);
  if (!Number.isFinite(note) || !Number.isFinite(startBeat) || !Number.isFinite(duration)) {
    return null;
  }
  const minDuration = 1 / ticksPerBeat;
  return {
    note: Math.max(0, Math.min(127, Math.round(note))),
    velocity: Math.max(1, Math.min(127, Math.round(Number(e.velocity ?? 80) || 80))),
    startBeat: Math.max(0, startBeat),
    duration: Math.max(minDuration, duration),
    channel:
      e.channel != null ? Math.max(0, Math.min(15, Math.round(Number(e.channel)))) : undefined,
  };
}

export function normalizeMidiEvents(
  raw: unknown,
  ticksPerBeat = DEFAULT_TICKS_PER_BEAT,
): NormalizedMidiEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: NormalizedMidiEvent[] = [];
  for (const item of raw) {
    const evt = normalizeMidiEvent(item, ticksPerBeat);
    if (evt) out.push(evt);
  }
  return out;
}
