import { describe, expect, it } from "vitest";
import { buildMidiFile } from "./midi-export";

function readVarLen(data: Uint8Array, offset: number): { value: number; next: number } {
  let value = 0;
  let i = offset;
  while (i < data.length) {
    const b = data[i]!;
    value = (value << 7) | (b & 0x7f);
    i++;
    if ((b & 0x80) === 0) break;
  }
  return { value, next: i };
}

function parseSmfEvents(trackData: Uint8Array): { status: number; tick: number }[] {
  const events: { status: number; tick: number }[] = [];
  let tick = 0;
  let i = 0;
  let runningStatus = 0;
  while (i < trackData.length) {
    const { value: delta, next } = readVarLen(trackData, i);
    tick += delta;
    i = next;
    if (i >= trackData.length) break;

    let status = trackData[i]!;
    if (status === 0xff) {
      i++;
      const metaType = trackData[i++]!;
      const len = trackData[i++]!;
      i += len;
      if (metaType === 0x2f) break;
      continue;
    }
    if (status === 0xf0 || status === 0xf7) {
      const { value: len, next: afterLen } = readVarLen(trackData, i + 1);
      i = afterLen + len;
      continue;
    }
    if (status < 0x80) {
      status = runningStatus;
      i--;
    } else {
      runningStatus = status;
      i++;
    }

    const hi = status & 0xf0;
    events.push({ status: hi, tick });
    if (hi === 0xc0 || hi === 0xd0) {
      i++;
    } else if (hi === 0x80 || hi === 0x90 || hi === 0xa0 || hi === 0xb0 || hi === 0xe0) {
      i += 2;
    }
  }
  return events;
}

function parseMidiFile(buf: Buffer): {
  ticksPerBeat: number;
  tracks: { status: number; tick: number }[][];
} {
  expect(buf.slice(0, 4).toString("ascii")).toBe("MThd");
  const ticksPerBeat = buf.readUInt16BE(12);
  const trackCount = buf.readUInt16BE(10);
  const tracks: { status: number; tick: number }[][] = [];
  let offset = 14;
  for (let t = 0; t < trackCount; t++) {
    expect(buf.slice(offset, offset + 4).toString("ascii")).toBe("MTrk");
    const trackLen = buf.readUInt32BE(offset + 4);
    const trackData = buf.subarray(offset + 8, offset + 8 + trackLen);
    tracks.push(parseSmfEvents(trackData));
    offset += 8 + trackLen;
  }
  return { ticksPerBeat, tracks };
}

describe("buildMidiFile meend", () => {
  it("embeds pitch bend events when expression.meend is set", () => {
    const buf = buildMidiFile(
      [
        {
          name: "Lead",
          midiEvents: [{ note: 60, velocity: 90, startBeat: 0, duration: 1 }],
          expression: { meend: true },
        },
      ],
      120,
    );
    const plain = buildMidiFile(
      [{ name: "Lead", midiEvents: [{ note: 60, velocity: 90, startBeat: 0, duration: 1 }] }],
      120,
    );
    expect(buf.length).toBeGreaterThan(plain.length);
  });

  it("writes valid SMF with 480 TPQ and pitch bends during sustained notes", () => {
    const buf = buildMidiFile(
      [
        {
          name: "Voice 1",
          midiEvents: [
            { note: 60, velocity: 90, startBeat: 0, duration: 1 },
            { note: 64, velocity: 90, startBeat: 1, duration: 1 },
          ],
          expression: { meend: true },
        },
      ],
      120,
    );

    expect(buf.slice(0, 4).toString("ascii")).toBe("MThd");
    const { ticksPerBeat, tracks } = parseMidiFile(buf);
    expect(ticksPerBeat).toBe(480);

    const noteTrack = tracks[0]!;
    const noteOn = noteTrack.find((e) => e.status === 0x90);
    const noteOff = noteTrack.find((e) => e.status === 0x80);
    const bend = noteTrack.find((e) => e.status === 0xe0);
    expect(noteOn).toBeDefined();
    expect(noteOff).toBeDefined();
    expect(bend).toBeDefined();
    expect(bend!.tick).toBeGreaterThan(noteOn!.tick);
    expect(bend!.tick).toBeLessThan(noteOff!.tick);
  });

  it("skips empty stems so multitrack files stay importable", () => {
    const buf = buildMidiFile(
      [
        { name: "Empty", midiEvents: [] },
        {
          name: "Lead",
          midiEvents: [{ note: 60, velocity: 90, startBeat: 0, duration: 1 }],
        },
      ],
      120,
    );
    const { tracks } = parseMidiFile(buf);
    expect(tracks.length).toBe(1);
  });
});
