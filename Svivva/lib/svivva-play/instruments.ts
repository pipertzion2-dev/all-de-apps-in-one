export interface InstrumentPreset {
  synthType: "synth" | "fm" | "am" | "mono" | "membrane" | "metal" | "pluck" | "noise";
  oscillator: { type: string; partialCount?: number };
  envelope: { attack: number; decay: number; sustain: number; release: number };
  filter?: { type: string; frequency: number; rolloff: number; Q: number };
  filterEnvelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    baseFrequency: number;
    octaves: number;
  };
  modulationIndex?: number;
  harmonicity?: number;
  detune?: number;
  volume?: number;
  portamento?: number;
  fx?: { type: string; wet: number; [key: string]: unknown }[];
}

const PIANO: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "triangle" },
  envelope: { attack: 0.005, decay: 1.2, sustain: 0.1, release: 1.5 },
  filter: { type: "lowpass", frequency: 4000, rolloff: -12, Q: 1 },
  volume: -6,
  fx: [{ type: "reverb", wet: 0.25, decay: 2.5, preDelay: 0.01 }],
};

const ELECTRIC_PIANO: InstrumentPreset = {
  synthType: "fm",
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 1.0, sustain: 0.3, release: 1.2 },
  modulationIndex: 3.5,
  harmonicity: 3.01,
  volume: -8,
  fx: [
    { type: "chorus", wet: 0.3, frequency: 1.5, delayTime: 3.5, depth: 0.5 },
    { type: "reverb", wet: 0.2, decay: 2.0, preDelay: 0.01 },
  ],
};

// Clean piano-style comp synth — triangle wave, piano ADSR, no FM intermodulation.
// Used for chord comping so stacked notes sound clear, not buzzy.
const COMP_PIANO: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "triangle" },
  envelope: { attack: 0.004, decay: 0.9, sustain: 0.12, release: 1.0 },
  filter: { type: "lowpass", frequency: 4200, rolloff: -12, Q: 0.7 },
  volume: -2,
  fx: [{ type: "reverb", wet: 0.22, decay: 1.6, preDelay: 0.01 }],
};

const BASS: InstrumentPreset = {
  synthType: "mono",
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.3 },
  filter: { type: "lowpass", frequency: 800, rolloff: -24, Q: 2 },
  filterEnvelope: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.3,
    release: 0.5,
    baseFrequency: 200,
    octaves: 2.5,
  },
  volume: -4,
  portamento: 0.05,
};

const SYNTH_BASS: InstrumentPreset = {
  synthType: "mono",
  oscillator: { type: "square" },
  envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.2 },
  filter: { type: "lowpass", frequency: 1200, rolloff: -24, Q: 4 },
  filterEnvelope: {
    attack: 0.005,
    decay: 0.15,
    sustain: 0.2,
    release: 0.3,
    baseFrequency: 100,
    octaves: 3,
  },
  volume: -3,
};

const STRINGS: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sine" },
  envelope: { attack: 0.45, decay: 0.35, sustain: 0.9, release: 2.4 },
  filter: { type: "lowpass", frequency: 3800, rolloff: -12, Q: 0.45 },
  detune: 3,
  volume: -11,
  fx: [
    { type: "chorus", wet: 0.35, frequency: 0.5, delayTime: 5, depth: 0.5 },
    { type: "reverb", wet: 0.48, decay: 5.0, preDelay: 0.04 },
  ],
};

const ORCH_CELLO: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sine" },
  envelope: { attack: 0.35, decay: 0.4, sustain: 0.88, release: 2.0 },
  filter: { type: "lowpass", frequency: 2200, rolloff: -12, Q: 0.5 },
  volume: -12,
  fx: [{ type: "reverb", wet: 0.42, decay: 4.5, preDelay: 0.03 }],
};

const ORCH_BASS: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sine" },
  envelope: { attack: 0.25, decay: 0.3, sustain: 0.85, release: 1.6 },
  filter: { type: "lowpass", frequency: 900, rolloff: -12, Q: 0.6 },
  volume: -13,
  fx: [{ type: "reverb", wet: 0.25, decay: 3.0, preDelay: 0.02 }],
};

