import type { Analysis } from "./schemas";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MAJOR_PROGRESSIONS = [
  ["I", "IV", "V", "I"],
  ["I", "V", "vi", "IV"],
  ["I", "vi", "IV", "V"],
  ["ii", "V", "I", "vi"],
];

const MINOR_PROGRESSIONS = [
  ["i", "iv", "V", "i"],
  ["i", "VI", "III", "VII"],
  ["i", "V", "VI", "IV"],
  ["i", "VII", "VI", "V"],
];

function parseKey(key: string): { rootIndex: number; isMinor: boolean; root: string } {
  const trimmed = key.trim();
  const isMinor = /minor/i.test(trimmed);
  const root = trimmed.replace(/\s*(major|minor)/i, "").trim();
  const rootIndex = NOTE_NAMES.indexOf(root);
  return { rootIndex: rootIndex >= 0 ? rootIndex : 0, isMinor, root };
}

function noteAt(rootIndex: number, semitones: number): string {
  return NOTE_NAMES[(rootIndex + semitones + 120) % 12];
}

function romanToSymbol(roman: string, rootIndex: number, keyIsMinor: boolean): string {
  const r = roman.replace(/[^IViv]/g, "");
  const majorSteps: Record<string, number> = {
    I: 0,
    II: 2,
    III: 4,
    IV: 5,
    V: 7,
    VI: 9,
    VII: 11,
  };
  const minorSteps: Record<string, number> = {
    i: 0,
    ii: 2,
    III: 3,
    iii: 3,
    iv: 5,
    v: 7,
    V: 7,
    VI: 8,
    vi: 8,
    VII: 10,
    vii: 10,
  };

  const steps = keyIsMinor ? minorSteps : majorSteps;
  const semitones = steps[r] ?? 0;
  const note = noteAt(rootIndex, semitones);

  if (r === r.toLowerCase() && r !== "v" && r !== "V") return `${note}m`;
  if (keyIsMinor && r === "V") return note;
  if (!keyIsMinor && (r === "ii" || r === "iii" || r === "vi" || r === "vii")) return `${note}m`;
  return note;
}

function pickProgression(bpm: number, key: string, isMinor: boolean): string[] {
  const pool = isMinor ? MINOR_PROGRESSIONS : MAJOR_PROGRESSIONS;
  const idx = Math.abs((Math.round(bpm) * 7 + key.length * 3) % pool.length);
  return pool[idx];
}

function buildDownbeats(durationSec: number, bpm: number): number[] {
  const beatSec = 60 / bpm;
  const beats: number[] = [];
  for (let t = 0; t < durationSec; t += beatSec * 4) {
    beats.push(Number(t.toFixed(3)));
  }
  return beats.slice(0, 64);
}

/** Zero-API-key chord/section analysis from detected key + tempo. */
export function enrichAnalysisHeuristically(base: Analysis, durationSec = 180): Analysis {
  const { rootIndex, isMinor } = parseKey(base.key);
  const progression = pickProgression(base.bpm, base.key, isMinor);
  const barSec = (60 / base.bpm) * 4;
  const totalBars = Math.max(8, Math.round(durationSec / barSec));
  const chordBars = Math.max(1, Math.floor(totalBars / progression.length));

  const chords = progression.map((roman, i) => {
    const t0 = i * chordBars * barSec;
    const t1 = Math.min(durationSec, (i + 1) * chordBars * barSec);
    return {
      t0: Number(t0.toFixed(2)),
      t1: Number(t1.toFixed(2)),
      symbol: romanToSymbol(roman, rootIndex, isMinor),
      roman,
      confidence: 55,
    };
  });

  const sectionDefs =
    durationSec >= 120
      ? [
          { name: "Intro", ratio: 0.12 },
          { name: "Verse", ratio: 0.28 },
          { name: "Chorus", ratio: 0.28 },
          { name: "Verse", ratio: 0.2 },
          { name: "Outro", ratio: 0.12 },
        ]
      : [
          { name: "Intro", ratio: 0.15 },
          { name: "Main", ratio: 0.7 },
          { name: "Outro", ratio: 0.15 },
        ];

  let cursor = 0;
  const sections = sectionDefs.map(({ name, ratio }) => {
    const t0 = cursor;
    const t1 = Math.min(durationSec, cursor + durationSec * ratio);
    cursor = t1;
    return {
      name,
      t0: Number(t0.toFixed(2)),
      t1: Number(t1.toFixed(2)),
      bars: Math.max(1, Math.round((t1 - t0) / barSec)),
    };
  });

  return {
    ...base,
    chords: chords.length ? chords : base.chords,
    sections: sections.length ? sections : base.sections,
    downbeats: buildDownbeats(durationSec, base.bpm),
    style_compatibility: base.style_compatibility.length
      ? base.style_compatibility
      : isMinor
        ? ["pop", "r&b", "electronic"]
        : ["pop", "rock", "electronic"],
    timbre_descriptors: base.timbre_descriptors ?? {
      spectral_centroid: "mid",
      harmonicity: 0.6,
      brightness: 0.5,
      warmth: 0.5,
      attack: "medium",
    },
  };
}
