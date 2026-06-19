import Midi from "jsmidgen";
import { normalizeMidiEvents } from "./midi-normalize";
import { MEEND_MIDI_BEND_RANGE_SEMITONES, meendPitchbendForEvents } from "./meend-midi";
import { stemHasOverlappingNotes } from "./scale-key-guard";

export { stemMidiFilename } from "./midi-filenames";

export type MidiStemExpression = {
  meend?: boolean;
  pitchbend?: { beat: number; value: number }[];
};

export type MidiStemInput = {
  name?: string;
  midiEvents?: unknown[];
  expression?: MidiStemExpression;
};

export type MidiExportOptions = {
  /** Match source SMF division (defaults to 480). */
  ticksPerBeat?: number;
  /** Pad each track to this beat length (preserves trailing silence from source). */
  endBeat?: number;
};

const DEFAULT_TICKS_PER_BEAT = 480;

function midiPitchBendValue(offset: number): number {
  return Math.max(0, Math.min(16383, 8192 + Math.round(offset)));
}

function binaryStringToUint8Array(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    out[i] = s.charCodeAt(i) & 0xff;
  }
  return out;
}

/** ASCII-only track names — DAWs reject some UTF-8 meta payloads. */
function sanitizeMidiTrackName(name: string): string {
  const ascii = name.replace(/[^\x20-\x7E]/g, "").trim();
  return (ascii || "Untitled").slice(0, 64);
}

type AtomicMidiEvent =
  | { tick: number; kind: "noteOn"; note: number; velocity: number; channel: number }
  | { tick: number; kind: "noteOff"; note: number; channel: number }
  | { tick: number; kind: "bend"; value: number; channel: number };

const ATOMIC_KIND_ORDER: Record<AtomicMidiEvent["kind"], number> = {
  noteOff: 0,
  bend: 1,
  noteOn: 2,
};

function expandTimelineToAtomicEvents(timeline: TimelineEntry[]): AtomicMidiEvent[] {
  const atoms: AtomicMidiEvent[] = [];
  for (const item of timeline) {
    if (item.kind === "note") {
      atoms.push({
        tick: item.tick,
        kind: "noteOn",
        note: item.note,
        velocity: item.velocity,
        channel: item.channel,
      });
      atoms.push({
        tick: item.tick + item.durationTick,
        kind: "noteOff",
        note: item.note,
        channel: item.channel,
      });
    } else {
      atoms.push({
        tick: item.tick,
        kind: "bend",
        value: item.value,
        channel: item.channel,
      });
    }
  }
  atoms.sort((a, b) => a.tick - b.tick || ATOMIC_KIND_ORDER[a.kind] - ATOMIC_KIND_ORDER[b.kind]);
  return atoms;
}

function addMeendTrackMeta(track: InstanceType<typeof Midi.Track>, stem: MidiStemInput): void {
  const hasMeend = Boolean(stem.expression?.meend) || (stem.expression?.pitchbend?.length ?? 0) > 0;
  if (!hasMeend) return;
  track.addEvent(
    new Midi.MetaEvent({
      type: Midi.MetaEvent.MARKER,
      data: `Svivva Meend: set Pitch Bend Range to ${MEEND_MIDI_BEND_RANGE_SEMITONES} st in Ableton`,
    }),
  );
}

type TimelineEntry =
  | {
      kind: "note";
      tick: number;
      note: number;
      durationTick: number;
      velocity: number;
      channel: number;
    }
  | { kind: "bend"; tick: number; value: number; channel: number };

function buildStemTimeline(
  events: ReturnType<typeof normalizeMidiEvents>,
  ticksPerBeat: number,
  expression?: MidiStemExpression,
): TimelineEntry[] {
  const timeline: TimelineEntry[] = [];
  const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
  const wantsMeend = Boolean(expression?.meend) || (expression?.pitchbend?.length ?? 0) > 0;

  const exportNotes = sorted;

  for (const evt of exportNotes) {
    const startTick = Math.round(evt.startBeat * ticksPerBeat);
    const durationTick = Math.max(1, Math.round(evt.duration * ticksPerBeat));
    timeline.push({
      kind: "note",
      tick: startTick,
      note: evt.note,
      durationTick,
      velocity: evt.velocity,
      channel: evt.channel ?? 0,
    });
  }

  let pitchBends = expression?.pitchbend ?? [];
  if (wantsMeend && pitchBends.length === 0 && exportNotes.length) {
    pitchBends = meendPitchbendForEvents(exportNotes, {
      interNote: !stemHasOverlappingNotes(exportNotes),
    });
  }
  const bendChannel = exportNotes[0]?.channel ?? 0;
  for (const pb of pitchBends) {
    timeline.push({
      kind: "bend",
      tick: Math.round(Math.max(0, pb.beat) * ticksPerBeat),
      value: midiPitchBendValue(pb.value),
      channel: bendChannel,
    });
  }

  timeline.sort((a, b) => a.tick - b.tick || (a.kind === "bend" ? -1 : 1));
  return timeline;
}

