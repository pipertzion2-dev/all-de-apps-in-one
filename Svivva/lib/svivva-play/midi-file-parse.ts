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

/**
 * Two-step track parser. When `externalTempoMap` is provided (Type 1 MIDI: all
 * notes tracks share the conductor track's tempo), use it for tick→sec conversion
 * instead of building a local map. The local map is still returned so the caller
 * can merge it into the master tempo map.
 */
function parseTrack(
  data: Uint8Array,
  ticksPerBeat: number,
  initialTempoUs: number,
  externalTempoMap?: TempoPoint[],
): { notes: TranscribedNote[]; tempoMap: TempoPoint[] } {
  const notes: TranscribedNote[] = [];
  const active = new Map<number, { startTick: number; velocity: number }>();
  const localTempoMap: TempoPoint[] = [{ tick: 0, usPerBeat: initialTempoUs }];
  const pos = { i: 0 };
  let tick = 0;
  let runningStatus = 0;

  const secFor = (t: number) => tickToSeconds(t, ticksPerBeat, externalTempoMap ?? localTempoMap);

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
            startSec: secFor(start.startTick),
            endSec: secFor(tick),
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
          startSec: secFor(start.startTick),
          endSec: secFor(tick),
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
        if (us > 0) localTempoMap.push({ tick, usPerBeat: us });
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
      startSec: secFor(start.startTick),
      endSec: secFor(tick),
      velocity: start.velocity,
      cents: 0,
    });
  }

  return { notes: notes.sort((a, b) => a.startSec - b.startSec), tempoMap: localTempoMap };
}

function bpmFromTempoMap(tempoMap: TempoPoint[]): number {
  const us = tempoMap[0]?.usPerBeat ?? 500_000;
  return Math.max(1, Math.round(60_000_000 / us));
}

/**
 * Locate every MTrk chunk and return [offset, length] pairs.
 * Tolerates garbage bytes between chunks (some DAW exports add padding).
 */
function findTrackChunks(data: Uint8Array, startPos: number, nTracks: number) {
  const chunks: { offset: number; length: number }[] = [];
  let pos = startPos;
  while (chunks.length < nTracks && pos + 8 <= data.length) {
    const sig = String.fromCharCode(data[pos]!, data[pos + 1]!, data[pos + 2]!, data[pos + 3]!);
    if (sig !== "MTrk") {
      pos++;
      continue;
    }
    const len =
      (data[pos + 4]! << 24) | (data[pos + 5]! << 16) | (data[pos + 6]! << 8) | data[pos + 7]!;
    chunks.push({ offset: pos + 8, length: len });
    pos += 8 + len;
  }
  return chunks;
}

/** Parse Standard MIDI File (type 0/1) into timed notes in seconds.
 *
 * Two-pass for Type 1 files: pass 1 builds the master tempo map by scanning
 * ALL tracks; pass 2 converts tick positions to seconds using that map.
 * This ensures notes on tracks 1+ (which typically carry no tempo events) are
 * timed correctly when the file BPM differs from the MIDI default 120 BPM.
 */
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

  if (division & 0x8000) {
    throw new Error(
      "SMPTE division MIDI not supported — export as PPQ (ticks per quarter) from your DAW",
    );
  }

  const ticksPerBeat = division > 0 ? division : 480;
  const defaultTempoUs = 500_000;

  const chunks = findTrackChunks(data, 8 + headerLen, nTracks);

  // Pass 1 — build master tempo map from ALL tracks (handles tempo on any track).
  let masterTempoMap: TempoPoint[] = [{ tick: 0, usPerBeat: defaultTempoUs }];
  for (const chunk of chunks) {
    const trackData = data.subarray(chunk.offset, chunk.offset + chunk.length);
    const { tempoMap } = parseTrack(trackData, ticksPerBeat, defaultTempoUs);
    if (tempoMap.length > 1) {
      // Merge this track's tempo events into master map and re-sort by tick.
      const merged = [...masterTempoMap, ...tempoMap.slice(1)].sort((a, b) => a.tick - b.tick);
      // Deduplicate (keep last if same tick).
      masterTempoMap = merged.filter(
        (pt, i, arr) => i === arr.length - 1 || pt.tick !== arr[i + 1]!.tick,
      );
    }
  }

  // Pass 2 — parse all notes using the master tempo map for accurate tick→sec.
  const allNotes: TranscribedNote[] = [];
  for (const chunk of chunks) {
    const trackData = data.subarray(chunk.offset, chunk.offset + chunk.length);
    const { notes } = parseTrack(trackData, ticksPerBeat, defaultTempoUs, masterTempoMap);
    allNotes.push(...notes);
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