const ORCH_HARP: InstrumentPreset = {
  synthType: "pluck",
  oscillator: { type: "triangle" },
  envelope: { attack: 0.004, decay: 1.8, sustain: 0.04, release: 2.5 },
  volume: -14,
  fx: [{ type: "reverb", wet: 0.5, decay: 5.5, preDelay: 0.04 }],
};

const SOLO_VIOLIN: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sine" },
  envelope: { attack: 0.2, decay: 0.25, sustain: 0.92, release: 2.8 },
  filter: { type: "lowpass", frequency: 4800, rolloff: -12, Q: 0.55 },
  volume: -10,
  fx: [
    { type: "chorus", wet: 0.25, frequency: 0.6, delayTime: 4, depth: 0.35 },
    { type: "reverb", wet: 0.5, decay: 5.5, preDelay: 0.04 },
  ],
};

const PAD: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sine" },
  envelope: { attack: 0.8, decay: 1.0, sustain: 0.9, release: 3.0 },
  filter: { type: "lowpass", frequency: 2500, rolloff: -12, Q: 0.3 },
  volume: -12,
  fx: [
    { type: "chorus", wet: 0.5, frequency: 0.5, delayTime: 5, depth: 0.7 },
    { type: "reverb", wet: 0.5, decay: 5.0, preDelay: 0.03 },
  ],
};

const SYNTH_LEAD: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.5 },
  filter: { type: "lowpass", frequency: 5000, rolloff: -12, Q: 2 },
  volume: -8,
  fx: [
    { type: "delay", wet: 0.2, delayTime: 0.25, feedback: 0.3 },
    { type: "reverb", wet: 0.15, decay: 1.5, preDelay: 0.01 },
  ],
};

const BRASS: InstrumentPreset = {
  synthType: "fm",
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.08, decay: 0.3, sustain: 0.7, release: 0.4 },
  modulationIndex: 6,
  harmonicity: 1,
  volume: -8,
  fx: [{ type: "reverb", wet: 0.2, decay: 1.8, preDelay: 0.01 }],
};

const ORGAN: InstrumentPreset = {
  synthType: "fm",
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 0.1, sustain: 1.0, release: 0.1 },
  modulationIndex: 2,
  harmonicity: 1,
  volume: -8,
  fx: [
    { type: "chorus", wet: 0.5, frequency: 6.0, delayTime: 2.5, depth: 0.3 },
    { type: "reverb", wet: 0.25, decay: 2.0, preDelay: 0.01 },
  ],
};

const GUITAR: InstrumentPreset = {
  synthType: "pluck",
  oscillator: { type: "triangle" },
  envelope: { attack: 0.002, decay: 0.8, sustain: 0.1, release: 1.0 },
  volume: -6,
  fx: [{ type: "reverb", wet: 0.2, decay: 1.5, preDelay: 0.01 }],
};

const MARIMBA: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.6, sustain: 0.02, release: 0.8 },
  volume: -6,
  fx: [{ type: "reverb", wet: 0.3, decay: 2.0, preDelay: 0.01 }],
};

const VIBRAPHONE: InstrumentPreset = {
  synthType: "fm",
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 1.5, sustain: 0.1, release: 2.0 },
  modulationIndex: 1.5,
  harmonicity: 4.01,
  volume: -8,
  fx: [
    { type: "chorus", wet: 0.3, frequency: 3.0, delayTime: 2, depth: 0.3 },
    { type: "reverb", wet: 0.35, decay: 3.0, preDelay: 0.02 },
  ],
};

const FLUTE: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sine" },
  envelope: { attack: 0.12, decay: 0.25, sustain: 0.75, release: 0.6 },
  filter: { type: "lowpass", frequency: 2800, rolloff: -12, Q: 0.8 },
  volume: -12,
  fx: [{ type: "reverb", wet: 0.3, decay: 2.5, preDelay: 0.02 }],
};

const ORCH_OBOE: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "sine" },
  envelope: { attack: 0.1, decay: 0.22, sustain: 0.78, release: 0.55 },
  filter: { type: "lowpass", frequency: 2400, rolloff: -12, Q: 0.75 },
  volume: -12,
  fx: [{ type: "reverb", wet: 0.28, decay: 2.2, preDelay: 0.02 }],
};

