const NOTE_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function parseRoot(root: string | number): number {
  if (typeof root === "number" && root >= 0 && root <= 11) return root;
  const s = String(root).trim();
  if (!s) return 0;
  const m = s.match(/^([A-Ga-g])([#b♯♭]?)/);
  if (!m) return 0;
  const letter = m[1].toUpperCase();
  const acc = m[2];
  let base = ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as Record<string, number>)[letter] ?? 0;
  if (acc === "#" || acc === "♯") base = (base + 1) % 12;
  if (acc === "b" || acc === "♭") base = (base + 11) % 12;
  return base;
}

export function rootLabel(pc: number, preferFlats?: boolean): string {
  const names = preferFlats ? NOTE_FLAT : NOTE_SHARP;
  return names[((pc % 12) + 12) % 12];
}

function uniqSortedIntervals(arr: number[]): number[] {
  const seen: Record<number, boolean> = {};
  const out: number[] = [];
  for (const v of arr) {
    const n = ((v % 12) + 12) % 12;
    if (!seen[n]) {
      seen[n] = true;
      out.push(n);
    }
  }
  return out.sort((a, b) => a - b);
}

function mergeIntervals(base: number[], add: number[]): number[] {
  return uniqSortedIntervals([...base, ...add]);
}

function intervalsToSemitonesFromRoot(intervals: number[]): number[] {
  if (!intervals.length) return [];
  const semis = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    let candidate = intervals[i];
    while (candidate <= semis[semis.length - 1]) candidate += 12;
    semis.push(candidate);
  }
  return semis;
}

export interface ChordDef {
  id: string;
  symbol: string;
  name: string;
  intervals: number[];
  tags: string[];
}

const registry: Record<string, ChordDef> = {};
let listCache: ChordDef[] | null = null;

function register(
  id: string,
  symbol: string,
  name: string,
  intervals: number[],
  tags: string[] = [],
) {
  if (registry[id]) return;
  registry[id] = { id, symbol, name, intervals: uniqSortedIntervals(intervals), tags };
}

function addTag(tags: string[], t: string) {
  if (!tags.includes(t)) tags.push(t);
}

register("maj", "", "Major triad", [0, 4, 7], ["triad", "basic"]);
register(
  "min",
  "m",
  "Minor triad",
  [0, 3, 7],
  ["triad", "basic", "brazilian", "neo-soul", "gospel"],
);
register("dim", "dim", "Diminished triad", [0, 3, 6], ["triad", "basic", "jazz"]);
register("aug", "aug", "Augmented triad", [0, 4, 8], ["triad", "basic", "jazz"]);
register("sus2", "sus2", "Suspended 2nd", [0, 2, 7], ["triad", "sus", "neo-soul"]);
register("sus4", "sus4", "Suspended 4th", [0, 5, 7], ["triad", "sus", "gospel", "brazilian"]);
register("add9", "add9", "Add 9", [0, 4, 7, 14], ["triad", "extension", "neo-soul"]);
register(
  "madd9",
  "madd9",
  "Minor add 9",
  [0, 3, 7, 14],
  ["triad", "extension", "brazilian", "neo-soul"],
);

register("maj7", "maj7", "Major 7th", [0, 4, 7, 11], ["7th", "jazz", "brazilian", "neo-soul"]);
register(
  "min7",
  "m7",
  "Minor 7th",
  [0, 3, 7, 10],
  ["7th", "jazz", "brazilian", "neo-soul", "gospel"],
);
register("dom7", "7", "Dominant 7th", [0, 4, 7, 10], ["7th", "jazz", "brazilian", "gospel"]);
register("min7b5", "m7♭5", "Half-diminished", [0, 3, 6, 10], ["7th", "jazz", "brazilian"]);
register("dim7", "dim7", "Diminished 7th", [0, 3, 6, 9], ["7th", "jazz", "gospel"]);
register("mM7", "mM7", "Minor-major 7th", [0, 3, 7, 11], ["7th", "jazz", "brazilian", "neo-soul"]);
register("aug7", "aug7", "Augmented 7th", [0, 4, 8, 10], ["7th", "jazz"]);
register("maj7sus4", "maj7sus4", "Major 7 sus4", [0, 5, 7, 11], ["7th", "sus", "neo-soul"]);
register("7sus4", "7sus4", "Dominant 7 sus4", [0, 5, 7, 10], ["7th", "sus", "gospel", "neo-soul"]);

register("maj6", "6", "Major 6th", [0, 4, 7, 9], ["6th", "brazilian", "jazz"]);
register("min6", "m6", "Minor 6th", [0, 3, 7, 9], ["6th", "brazilian", "jazz"]);
register("maj69", "6/9", "Major 6/9", [0, 4, 7, 9, 14], ["6th", "brazilian", "neo-soul", "jazz"]);
register("min69", "m6/9", "Minor 6/9", [0, 3, 7, 9, 14], ["6th", "brazilian", "neo-soul"]);

register("maj9", "maj9", "Major 9th", [0, 4, 7, 11, 14], ["9th", "jazz", "brazilian", "neo-soul"]);
register(
  "min9",
  "m9",
  "Minor 9th",
  [0, 3, 7, 10, 14],
  ["9th", "jazz", "brazilian", "neo-soul", "gospel"],
);
register("dom9", "9", "Dominant 9th", [0, 4, 7, 10, 14], ["9th", "jazz", "brazilian", "gospel"]);
register(
  "7b9",
  "7♭9",
  "Dominant 7 ♭9",
  [0, 4, 7, 10, 13],
  ["9th", "altered", "jazz", "brazilian", "gospel"],
);
register(
  "7sharp9",
  "7♯9",
  "Dominant 7 ♯9",
  [0, 4, 7, 10, 15],
  ["9th", "altered", "jazz", "neo-soul"],
);
register(
  "mM9",
  "mM9",
  "Minor-major 9",
  [0, 3, 7, 11, 14],
  ["9th", "jazz", "brazilian", "neo-soul"],
);

register(
  "min11",
  "m11",
  "Minor 11th",
  [0, 3, 7, 10, 14, 17],
  ["11th", "jazz", "brazilian", "neo-soul", "gospel"],
);
register("dom11", "11", "Dominant 11th", [0, 4, 7, 10, 14, 17], ["11th", "jazz"]);
register(
  "maj7sharp11",
  "maj7♯11",
  "Lydian major 7",
  [0, 4, 7, 11, 18],
  ["11th", "jazz", "brazilian", "neo-soul"],
);
register(
  "7sharp11",
  "7♯11",
  "Dominant 7 ♯11",
  [0, 4, 7, 10, 18],
  ["11th", "altered", "jazz", "brazilian"],
);

register("maj13", "maj13", "Major 13th", [0, 4, 7, 11, 14, 21], ["13th", "jazz", "brazilian"]);
register(
  "min13",
  "m13",
  "Minor 13th",
  [0, 3, 7, 10, 14, 21],
  ["13th", "jazz", "neo-soul", "gospel"],
);
register(
  "dom13",
  "13",
  "Dominant 13th",
  [0, 4, 7, 10, 14, 21],
  ["13th", "jazz", "brazilian", "gospel"],
);
register(
  "maj13sharp11",
  "maj13♯11",
  "Major 13 ♯11",
  [0, 4, 7, 11, 14, 18, 21],
  ["13th", "jazz", "brazilian"],
);
register(
  "alt",
  "alt",
  "Altered scale chord",
  [0, 4, 8, 10, 13, 15, 18, 20],
  ["altered", "jazz", "neo-soul"],
);

register(
  "quartal3",
  "quartal(3)",
  "Three-note quartal",
  [0, 5, 10],
  ["quartal", "neo-soul", "piano"],
);
register("quartal4", "quartal(4)", "Four-note quartal", [0, 5, 10, 15], ["quartal", "neo-soul"]);
register(
  "quartal5",
  "quartal(5)",
  "Five-note quartal",
  [0, 5, 10, 15, 20],
  ["quartal", "neo-soul"],
);

register(
  "cluster_maj2",
  "cluster(maj2)",
  "Major 2nd cluster",
  [0, 2, 4],
  ["cluster", "gospel", "dense"],
);
register("power5", "5", "Power (fifth)", [0, 7], ["basic", "rock"]);

register("mu_major", "add2", "Mu major (add 2)", [0, 2, 4, 7], ["steely-dan", "studio", "add2"]);
register("maj7add2", "maj7(add2)", "Major 7 add 2", [0, 2, 4, 7, 11], ["steely-dan", "studio"]);
register("7sharp9sharp5", "7♯9♯5", "Dominant ♯9 ♯5", [0, 4, 8, 10, 15], ["steely-dan", "altered"]);
register("maj7flat5", "maj7♭5", "Major 7 ♭5", [0, 4, 6, 11], ["jobim", "brazilian", "jazz"]);
register("dom7b5", "7♭5", "Dominant 7 ♭5", [0, 4, 6, 10], ["7th", "jazz", "brazilian"]);
register("dom7sharp5", "7♯5", "Dominant 7 ♯5", [0, 4, 8, 10], ["7th", "jazz"]);
register("9sus4", "9sus4", "9 sus4", [0, 2, 5, 7, 10], ["sus", "gospel", "neo-soul"]);
register("13sus4", "13sus4", "13 sus4", [0, 5, 7, 10, 14, 21], ["sus", "gospel", "jazz"]);
register("maj9sharp11", "maj9♯11", "Major 9 ♯11", [0, 4, 7, 11, 14, 18], ["jazz", "steely-dan"]);
register("min9sharp11", "m9♯11", "Minor 9 ♯11", [0, 3, 7, 10, 14, 18], ["neo-soul", "jazz"]);

register("tj_open4", "open4", "Open fourth dyad", [0, 5], ["tom-johnson", "minimal"]);
register("tj_open5", "open5+", "Open fifth + add-2", [0, 2, 7], ["tom-johnson", "minimal"]);
register(
  "tj_trichord_014",
  "014",
  "Trichord 0-1-4",
  [0, 1, 4],
  ["tom-johnson", "minimal", "dense"],
);
register("tj_trichord_015", "015", "Trichord 0-1-5", [0, 1, 5], ["tom-johnson", "minimal"]);

const domBase = [0, 4, 7, 10];
const altTones = [
  { semi: 13, sym: "♭9" },
  { semi: 14, sym: "9" },
  { semi: 15, sym: "♯9" },
  { semi: 17, sym: "11" },
  { semi: 18, sym: "♯11" },
  { semi: 20, sym: "♭13" },
  { semi: 21, sym: "13" },
];
for (let mask = 1; mask < 128; mask++) {
  const parts: string[] = [];
  const semis: number[] = [];
  for (let b = 0; b < altTones.length; b++) {
    if (mask & (1 << b)) {
      parts.push(altTones[b].sym.replace(/♭/g, "b").replace(/♯/g, "s"));
      semis.push(altTones[b].semi);
    }
  }
  if (semis.length > 5) continue;
  let id = "dom7alt_" + parts.join("_");
  if (id.length > 48) id = "dom7alt_" + mask;
  const sym = "7(" + parts.join(",") + ")";
  const intervals = mergeIntervals(domBase, semis);
  register(id, sym, "Dominant altered combination", intervals, [
    "generated",
    "dominant",
    "jazz",
    "neo-soul",
    "steely-dan",
    "studio",
  ]);
}

const maj7b = [0, 4, 7, 11];
const majExt = [
  { semi: 14, sym: "9" },
  { semi: 18, sym: "♯11" },
  { semi: 21, sym: "13" },
];
for (let m2 = 1; m2 < 8; m2++) {
  const p2: string[] = [];
  const s2: number[] = [];
  for (let b2 = 0; b2 < 3; b2++) {
    if (m2 & (1 << b2)) {
      p2.push(majExt[b2].sym.replace(/♯/g, "#"));
      s2.push(majExt[b2].semi);
    }
  }
  if (!s2.length) continue;
  register(
    "maj7ext_" + p2.join("_"),
    "maj7(" + p2.join(",") + ")",
    "Major 7 extended",
    mergeIntervals(maj7b, s2),
    ["maj7", "generated", "brazilian", "steely-dan", "studio"],
  );
}

const min7b = [0, 3, 7, 10];
const minExt = [
  { semi: 14, sym: "9" },
  { semi: 17, sym: "11" },
  { semi: 20, sym: "♭13" },
];
for (let m3 = 1; m3 < 8; m3++) {
  const p3: string[] = [];
  const s3: number[] = [];
  for (let b3 = 0; b3 < 3; b3++) {
    if (m3 & (1 << b3)) {
      p3.push(minExt[b3].sym.replace(/♭/g, "b").replace(/♯/g, "#"));
      s3.push(minExt[b3].semi);
    }
  }
  register(
    "min7ext_" + p3.join("_"),
    "m7(" + p3.join(",") + ")",
    "Minor 7 extended",
    mergeIntervals(min7b, s3),
    ["m7", "generated", "brazilian", "neo-soul", "studio"],
  );
}

function invalidateListCache() {
  listCache = null;
}

function getAll(): ChordDef[] {
  if (!listCache) {
    listCache = Object.keys(registry).map((k) => registry[k]);
    listCache.sort((a, b) => a.name.localeCompare(b.name));
  }
  return listCache.slice();
}

export function list(filters?: { tag?: string; q?: string }): ChordDef[] {
  const all = getAll();
  return all.filter((c) => {
    if (filters?.tag && !c.tags.includes(filters.tag)) return false;
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      if (
        !c.id.toLowerCase().includes(q) &&
        !c.name.toLowerCase().includes(q) &&
        !c.symbol.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

export function get(id: string): ChordDef | null {
  return registry[id] || null;
}

export function notes(
  root: string | number,
  chordId: string,
  options?: { preferFlats?: boolean },
): { rootName: string; notes: string[]; midi: number[] } | null {
  const def = get(chordId);
  if (!def) return null;
  const pc = parseRoot(root);
  const preferFlats = options?.preferFlats;
  const names = preferFlats ? NOTE_FLAT : NOTE_SHARP;
  const semis = intervalsToSemitonesFromRoot(def.intervals);
  const out: string[] = [];
  const midiArr: number[] = [];
  for (const s of semis) {
    const p = (((pc + s) % 12) + 12) % 12;
    out.push(names[p]);
    midiArr.push(60 + pc + s);
  }
  return { rootName: rootLabel(pc, preferFlats), notes: out, midi: midiArr };
}

export function midiVoicing(root: string | number, chordId: string, baseOctave = 4): number[] {
  const def = get(chordId);
  if (!def) return [];
  const rootPc = parseRoot(root);
  const rootMidi = 12 * (baseOctave + 1) + rootPc;
  return intervalsToSemitonesFromRoot(def.intervals).map((s) => rootMidi + s);
}

function invertPitchClasses(pcs: number[], inversion: number): number[] {
  const arr = [...pcs].sort((a, b) => a - b);
  const n = arr.length;
  let inv = (inversion || 0) % n;
  if (inv < 0) inv += n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(i + inv) % n]);
  return out;
}

export function voicing(
  root: string | number,
  chordId: string,
  opts?: { inversion?: number; spread?: number; octave?: number; preferFlats?: boolean },
): { midi: number[]; notes: string[]; chordId: string; inversion: number } | null {
  const def = get(chordId);
  if (!def) return null;
  const pc = parseRoot(root);
  const inv = opts?.inversion || 0;
  const spread = opts?.spread || 0;
  const pcs = def.intervals.map((x) => (pc + x) % 12);
  const order = invertPitchClasses(pcs, inv);
  const midi: number[] = [];
  const octave = opts?.octave ?? 3;
  const base = 12 * (octave + 1);
  let last = -1;
  for (let i = 0; i < order.length; i++) {
    let m = base + order[i];
    while (m <= last) m += 12;
    m += spread * i * 12;
    while (m <= last) m += 12;
    midi.push(m);
    last = m;
  }
  const noteNames = midi.map((m) => rootLabel(m % 12, opts?.preferFlats));
  return { midi, notes: noteNames, chordId, inversion: inv };
}

export function displaySymbol(root: string | number, chordId: string): string {
  const def = get(chordId);
  if (!def) return String(root);
  return rootLabel(parseRoot(root), false) + (def.symbol || "");
}

export function randomChord(tag?: string): ChordDef | null {
  const pool = tag ? list({ tag }) : getAll();
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function registerCustom(
  id: string,
  symbol: string,
  name: string,
  intervals: number[],
  tags: string[],
) {
  register(id, symbol, name, intervals, tags);
  invalidateListCache();
}

export const TAGS = [
  "basic",
  "triad",
  "7th",
  "9th",
  "11th",
  "13th",
  "altered",
  "sus",
  "quartal",
  "cluster",
  "brazilian",
  "neo-soul",
  "gospel",
  "jazz",
  "piano",
  "generated",
  "steely-dan",
  "studio",
  "tom-johnson",
  "minimal",
  "dense",
  "add2",
  "rock",
  "dominant",
  "m7",
  "maj7",
  "extension",
];

export function chordsInKey(
  rootStr: string,
  mode: "major" | "minor",
): { degree: number; roman: string; rootPc: number; chordId: string; symbol: string }[] {
  const rootPc = parseRoot(rootStr);
  const majorSteps = [0, 2, 4, 5, 7, 9, 11];
  const minorSteps = [0, 2, 3, 5, 7, 8, 10];
  const steps = mode === "minor" ? minorSteps : majorSteps;
  const majorQualities = ["maj7", "min7", "min7", "maj7", "dom7", "min7", "min7b5"];
  const minorQualities = ["min7", "min7b5", "maj7", "min7", "min7", "maj7", "dom7"];
  const majorRomans = ["Imaj7", "ii7", "iii7", "IVmaj7", "V7", "vi7", "viiø7"];
  const minorRomans = ["i7", "iiø7", "IIImaj7", "iv7", "v7", "VImaj7", "VII7"];
  const qualities = mode === "minor" ? minorQualities : majorQualities;
  const romans = mode === "minor" ? minorRomans : majorRomans;
  return steps.map((step, i) => ({
    degree: i + 1,
    roman: romans[i],
    rootPc: (rootPc + step) % 12,
    chordId: qualities[i],
    symbol: rootLabel((rootPc + step) % 12) + (get(qualities[i])?.symbol || ""),
  }));
}
