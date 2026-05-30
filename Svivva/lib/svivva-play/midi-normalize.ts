export interface NormalizedMidiEvent {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
  channel?: number;
}

/** Accept snake_case or camelCase MIDI events from API/DB/LLM. */
export function normalizeMidiEvent(raw: unknown): NormalizedMidiEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const note = Number(e.note);
  const startBeat = Number(e.startBeat ?? e.start_beat);
  const duration = Number(e.duration ?? e.duration_beats ?? e.durationBeats);
  if (!Number.isFinite(note) || !Number.isFinite(startBeat) || !Number.isFinite(duration)) {
    return null;
  }
  return {
    note: Math.max(0, Math.min(127, Math.round(note))),
    velocity: Math.max(
      1,
      Math.min(127, Math.round(Number(e.velocity ?? 80) || 80)),
    ),
    startBeat: Math.max(0, startBeat),
    duration: Math.max(0.01, duration),
    channel:
      e.channel != null
        ? Math.max(0, Math.min(15, Math.round(Number(e.channel))))
        : undefined,
  };
}

export function normalizeMidiEvents(raw: unknown): NormalizedMidiEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: NormalizedMidiEvent[] = [];
  for (const item of raw) {
    const evt = normalizeMidiEvent(item);
    if (evt) out.push(evt);
  }
  return out;
}