const WOODWIND: InstrumentPreset = {
  synthType: "fm",
  oscillator: { type: "sine" },
  envelope: { attack: 0.06, decay: 0.3, sustain: 0.7, release: 0.4 },
  modulationIndex: 2.5,
  harmonicity: 2,
  volume: -10,
  fx: [{ type: "reverb", wet: 0.25, decay: 2.0, preDelay: 0.02 }],
};

const BELL: InstrumentPreset = {
  synthType: "fm",
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 2.0, sustain: 0.0, release: 3.0 },
  modulationIndex: 8,
  harmonicity: 5.07,
  volume: -10,
  fx: [{ type: "reverb", wet: 0.45, decay: 4.0, preDelay: 0.03 }],
};

const PERCUSSION: InstrumentPreset = {
  synthType: "membrane",
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.3, sustain: 0.0, release: 0.3 },
  volume: -4,
};

const HIHAT: InstrumentPreset = {
  synthType: "metal",
  oscillator: { type: "square" },
  envelope: { attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.05 },
  volume: -12,
};

const TEXTURE: InstrumentPreset = {
  synthType: "am",
  oscillator: { type: "sine" },
  envelope: { attack: 1.0, decay: 1.5, sustain: 0.8, release: 4.0 },
  harmonicity: 2.5,
  volume: -14,
  fx: [
    { type: "chorus", wet: 0.5, frequency: 0.3, delayTime: 6, depth: 0.8 },
    { type: "reverb", wet: 0.6, decay: 6.0, preDelay: 0.05 },
    { type: "delay", wet: 0.15, delayTime: 0.5, feedback: 0.4 },
  ],
};

const VOCAL_SYNTH: InstrumentPreset = {
  synthType: "fm",
  oscillator: { type: "sine" },
  envelope: { attack: 0.15, decay: 0.3, sustain: 0.6, release: 0.8 },
  modulationIndex: 4,
  harmonicity: 2,
  volume: -8,
  fx: [
    { type: "chorus", wet: 0.4, frequency: 1.0, delayTime: 3, depth: 0.4 },
    { type: "reverb", wet: 0.35, decay: 3.0, preDelay: 0.02 },
  ],
};

const ARPEGGIO: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "triangle" },
  envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.4 },
  filter: { type: "lowpass", frequency: 6000, rolloff: -12, Q: 1 },
  volume: -10,
  fx: [
    { type: "delay", wet: 0.35, delayTime: 0.2, feedback: 0.4 },
    { type: "reverb", wet: 0.2, decay: 2.0, preDelay: 0.01 },
  ],
};

const SITAR: InstrumentPreset = {
  synthType: "pluck",
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.002, decay: 1.5, sustain: 0.05, release: 2.0 },
  volume: -6,
  fx: [{ type: "reverb", wet: 0.3, decay: 3.0, preDelay: 0.02 }],
};

/** Meend accent — triangle voice blended with the full arrangement. */
export const MEEND_PREVIEW: InstrumentPreset = {
  synthType: "mono",
  oscillator: { type: "triangle" },
  envelope: { attack: 0.05, decay: 0.12, sustain: 0.62, release: 0.4 },
  filter: { type: "lowpass", frequency: 3600, rolloff: -12, Q: 0.55 },
  volume: -2,
  portamento: 0,
};

const DEFAULT_PRESET: InstrumentPreset = {
  synthType: "synth",
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.5 },
  volume: -8,
  fx: [{ type: "reverb", wet: 0.2, decay: 2.0, preDelay: 0.01 }],
};

