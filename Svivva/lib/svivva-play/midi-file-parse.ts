import type { TranscribedNote } from "./audio-transcription";

function readVarLen(data: Uint8Array, pos: { i: number }): number {
  let value = 0;
  while (pos.i < data.length) {
    const b = data[pos.i++];
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) break;
  }
  return value;
}

function parseTrack(
  data: Uint8Array,
  ticksPerBeat: number,
  tempoUsPerBeat: number,
): TranscribedNote[] {
  const notes: TranscribedNote[] = [];
  const active = new Map<number, { startTick: number; velocity: number }>();
  const pos = { i: 0 };
  let tick = 0;

  const tickToSec = (t: number) => (t * tempoUsPerBeat) / (ticksPerBeat * 1_000_000);

  while (pos.i < data.length) {
    const delta = readVarLen(data, pos);
    tick += delta;
    if (pos.i >= data.length) break;

    let status = data[pos.i];
    if (status < 0x80) {
      status = 0x90 | (status & 0x0f);
      pos.i++;
    } else {
      pos.i++;
    }

    const type = status & 0xf0;
    const ch = status & 0x0f;

    if (type === 0x90) {
      const note = data[pos.i++];
      const vel = data[pos.i++];
      if (vel > 0) {
        active.set(note, { startTick: tick, velocity: vel });
      } else {
        const start = active.get(note);
        if (start) {
          notes.push({
            midi: note,
            startSec: tickToSec(start.startTick),
            endSec: tickToSec(tick),
            velocity: start.velocity,
            cents: 0,
          });
          active.delete(note);
        }
      }
    } else if (type === 0x80) {
      const note = data[pos.i++];
      pos.i++;
      const start = active.get(note);
      if (start) {
        notes.push({
          midi: note,
          startSec: tickToSec(start.startTick),
          endSec: tickToSec(tick),
          velocity: start.velocity,
          cents: 0,
        });
        active.delete(note);
      }
    } else if (type === 0xff) {
      const meta = data[pos.i++];
      const len = readVarLen(data, pos);
      if (meta === 0x51 && len === 3) {
        const us = (data[pos.i] << 16) | (data[pos.i + 1] << 8) | data[pos.i + 2];
        pos.i += len;
        void us;
      } else {
        pos.i += len;
      }
    } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
      pos.i += 2;
    } else if (type === 0xc0 || type === 0xd0) {
      pos.i += 1;
    } else {
      break;
    }
    void ch;
  }

  for (const [note, start] of active) {
    notes.push({
      midi: note,
      startSec: tickToSec(start.startTick),
      endSec: tickToSec(tick),
      velocity: start.velocity,
      cents: 0,
    });
  }

  return notes.sort((a, b) => a.startSec - b.startSec);
}

/** Parse Standard MIDI File (type 0/1) into timed notes in seconds. */
export function parseMidiFile(buffer: ArrayBuffer): {
  notes: TranscribedNote[];
  durationSec: number;
  bpm: number;
} {
  const data = new Uint8Array(buffer);
  const sig = String.fromCharCode(...data.subarray(0, 4));
  if (sig !== "MThd") throw new Error("Not a MIDI file");

  const headerLen = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
  const format = (data[8] << 8) | data[9];
  const nTracks = (data[10] << 8) | data[11];
  const division = (data[12] << 8) | data[13];
  let pos = 8 + headerLen;

  const ticksPerBeat = division & 0x8000 ? 480 : division;
  let tempoUs = 500_000;
  const allNotes: TranscribedNote[] = [];

  for (let t = 0; t < nTracks; t++) {
    const trackSig = String.fromCharCode(...data.subarray(pos, pos + 4));
    if (trackSig !== "MTrk") break;
    const trackLen =
      (data[pos + 4] << 24) | (data[pos + 5] << 16) | (data[pos + 6] << 8) | data[pos + 7];
    pos += 8;
    const trackData = data.subarray(pos, pos + trackLen);
    const trackNotes = parseTrack(trackData, ticksPerBeat, tempoUs);
    allNotes.push(...trackNotes);
    pos += trackLen;
  }

  void format;
  const durationSec = allNotes.reduce((m, n) => Math.max(m, n.endSec), 0);
  const bpm = Math.round(60_000_000 / tempoUs);
  return {
    notes: allNotes.sort((a, b) => a.startSec - b.startSec),
    durationSec,
    bpm: bpm > 0 ? bpm : 120,
  };
}
