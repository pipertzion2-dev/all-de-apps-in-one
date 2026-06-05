/**
 * Deterministic Neo-Soul Chord Engine
 * Inspired by Robert Glasper and Ivan Lins harmonic language.
 * Bypasses LLM entirely — pure music theory.
 */

export interface ChordMidiEvent {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
  channel: number;
}

export interface ChordStem {
  name: string;
  role: string;
  instrumentHint: string;
  midiEvents: ChordMidiEvent[];
  pan: number;
  gainDb: number;
  muted: boolean;
  soloed: boolean;
}

// ─── Note utilities ────────────────────────────────────────────────────────

const NOTE_NAMES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function midi(pitchClass: number, octave: number): number {
  return (octave + 1) * 12 + (((pitchClass % 12) + 12) % 12);
}

function parseKey(keyStr: string): { root: number; isMinor: boolean } {
  const match = keyStr.match(/^([A-G][b#]?)/);
  const root = match ? (NOTE_NAMES[match[1]] ?? 0) : 0;
  const isMinor = /minor/i.test(keyStr);
  return { root, isMinor };
}

// ─── Scale building ─────────────────────────────────────────────────────────

// Intervals in semitones from root
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const DORIAN_STEPS = [0, 2, 3, 5, 7, 9, 10]; // Glasper uses Dorian for minor
const NATURAL_MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

function buildScale(root: number, isMinor: boolean): number[] {
  // Use Dorian for minor (Glasper's preferred minor mode — has raised 6th)
  const steps = isMinor ? DORIAN_STEPS : MAJOR_STEPS;
  return steps.map((s) => (root + s) % 12);
}

// ─── Chord voicing builder ──────────────────────────────────────────────────

/**
 * Build a neo-soul voicing: bass root low + cluster of extensions in mid-high range.
 * Glasper technique: tight cluster of 9th/3rd/11th in right hand.
 */
function buildVoicing(
  root: number,
  chordTones: number[], // pitch classes (0-11) of ALL chord tones in order
  bassOctave = 2,
): number[] {
  const notes: number[] = [];

  // Bass: root alone
  notes.push(midi(root, bassOctave));

  // Upper voicing: place chord tones starting from octave 4, ascending
  // Skip root and 5th in upper voicing for a more open, jazz feel
  const upperTones = chordTones.filter((t) => t !== root % 12);
  let currentMidi = midi(upperTones[0], 4);

  for (const tone of upperTones) {
    let candidate = midi(tone, 4);
    // Push up octave until above previous note
    while (candidate < currentMidi) candidate += 12;
    // Cap at midi 88 (high piano range)
    if (candidate > 88) candidate -= 12;
    notes.push(candidate);
    currentMidi = candidate;
  }

  return notes;
}

// ─── Diatonic chord builder ─────────────────────────────────────────────────

interface DiatonicChord {
  label: string;
  voicing: number[]; // MIDI notes
}

/**
 * Build all 7 diatonic chords for a given key with neo-soul extensions.
 * Each chord is voiced with 7th, 9th, and where appropriate 11th/13th.
 */
function buildDiatonicChords(root: number, isMinor: boolean): DiatonicChord[] {
  const scale = buildScale(root, isMinor);
  const chords: DiatonicChord[] = [];

  for (let degree = 0; degree < 7; degree++) {
    const chordRoot = scale[degree];
    // Stack diatonic 3rds: 1-3-5-7-9 (indices: 0,2,4,6,1 from this degree)
    const tones = [
      scale[degree % 7],
      scale[(degree + 2) % 7],
      scale[(degree + 4) % 7],
      scale[(degree + 6) % 7],
      scale[(degree + 1) % 7], // 9th
      scale[(degree + 3) % 7], // 11th
    ];

    // For degree 4 (V in major, or VII in minor) — apply sus4 (Ivan Lins style)
    // Replace 3rd with 4th for the signature suspended sound
    const isSusDegree = !isMinor && degree === 4;
    let finalTones = tones;
    let label = "";
    if (isSusDegree) {
      // V13sus4: replace 3rd (index 1) with sus4 (scale degree 3 = IV note)
      const sus4 = scale[(degree + 3) % 7]; // perfect 4th above root
      finalTones = [tones[0], sus4, tones[2], tones[3], tones[4], tones[5]];
      label = "13sus4";
    } else if (!isMinor) {
      const labels = ["maj9", "m11", "m9", "maj9", "9", "m9", "m7b5"];
      label = labels[degree];
    } else {
      const labels = ["m11", "m9", "maj9", "m11", "m9", "maj9", "9sus4"];
      label = labels[degree];
    }

    const noteName =
      Object.keys(NOTE_NAMES).find(
        (k) => NOTE_NAMES[k] === chordRoot && !k.includes("b") && k.length <= 2,
      ) || String(chordRoot);

    chords.push({
      label: `${noteName}${label}`,
      voicing: buildVoicing(chordRoot, finalTones, 2),
    });
  }

  return chords;
}

// ─── Progression patterns ───────────────────────────────────────────────────

type Progression = number[]; // degree indices (0-based)

/**
 * Select a Glasper/Lins-style progression based on key mode and detected chords.
 */
function selectProgression(isMinor: boolean, seed = 0): Progression {
  const majorProgressions: Progression[] = [
    [0, 5, 3, 4], // Imaj9 → vim9 → IVmaj9 → V13sus4  ("Float" — Glasper)
    [1, 4, 0, 5], // iim11 → V13sus4 → Imaj9 → vim9   ("Black Radio")
    [5, 3, 0, 4], // vim9 → IVmaj9 → Imaj9 → V13sus4  (neo-soul staple)
    [0, 5, 1, 4], // Imaj9 → vim9 → iim11 → V13sus4   (Lins ii-Vsus)
    [3, 0, 5, 4], // IVmaj9 → Imaj9 → vim9 → V13sus4
  ];

  const minorProgressions: Progression[] = [
    [0, 6, 5, 4], // im11 → bVII → bVI → vm9   ("North Portland" — Glasper)
    [0, 5, 3, 1], // im11 → bVImaj9 → IVm11 → iim9
    [0, 3, 6, 5], // im11 → IVm11 → bVII → bVI  (D'Angelo / Erykah vibe)
    [0, 6, 5, 6], // im11 → bVII → bVI → bVII   (two-chord Glasper float)
  ];

  const pool = isMinor ? minorProgressions : majorProgressions;
  return pool[seed % pool.length];
}

// ─── MIDI event generation ──────────────────────────────────────────────────

type CompPattern = "sustained_pads" | "rhythmic_stabs" | "arpeggiated";

function generateCompEvents(
  voicing: number[],
  startBeat: number,
  barsPerChord: number,
  bpm: number,
  pattern: CompPattern,
): ChordMidiEvent[] {
  const events: ChordMidiEvent[] = [];
  const beatsPerBar = 4;
  const totalBeats = barsPerChord * beatsPerBar;

  if (pattern === "sustained_pads") {
    // All notes together, held for full chord duration, slight velocity swell
    for (const note of voicing) {
      const isBass = note < 48;
      events.push({
        note,
        velocity: isBass ? 75 : 68,
        startBeat,
        duration: totalBeats - 0.1,
        channel: 0,
      });
    }
    // Add gentle upper note re-attack halfway through for movement (Glasper comping)
    const upperNotes = voicing.filter((n) => n >= 60);
    if (upperNotes.length >= 2 && barsPerChord >= 2) {
      const midpoint = startBeat + totalBeats / 2;
      for (const note of upperNotes.slice(-2)) {
        events.push({
          note,
          velocity: 55,
          startBeat: midpoint,
          duration: totalBeats / 2 - 0.1,
          channel: 0,
        });
      }
    }
  } else if (pattern === "rhythmic_stabs") {
    // Syncopated stabs: hit on beat 1 and "and of 2" (beat 2.5)
    const hitPoints = [0, 2.5, beatsPerBar, beatsPerBar + 2.5];
    for (const offset of hitPoints) {
      if (startBeat + offset >= startBeat + totalBeats) break;
      for (const note of voicing) {
        events.push({
          note,
          velocity: note < 48 ? 80 : 72,
          startBeat: startBeat + offset,
          duration: 0.4,
          channel: 0,
        });
      }
    }
  } else {
    // Arpeggiated: each chord note on successive 16th-notes, looped
    const step = 0.25; // 16th note
    const upperOnly = voicing.slice(1); // skip bass for arpeggiation
    let beat = startBeat;
    // Bass hits on beat 1
    events.push({
      note: voicing[0],
      velocity: 75,
      startBeat,
      duration: totalBeats - 0.1,
      channel: 0,
    });
    while (beat < startBeat + totalBeats - step) {
      const idx = Math.round((beat - startBeat) / step) % upperOnly.length;
      events.push({
        note: upperOnly[idx],
        velocity: 60 + (idx === 0 ? 12 : 0), // accent first note
        startBeat: beat,
        duration: step * 1.8,
        channel: 0,
      });
      beat += step;
    }
  }

  return events;
}

// ─── Advanced chord parsing (for real analyzed chord symbols) ────────────────

/** Parse a chord symbol like "Dm7", "G7", "Cmaj7", "F#m9", "Bb13sus4" → pitch classes. */
function pitchClassesForSymbol(symbol: string): number[] {
  const rootMatch = symbol.match(/^([A-G][b#]?)/);
  if (!rootMatch) return [0, 4, 7];
  const rootPc = NOTE_NAMES[rootMatch[1]] ?? 0;
  const s = symbol.slice(rootMatch[1].length).toLowerCase();

  const intervals: number[] = [0];
  const isMinorQ = s.startsWith("m") && !s.startsWith("maj");
  const isDim = s.includes("dim") || s.includes("°");
  const isAug = s.includes("aug") || s.includes("+");
  const isSus4 = s.includes("sus4");
  const isSus2 = s.includes("sus2");
  const hasMaj7 = s.includes("maj7") || s.includes("∆7") || s.includes("△7");
  const hasDom7 = !hasMaj7 && (s.includes("7") || s.includes("9") || s.includes("11") || s.includes("13"));
  const has9 = s.includes("9") || s.includes("add9");
  const has11 = s.includes("11") || s.includes("add11") || s.includes("sus");
  const has13 = s.includes("13");

  // Third
  if (isSus4) intervals.push(5);
  else if (isSus2) intervals.push(2);
  else if (isDim) intervals.push(3);
  else if (isMinorQ) intervals.push(3);
  else intervals.push(4);

  // Fifth
  if (isDim) intervals.push(6);
  else if (isAug) intervals.push(8);
  else intervals.push(7);

  // Seventh
  if (hasMaj7) intervals.push(11);
  else if (isDim && (s.includes("7") || s.includes("dim7"))) intervals.push(9);
  else if (hasDom7) intervals.push(10);

  // Extensions
  if (has9) intervals.push(14 % 12 === 2 ? 14 : 2); // 9th = major 2nd up an octave, store as 2
  if (has11) intervals.push(5);
  if (has13) intervals.push(9);

  const unique = [...new Set(intervals.map((p) => ((rootPc + p) % 12)))];
  return unique.sort((a, b) => a - b);
}

/** Build a close-voiced cluster for real-analysis chords with optional inversion. */
function buildRealChordVoicing(symbol: string, inversion = 0, voiceLeadFrom?: number[]): number[] {
  const rootMatch = symbol.match(/^([A-G][b#]?)/);
  if (!rootMatch) return [48, 52, 55];
  const rootPc = NOTE_NAMES[rootMatch[1]] ?? 0;
  const pcs = pitchClassesForSymbol(symbol);
  const rotated = [...pcs.slice(inversion % pcs.length), ...pcs.slice(0, inversion % pcs.length)];

  const notes: number[] = [];
  // Bass note always in low register
  notes.push(midi(rootPc, 2));

  // Upper voicing: start at mid-register, apply voice leading from previous chord
  const baseTarget = voiceLeadFrom?.length
    ? Math.round(voiceLeadFrom.reduce((a, b) => a + b, 0) / voiceLeadFrom.length)
    : 65;
  const baseOct = Math.max(3, Math.min(5, Math.floor(baseTarget / 12) - 1));

  let current = midi(rotated[0] ?? rootPc, baseOct);
  for (const pc of rotated) {
    let cand = midi(pc, baseOct);
    while (cand < current - 2) cand += 12;
    while (cand > current + 13) cand -= 12;
    if (cand > 88) cand -= 12;
    notes.push(cand);
    current = cand;
  }
  return notes;
}

// ─── Variation machinery ─────────────────────────────────────────────────────

/** Comping patterns cycle to avoid repeating the same texture on every chord. */
const PATTERN_CYCLE: CompPattern[] = [
  "sustained_pads",
  "rhythmic_stabs",
  "sustained_pads",
  "arpeggiated",
];

/**
 * Insert a passing chord (secondary dominant or tritone sub) before a target chord
 * at the last beat of the preceding bar.
 */
function buildPassingChordEvent(
  targetSymbol: string,
  insertBeat: number,
  bpm: number,
): ChordMidiEvent[] {
  const rootMatch = targetSymbol.match(/^([A-G][b#]?)/);
  if (!rootMatch) return [];
  const targetRoot = NOTE_NAMES[rootMatch[1]] ?? 0;
  // Secondary dominant: V7 of the target
  const secDomRoot = (targetRoot + 7) % 12; // dominant is a 5th above target
  const name = Object.keys(NOTE_NAMES).find((k) => NOTE_NAMES[k] === secDomRoot && !k.includes("b") && k.length <= 2) ?? "C";
  const voicing = buildRealChordVoicing(`${name}7`, 0);
  const beatSec = 60 / bpm;
  const events: ChordMidiEvent[] = voicing.slice(1).map((note) => ({
    note,
    velocity: 52,
    startBeat: insertBeat,
    duration: 0.9,
    channel: 0,
  }));
  return events;
}

// ─── Main export ────────────────────────────────────────────────────────────

export interface ChordEngineOptions {
  key: string;
  bpm: number;
  barsPerChord?: number; // default 2
  totalBars?: number; // default 8
  pattern?: CompPattern; // default sustained_pads
  progressionSeed?: number; // pick which Glasper progression template
  includeBass?: boolean; // separate bass stem
  /** Real analyzed chord timeline from the input audio. When provided, these chords are used
   *  directly (in order) rather than a fixed 4-chord progression template. */
  inputChords?: { symbol: string; startBeat: number; endBeat: number }[];
}

export function generateNeoSoulChords(opts: ChordEngineOptions): ChordStem[] {
  const {
    bpm,
    barsPerChord = 2,
    totalBars = 8,
    pattern = "sustained_pads",
    progressionSeed = 0,
    includeBass = true,
    inputChords,
  } = opts;

  const chordEvents: ChordMidiEvent[] = [];
  const bassEvents: ChordMidiEvent[] = [];

  // ── Path A: real analyzed chords from audio ──────────────────────────────
  if (inputChords && inputChords.length >= 2) {
    let prevUpperVoicing: number[] = [];
    const seen = new Map<string, number>(); // symbol → times seen

    // Deduplicate consecutive identical symbols while keeping the longest span
    const merged: typeof inputChords = [];
    for (const c of inputChords) {
      const last = merged[merged.length - 1];
      if (last && last.symbol === c.symbol) {
        last.endBeat = c.endBeat;
      } else {
        merged.push({ ...c });
      }
    }

    for (let ci = 0; ci < merged.length; ci++) {
      const chord = merged[ci]!;
      const span = chord.endBeat - chord.startBeat;
      if (span < 0.25) continue;

      const timesSeenBefore = seen.get(chord.symbol) ?? 0;
      seen.set(chord.symbol, timesSeenBefore + 1);

      // Vary inversion on repeats to avoid identical voicings
      const inversion = timesSeenBefore % 3;
      // Vary pattern per 4-bar section
      const sectionIdx = Math.floor(chord.startBeat / 16);
      const localPattern: CompPattern = PATTERN_CYCLE[sectionIdx % PATTERN_CYCLE.length]!;

      const voicing = buildRealChordVoicing(chord.symbol, inversion, prevUpperVoicing);
      const upperVoicing = voicing.slice(1);
      const bassNote = voicing[0]!;
      prevUpperVoicing = upperVoicing;

      // Upper comping events
      const events = generateCompEvents(upperVoicing, chord.startBeat, Math.max(1, Math.round(span / 4)), bpm, localPattern);
      chordEvents.push(...events);

      // Secondary dominant passing chord: only on non-first appearances,
      // if there's room (the previous chord span ≥ 2 bars) and this chord is a "resolving" target.
      if (timesSeenBefore > 0 && ci > 0 && span >= 4) {
        const passAt = chord.startBeat - 0.5;
        if (passAt > 0) {
          chordEvents.push(...buildPassingChordEvent(chord.symbol, passAt, bpm));
        }
      }

      // Bass
      if (includeBass) {
        bassEvents.push({
          note: bassNote,
          velocity: 82,
          startBeat: chord.startBeat,
          duration: Math.min(1.9, span * 0.45),
          channel: 1,
        });
        if (span >= 4) {
          const fifth = upperVoicing[0] ?? bassNote;
          bassEvents.push({
            note: Math.max(36, fifth - 12),
            velocity: 68,
            startBeat: chord.startBeat + 2,
            duration: 1.8,
            channel: 1,
          });
        }
        // Anticipation into next chord
        if (ci < merged.length - 1) {
          bassEvents.push({
            note: bassNote,
            velocity: 60,
            startBeat: chord.endBeat - 0.5,
            duration: 0.4,
            channel: 1,
          });
        }
      }
    }
  } else {
    // ── Path B: deterministic progression when no real chords available ─────
    const { root, isMinor } = parseKey(opts.key);
    const diatonicChords = buildDiatonicChords(root, isMinor);
    const progression = selectProgression(isMinor, progressionSeed);

    const chordsPerRepeat = progression.length;
    const repeats = Math.ceil(totalBars / (chordsPerRepeat * barsPerChord));

    const seen = new Map<number, number>();

    for (let rep = 0; rep < repeats; rep++) {
      for (let i = 0; i < chordsPerRepeat; i++) {
        const degreeIdx = progression[i]!;
        const chord = diatonicChords[degreeIdx]!;
        const startBeat = (rep * chordsPerRepeat + i) * barsPerChord * 4;
        if (startBeat >= totalBars * 4) break;

        const timesSeen = seen.get(degreeIdx) ?? 0;
        seen.set(degreeIdx, timesSeen + 1);

        // Rotate voicing on repeats so it's never identical
        const bassNote = chord.voicing[0]!;
        const upperVoicingFull = chord.voicing.slice(1);
        // Invert by rotating upper voices
        const rotOff = timesSeen % upperVoicingFull.length;
        const upperVoicing = [
          ...upperVoicingFull.slice(rotOff),
          ...upperVoicingFull.slice(0, rotOff).map((n) => n + 12),
        ].filter((n) => n <= 88);

        // Vary pattern per section
        const sectionIdx = Math.floor(startBeat / 16);
        const localPattern: CompPattern = PATTERN_CYCLE[sectionIdx % PATTERN_CYCLE.length]!;

        const upperEvents = generateCompEvents(upperVoicing, startBeat, barsPerChord, bpm, localPattern);
        chordEvents.push(...upperEvents);

        // Secondary dominant before resolution on repeats
        if (timesSeen > 0 && i === 0 && startBeat >= 0.5) {
          chordEvents.push(...buildPassingChordEvent(chord.label, startBeat - 0.5, bpm));
        }

        if (includeBass) {
          bassEvents.push({
            note: bassNote,
            velocity: 82,
            startBeat,
            duration: 1.9,
            channel: 1,
          });
          if (barsPerChord >= 2 && upperVoicingFull.length > 0) {
            const fifth = upperVoicingFull[0]!;
            bassEvents.push({
              note: Math.max(36, fifth - 12),
              velocity: 70,
              startBeat: startBeat + 2,
              duration: 1.9,
              channel: 1,
            });
          }
          bassEvents.push({
            note: bassNote,
            velocity: 65,
            startBeat: startBeat + barsPerChord * 4 - 0.5,
            duration: 0.4,
            channel: 1,
          });
        }
      }
    }
  }

  const stems: ChordStem[] = [
    {
      name: "Neo-Soul Chords",
      role: "harmony",
      instrumentHint: "electric piano",
      midiEvents: chordEvents,
      pan: 0,
      gainDb: 0,
      muted: false,
      soloed: false,
    },
  ];

  if (includeBass && bassEvents.length > 0) {
    stems.push({
      name: "Bass",
      role: "bass",
      instrumentHint: "electric bass",
      midiEvents: bassEvents,
      pan: 0,
      gainDb: -2,
      muted: false,
      soloed: false,
    });
  }

  return stems;
}

/**
 * Get readable chord names for display in UI.
 */
export function getProgressionLabels(key: string, progressionSeed = 0): string[] {
  const { root, isMinor } = parseKey(key);
  const diatonicChords = buildDiatonicChords(root, isMinor);
  const progression = selectProgression(isMinor, progressionSeed);
  return progression.map((i) => diatonicChords[i]?.label ?? "?");
}