const INSTRUMENT_MAP: Record<string, InstrumentPreset> = {
  piano: PIANO,
  "acoustic piano": PIANO,
  "grand piano": PIANO,
  "comp piano": COMP_PIANO,
  "jazz piano": COMP_PIANO,
  "electric piano": ELECTRIC_PIANO,
  rhodes: ELECTRIC_PIANO,
  wurlitzer: ELECTRIC_PIANO,
  ep: ELECTRIC_PIANO,
  bass: BASS,
  "electric bass": BASS,
  "acoustic bass": BASS,
  "upright bass": BASS,
  "synth bass": SYNTH_BASS,
  "sub bass": SYNTH_BASS,
  strings: STRINGS,
  "string ensemble": STRINGS,
  violin: STRINGS,
  viola: STRINGS,
  cello: ORCH_CELLO,
  "string quartet": STRINGS,
  pad: PAD,
  "synth pad": PAD,
  "ambient pad": PAD,
  "warm pad": PAD,
  synth: SYNTH_LEAD,
  synth_lead: SYNTH_LEAD,
  "synth lead": SYNTH_LEAD,
  lead: SYNTH_LEAD,
  steel_drums: MARIMBA,
  "steel drums": MARIMBA,
  steeldrums: MARIMBA,
  brass: BRASS,
  trumpet: BRASS,
  trombone: BRASS,
  "french horn": BRASS,
  horn: BRASS,
  "horn section": BRASS,
  organ: ORGAN,
  hammond: ORGAN,
  guitar: GUITAR,
  "acoustic guitar": GUITAR,
  "electric guitar": GUITAR,
  "nylon guitar": GUITAR,
  marimba: MARIMBA,
  xylophone: MARIMBA,
  glockenspiel: MARIMBA,
  vibraphone: VIBRAPHONE,
  vibes: VIBRAPHONE,
  flute: FLUTE,
  piccolo: FLUTE,
  recorder: FLUTE,
  clarinet: WOODWIND,
  oboe: ORCH_OBOE,
  bassoon: WOODWIND,
  sax: WOODWIND,
  saxophone: WOODWIND,
  "alto sax": WOODWIND,
  "tenor sax": WOODWIND,
  "soprano sax": WOODWIND,
  woodwind: WOODWIND,
  bell: BELL,
  "tubular bells": BELL,
  chimes: BELL,
  celesta: BELL,
  harp: ORCH_HARP,
  contrabass: ORCH_BASS,
  "double bass": ORCH_BASS,
  "solo violin": SOLO_VIOLIN,
  "1st violins": STRINGS,
  "2nd violins": STRINGS,
  "orchestral percussion": PERCUSSION,
  drums: PERCUSSION,
  kick: PERCUSSION,
  snare: PERCUSSION,
  tom: PERCUSSION,
  timpani: PERCUSSION,
  percussion: PERCUSSION,
  "drum machine": PERCUSSION,
  hihat: HIHAT,
  "hi-hat": HIHAT,
  cymbal: HIHAT,
  ride: HIHAT,
  crash: HIHAT,
  texture: TEXTURE,
  ambient: TEXTURE,
  atmosphere: TEXTURE,
  drone: TEXTURE,
  "sound design": TEXTURE,
  vocal: VOCAL_SYNTH,
  voice: VOCAL_SYNTH,
  "vocal synth": VOCAL_SYNTH,
  vocoder: VOCAL_SYNTH,
  choir: VOCAL_SYNTH,
  "backing vocals": VOCAL_SYNTH,
  arpeggio: ARPEGGIO,
  arpeggiated: ARPEGGIO,
  arp: ARPEGGIO,
  sitar: SITAR,
  tanpura: SITAR,
  veena: SITAR,
  sarangi: SITAR,
  tabla: PERCUSSION,
};

const ROLE_FALLBACKS: Record<string, InstrumentPreset> = {
  bass: ORCH_BASS,
  harmony: STRINGS,
  melody: SOLO_VIOLIN,
  percussion: PERCUSSION,
  pad: PAD,
  texture: TEXTURE,
  lead: SOLO_VIOLIN,
  arpeggio: ORCH_HARP,
  vocal: VOCAL_SYNTH,
};

export function resolveInstrumentPreset(instrumentHint: string, role?: string): InstrumentPreset {
  const hint = instrumentHint.toLowerCase().trim();
  if (INSTRUMENT_MAP[hint]) return INSTRUMENT_MAP[hint];
  for (const [key, preset] of Object.entries(INSTRUMENT_MAP)) {
    if (hint.includes(key) || key.includes(hint)) return preset;
  }
  if (role && ROLE_FALLBACKS[role]) return ROLE_FALLBACKS[role];
  return DEFAULT_PRESET;
}

export function getAvailableInstruments(): string[] {
  return [...new Set(Object.keys(INSTRUMENT_MAP))].sort();
}
