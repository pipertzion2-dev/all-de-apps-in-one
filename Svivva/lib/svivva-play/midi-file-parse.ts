import type { TranscribedNote } from "./audio-transcription";

type TempoPoint = { tick: number; usPerBeat: number };

function readVarLen(data: Uint8Array, pos: { i: number }): number {
  let value = 0;
  while (pos.i < data.length) {
    const b = data[pos.i++]!;
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) break;
  }
  return value;
}

/** Convert MIDI tick to wall-clock seconds using a tempo map. */
export function tickToSeconds(tick: number, ticksPerBeat: number, tempoMap: TempoPoint[]): number {
  if (tick <= 0) return 0;
  let sec = 0;
  let curTick = 0;
  for (let i = 0; i < tempoMap.length; i++) {
    const usPerBeat = tempoMap[i]!.usPerBeat;
    const segEndTick = tempoMap[i + 1]?.tick ?? tick;
    const end = Math.min(tick, segEndTick);
    if (end > curTick) {
      sec += ((end - curTick) * usPerBeat) / (ticksPerBeat * 1_000_000);
      curTick = end;
    }
    if (curTick >= tick) break;
  }
  return sec;
}

function parseTrack(
  data: Uint8Array,
  ticksPerBeat: number,
  initialTempoUs: number,
): { notes: TranscribedNote[]; tempoMap: TempoPoint[] } {
  const notes: TranscribedNote[] = [];
  const active = new Map<number, { startTick: number; velocity: number }>();
  const tempoMap: TempoPoint[] = [{ tick: 0, usPerBeat: initialTempoUs }];
  const pos = { i: 0 };
  let tick = 0;
  let runningStatus = 0;

  while (pos.i < data.length) {
    const delta = readVarLen(data, pos);
    tick += delta;
    if (pos.i >= data.length) break;

    let status = data[pos.i]!;
    if (status < 0x80) {
      if (!runningStatus) {
        pos.i++;
        continue;
      }
      status = runningStatus;
    } else {
      pos.i++;
      if (status >= 0x80 && status <= 0xef) runningStatus = status;
    }

    const type = status & 0xf0;

    if (type === 0x90) {
      const note = data[pos.i++]!;
      const vel = data[pos.i++]!;
      if (vel > 0) {
        active.set(note, { startTick: tick, velocity: vel });
      } else {
        const start = active.get(note);
        if (start) {
          notes.push({
            midi: note,
            startSec: tickToSeconds(start.startTick, ticksPerBeat, tempoMap),
            endSec: tickToSeconds(tick, ticksPerBeat, tempoMap),
            velocity: start.velocity,
            cents: 0,
          });
          active.delete(note);
        }
      }
    } else if (type === 0x80) {
      const note = data[pos.i++]!;
      pos.i++;
      const start = active.get(note);
      if (start) {
        notes.push({
          midi: note,
          startSec: tickToSeconds(start.startTick, ticksPerBeat, tempoMap),
          endSec: tickToSeconds(tick, ticksPerBeat, tempoMap),
          velocity: start.velocity,
          cents: 0,
        });
        active.delete(note);
      }
    } else if (status === 0xff) {
      const meta = data[pos.i++]!;
      const len = readVarLen(data, pos);
      if (meta === 0x51 && len === 3) {
        const us = (data[pos.i]! << 16) | (data[pos.i + 1]! << 8) | data[pos.i + 2]!;
        if (us > 0) tempoMap.push({ tick, usPerBeat: us });
        pos.i += len;
      } else if (meta === 0x2f) {
        break;
      } else {
        pos.i += len;
      }
    } else if (status === 0xf0 || status === 0xf7) {
      const len = readVarLen(data, pos);
      pos.i += len;
    } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
      pos.i += 2;
    } else if (type === 0xc0 || type === 0xd0) {
      pos.i += 1;
    }
  }

  for (const [note, start] of active) {
    notes.push({
      midi: note,
      startSec: tickToSeconds(start.startTick, ticksPerBeat, tempoMap),
      endSec: tickToSeconds(tick, ticksPerBeat, tempoMap),
      velocity: start.velocity,
      cents: 0,
    });
  }

  return { notes: notes.sort((a, b) => a.startSec - b.startSec), tempoMap };
}

function bpmFromTempoMap(tempoMap: TempoPoint[]): number {
  const us = tempoMap[0]?.usPerBeat ?? 500_000;
  return Math.max(1, Math.round(60_000_000 / us));
}

/** Parse Standard MIDI File (type 0/1) into timed notes in seconds. */
export function parseMidiFile(buffer: ArrayBuffer): {
  notes: TranscribedNote[];
  durationSec: number;
  bpm: number;
  ticksPerBeat: number;
  detectedBpm: number;
} {
  const data = new Uint8Array(buffer);
  const sig = String.fromCharCode(...data.subarray(0, 4));
  if (sig !== "MThd") throw new Error("Not a MIDI file");

  const headerLen = (data[4]! << 24) | (data[5]! << 16) | (data[6]! << 8) | data[7]!;
  const nTracks = (data[10]! << 8) | data[11]!;
  const division = (data[12]! << 8) | data[13]!;
  let pos = 8 + headerLen;

  if (division & 0x8000) {
    throw new Error(
      "SMPTE division MIDI not supported — export as PPQ (ticks per quarter) from your DAW",
    );
  }

  const ticksPerBeat = division > 0 ? division : 480;
  const defaultTempoUs = 500_000;
  const allNotes: TranscribedNote[] = [];
  let masterTempoMap: TempoPoint[] = [{ tick: 0, usPerBeat: defaultTempoUs }];

  for (let t = 0; t < nTracks; t++) {
    const trackSig = String.fromCharCode(...data.subarray(pos, pos + 4));
    if (trackSig !== "MTrk") break;
    const trackLen =
      (data[pos + 4]! << 24) | (data[pos + 5]! << 16) | (data[pos + 6]! << 8) | data[pos + 7]!;
    pos += 8;
    const trackData = data.subarray(pos, pos + trackLen);
    const parsed = parseTrack(trackData, ticksPerBeat, defaultTempoUs);
    if (t === 0 && parsed.tempoMap.length) masterTempoMap = parsed.tempoMap;
    allNotes.push(...parsed.notes);
    pos += trackLen;
  }

  const durationSec = allNotes.reduce((m, n) => Math.max(m, n.endSec), 0);
  const detectedBpm = bpmFromTempoMap(masterTempoMap);

  return {
    notes: allNotes.sort((a, b) => a.startSec - b.startSec),
    durationSec,
    bpm: detectedBpm,
    detectedBpm,
    ticksPerBeat,
  };
}
