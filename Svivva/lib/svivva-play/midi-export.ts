import Midi from "jsmidgen";
import { normalizeMidiEvents } from "./midi-normalize";

export { stemMidiFilename } from "./midi-filenames";

export function buildMidiFile(
  stems: { name?: string; midiEvents?: unknown[] }[],
  bpm: number,
): Buffer {
  const file = new Midi.File();
  file.setTempo(bpm);

  for (const stem of stems) {
    const track = new Midi.Track();
    file.addTrack(track);

    track.addEvent(
      new Midi.MetaEvent({
        type: Midi.MetaEvent.TRACK_NAME,
        data: stem.name || "Untitled",
      }),
    );

    const channel = 0;
    track.addEvent(
      new Midi.ControllerEvent({
        type: Midi.ControllerEvent.PROGRAM_CHANGE,
        channel,
        param1: 0,
        param2: 0,
      }),
    );

    const events = normalizeMidiEvents(stem.midiEvents);
    if (events.length === 0) continue;

    const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
    const ticksPerBeat = 480;

    let currentTick = 0;
    for (const evt of sorted) {
      try {
        const startTick = Math.round(evt.startBeat * ticksPerBeat);
        const durationTick = Math.max(ticksPerBeat / 4, Math.round(evt.duration * ticksPerBeat));
        const delay = Math.max(0, startTick - currentTick);
        track.addNote(channel, evt.note, durationTick, delay, evt.velocity);
        currentTick = startTick + durationTick;
      } catch (e) {
        console.warn(`Error adding note to ${stem.name}:`, e);
      }
    }
  }

  return file.toBytes();
}
