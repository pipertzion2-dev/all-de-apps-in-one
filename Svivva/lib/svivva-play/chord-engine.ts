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
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3,
  E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10, B: 11,
};

function midi(pitchClass: number, octave: number): number {
  return (octave + 1) * 12 + ((pitchClass % 12 + 12) % 12);
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
  return steps.map(s => (root + s) % 12);
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
  const upperTones = chordTones.filter(t => t !== root % 12);
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

    const noteName = Object.keys(NOTE_NAMES).find(
      k => NOTE_NAMES[k] === chordRoot && !k.includes("b") && k.length <= 2
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
    [0, 5, 3, 4],   // Imaj9 → vim9 → IVmaj9 → V13sus4  ("Float" — Glasper)
    [1, 4, 0, 5],   // iim11 → V13sus4 → Imaj9 → vim9   ("Black Radio")
    [5, 3, 0, 4],   // vim9 → IVmaj9 → Imaj9 → V13sus4  (neo-soul staple)
    [0, 5, 1, 4],   // Imaj9 → vim9 → iim11 → V13sus4   (Lins ii-Vsus)
    [3, 0, 5, 4],   // IVmaj9 → Imaj9 → vim9 → V13sus4
  ];

  const minorProgressions: Progression[] = [
    [0, 6, 5, 4],   // im11 → bVII → bVI → vm9   ("North Portland" — Glasper)
    [0, 5, 3, 1],   // im11 → bVImaj9 → IVm11 → iim9
    [0, 3, 6, 5],   // im11 → IVm11 → bVII → bVI  (D'Angelo / Erykah vibe)
    [0, 6, 5, 6],   // im11 → bVII → bVI → bVII   (two-chord Glasper float)
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
    const upperNotes = voicing.filter(n => n >= 60);
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
    events.push({ note: voicing[0], velocity: 75, startBeat, duration: totalBeats - 0.1, channel: 0 });
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

// ─── Main export ────────────────────────────────────────────────────────────

export interface ChordEngineOptions {
  key: string;
  bpm: number;
  barsPerChord?: number;       // default 2
  totalBars?: number;          // default 8
  pattern?: CompPattern;       // default sustained_pads
  progressionSeed?: number;    // pick which Glasper progression template
  includeBass?: boolean;       // separate bass stem
}

export function generateNeoSoulChords(opts: ChordEngineOptions): ChordStem[] {
  const {
    bpm,
    barsPerChord = 2,
    totalBars = 8,
    pattern = "sustained_pads",
    progressionSeed = 0,
    includeBass = true,
  } = opts;

  const { root, isMinor } = parseKey(opts.key);
  const diatonicChords = buildDiatonicChords(root, isMinor);
  const progression = selectProgression(isMinor, progressionSeed);

  // Repeat progression to fill totalBars
  const chordsPerRepeat = progression.length;
  const repeats = Math.ceil(totalBars / (chordsPerRepeat * barsPerChord));

  const chordEvents: ChordMidiEvent[] = [];
  const bassEvents: ChordMidiEvent[] = [];

  for (let rep = 0; rep < repeats; rep++) {
    for (let i = 0; i < chordsPerRepeat; i++) {
      const degreeIdx = progression[i];
      const chord = diatonicChords[degreeIdx];
      const startBeat = (rep * chordsPerRepeat + i) * barsPerChord * 4;

      if (startBeat >= totalBars * 4) break;

      // Separate bass from upper voicing
      const bassNote = chord.voicing[0];
      const upperVoicing = chord.voicing.slice(1);

      // Generate comping events for upper voices
      const upperEvents = generateCompEvents(
        upperVoicing, startBeat, barsPerChord, bpm, pattern
      );
      chordEvents.push(...upperEvents);

      // Separate bass line (simpler rhythmic pattern)
      if (includeBass) {
        const bassBeats = barsPerChord * 4;
        // Root on 1, then octave up on beat 3 for movement
        bassEvents.push({
          note: bassNote,
          velocity: 82,
          startBeat,
          duration: 1.9,
          channel: 1,
        });
        if (barsPerChord >= 2) {
          // Add a walking note — 5th of chord (2nd note of upper)
          const fifth = upperVoicing[0]; // first upper voice (usually 3rd or 5th)
          bassEvents.push({
            note: Math.max(36, fifth - 12), // drop an octave
            velocity: 70,
            startBeat: startBeat + 2,
            duration: 1.9,
            channel: 1,
          });
        }
        // Anticipate next chord on beat 4 (Glasper characteristic)
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
  return progression.map(i => diatonicChords[i].label);
}
