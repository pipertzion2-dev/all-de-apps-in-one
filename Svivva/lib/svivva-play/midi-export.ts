import Midi from "jsmidgen";
import { normalizeMidiEvents } from "./midi-normalize";
import {
  MEEND_MIDI_BEND_RANGE_SEMITONES,
  meendPitchbendForEvents,
  prepareMeendLegatoMidiEvents,
} from "./meend-midi";
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

const TICKS_PER_BEAT = 480;

function midiPitchBendValue(offset: number): number {
  return Math.max(0, Math.min(16383, 8192 + Math.round(offset)));
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
  | { kind: "note"; tick: number; note: number; durationTick: number; velocity: number }
  | { kind: "bend"; tick: number; value: number };

function buildStemTimeline(
  events: ReturnType<typeof normalizeMidiEvents>,
  expression?: MidiStemExpression,
): TimelineEntry[] {
  const timeline: TimelineEntry[] = [];
  let sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
  const wantsMeend = Boolean(expression?.meend) || (expression?.pitchbend?.length ?? 0) > 0;
  if (wantsMeend && !stemHasOverlappingNotes(sorted)) {
    sorted = prepareMeendLegatoMidiEvents(sorted);
  }

  for (const evt of sorted) {
    const startTick = Math.round(evt.startBeat * TICKS_PER_BEAT);
    const durationTick = Math.max(
      TICKS_PER_BEAT / 4,
      Math.round(evt.duration * TICKS_PER_BEAT),
    );
    timeline.push({
      kind: "note",
      tick: startTick,
      note: evt.note,
      durationTick,
      velocity: evt.velocity,
    });
  }

  let pitchBends = expression?.pitchbend ?? [];
  if (wantsMeend && pitchBends.length === 0 && sorted.length) {
    pitchBends = meendPitchbendForEvents(sorted, {
      interNote: !stemHasOverlappingNotes(sorted),
    });
  }
  for (const pb of pitchBends) {
    timeline.push({
      kind: "bend",
      tick: Math.round(Math.max(0, pb.beat) * TICKS_PER_BEAT),
      value: midiPitchBendValue(pb.value),
    });
  }

  timeline.sort((a, b) => a.tick - b.tick || (a.kind === "bend" ? -1 : 1));
  return timeline;
}

function writeTimelineToTrack(track: InstanceType<typeof Midi.Track>, timeline: TimelineEntry[]): void {
  const channel = 0;
  let currentTick = 0;

  for (const item of timeline) {
    const delay = Math.max(0, item.tick - currentTick);
    if (item.kind === "bend") {
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
      currentTick = item.tick;
    } else {
      try {
        track.addNote(channel, item.note, item.durationTick, delay, item.velocity);
        currentTick = item.tick + item.durationTick;
      } catch (e) {
        console.warn("MIDI note write error:", e);
      }
    }
  }
}

export function buildMidiFile(stems: MidiStemInput[], bpm: number): Buffer {
  const file = new Midi.File();

  for (const stem of stems) {
    const track = new Midi.Track();
    file.addTrack(track);
    track.setTempo(bpm);

    track.addEvent(
      new Midi.MetaEvent({
        type: Midi.MetaEvent.TRACK_NAME,
        data: stem.name || "Untitled",
      }),
    );

    track.setInstrument(0, 0, 0);
    addMeendTrackMeta(track, stem);

    const events = normalizeMidiEvents(stem.midiEvents);
    if (events.length === 0) continue;

    const timeline = buildStemTimeline(events, stem.expression);
    writeTimelineToTrack(track, timeline);
  }

  return Buffer.from(file.toBytes());
}

/** Browser-safe MIDI bytes (no Node Buffer). */
export function buildMidiFileBytes(stems: MidiStemInput[], bpm: number): Uint8Array {
  return new Uint8Array(buildMidiFile(stems, bpm));
}