function writeTimelineToTrack(
  track: InstanceType<typeof Midi.Track>,
  timeline: TimelineEntry[],
  ticksPerBeat: number,
  endBeat?: number,
): void {
  let currentTick = 0;

  for (const item of expandTimelineToAtomicEvents(timeline)) {
    const delay = Math.max(0, item.tick - currentTick);
    const channel = item.channel;
    if (item.kind === "noteOn") {
      track.addEvent(
        new Midi.Event({
          type: Midi.Event.NOTE_ON,
          channel,
          param1: item.note,
          param2: item.velocity,
          time: delay,
        }),
      );
    } else if (item.kind === "noteOff") {
      track.addEvent(
        new Midi.Event({
          type: Midi.Event.NOTE_OFF,
          channel,
          param1: item.note,
          param2: 0,
          time: delay,
        }),
      );
    } else {
      const v = item.value;
      track.addEvent(
        new Midi.Event({
          type: Midi.Event.PITCH_BEND,
          channel,
          param1: v & 127,
          param2: (v >> 7) & 127,
          time: delay,
        }),
      );
    }
    currentTick = item.tick;
  }

  if (endBeat != null && endBeat > 0) {
    const endTick = Math.round(endBeat * ticksPerBeat);
    const trailing = endTick - currentTick;
    if (trailing > 0) {
      track.addEvent(
        new Midi.MetaEvent({
          type: Midi.MetaEvent.MARKER,
          data: "",
          time: trailing,
        }),
      );
    }
  }
}

export function buildMidiFile(
  stems: MidiStemInput[],
  bpm: number,
  options?: MidiExportOptions,
): Buffer {
  const bytes = buildMidiFileBytes(stems, bpm, options);
  return Buffer.from(bytes);
}

/** Browser-safe MIDI bytes (no Node Buffer). */
export function buildMidiFileBytes(
  stems: MidiStemInput[],
  bpm: number,
  options?: MidiExportOptions,
): Uint8Array {
  const ticksPerBeat = options?.ticksPerBeat ?? DEFAULT_TICKS_PER_BEAT;
  const file = new Midi.File({ ticks: ticksPerBeat });

  for (const stem of stems) {
    const events = normalizeMidiEvents(stem.midiEvents, ticksPerBeat);
    if (events.length === 0) continue;

    const track = new Midi.Track();
    file.addTrack(track);
    // Time signature 4/4 at tick 0 — Ableton uses this for bar grid alignment.
    // Bytes: [numerator=4, log2(denominator)=2, MIDI-clocks-per-beat=24, 32nds-per-quarter=8]
    track.addEvent(
      new Midi.MetaEvent({
        type: 0x58,
        data: [4, 2, 24, 8],
      }),
    );

    track.setTempo(bpm);

    track.addEvent(
      new Midi.MetaEvent({
        type: Midi.MetaEvent.TRACK_NAME,
        data: sanitizeMidiTrackName(stem.name || "Untitled"),
      }),
    );

    track.setInstrument(0, 0, 0);
    addMeendTrackMeta(track, stem);

    const timeline = buildStemTimeline(events, ticksPerBeat, stem.expression);
    writeTimelineToTrack(track, timeline, ticksPerBeat, options?.endBeat);
  }

  if (file.tracks.length === 0) {
    throw new Error("No MIDI notes to export");
  }

  // jsmidgen emits a *binary* string; we must convert with charCodeAt().
  // (Their `toUint8Array()` uses `Uint8Array.from(string)` which produces 0s.)
  return binaryStringToUint8Array(file.toBytes());
}
