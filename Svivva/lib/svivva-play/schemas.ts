import { z } from "zod";

export const AnalysisSchema = z.object({
  bpm: z.number().min(30).max(300),
  time_signature: z.string(),
  key: z.string(),
  key_confidence: z.number().min(0).max(100),
  chords: z.array(
    z.object({
      t0: z.number(),
      t1: z.number(),
      symbol: z.string(),
      roman: z.string().optional(),
      confidence: z.number().min(0).max(100).optional(),
    }),
  ),
  sections: z.array(
    z.object({
      name: z.string(),
      t0: z.number(),
      t1: z.number(),
      bars: z.number().optional(),
    }),
  ),
  downbeats: z.array(z.number()),
  style_compatibility: z.array(z.string()),
  timbre_descriptors: z
    .object({
      spectral_centroid: z.string().optional(),
      harmonicity: z.number().optional(),
      brightness: z.number().optional(),
      warmth: z.number().optional(),
      attack: z.string().optional(),
    })
    .optional(),
});

export const PlanStemSchema = z.object({
  name: z.string(),
  role: z.enum([
    "bass",
    "harmony",
    "melody",
    "percussion",
    "pad",
    "texture",
    "lead",
    "arpeggio",
    "vocal",
  ]),
  register: z.enum(["low", "mid", "high"]).optional(),
  instrument_hint: z.string(),
  density_curve: z.array(z.number()).optional(),
  pan: z.number().min(-100).max(100).optional(),
  articulations: z.array(z.string()).optional(),
});

export const PlanSchema = z.object({
  stems: z.array(PlanStemSchema),
  motif_rules: z
    .array(
      z.object({
        rule: z.string(),
        applies_to: z.array(z.string()),
      }),
    )
    .optional(),
  harmony_rules: z
    .object({
      mode: z.enum(["match", "reharmonize"]).optional(),
      tension: z.number().optional(),
      voice_leading: z.string().optional(),
    })
    .optional(),
  dynamics: z
    .array(
      z.object({
        section: z.string(),
        level: z.string(),
        crescendo: z.boolean().optional(),
      }),
    )
    .optional(),
  meend_applicable_stems: z.array(z.string()).optional(),
  form: z
    .object({
      sections: z.array(z.string()).optional(),
      total_bars: z.number().optional(),
    })
    .optional(),
});

export const MidiEventSchema = z.object({
  note: z.number().min(0).max(127),
  velocity: z.number().min(0).max(127),
  startBeat: z.number(),
  duration: z.number().min(0),
  channel: z.number().min(0).max(15).optional(),
});

export const MidiStemSchema = z.object({
  name: z.string(),
  midi_events: z.array(MidiEventSchema),
  expression: z
    .object({
      cc: z
        .array(
          z.object({
            beat: z.number(),
            cc_number: z.number(),
            value: z.number(),
          }),
        )
        .optional(),
      pitchbend: z
        .array(
          z.object({
            beat: z.number(),
            value: z.number(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export const MidiOutputSchema = z.object({
  stems: z.array(MidiStemSchema),
});

export const PatchSchema = z.object({
  name: z.string(),
  synth_family: z.enum(["subtractive", "fm", "wavetable", "granular"]),
  oscillators: z.array(
    z.object({
      shape: z.string(),
      oct: z.number(),
      fine: z.number().optional(),
      mix: z.number(),
      pw: z.number().optional(),
    }),
  ),
  filter: z.object({
    type: z.string(),
    cutoff_hz: z.number(),
    resonance: z.number(),
    drive: z.number().optional(),
    key_track: z.number().optional(),
  }),
  env: z.object({
    amp: z.object({ A: z.number(), D: z.number(), S: z.number(), R: z.number() }),
    filter: z.object({
      A: z.number(),
      D: z.number(),
      S: z.number(),
      R: z.number(),
      amount: z.number(),
    }),
  }),
  lfo: z.array(
    z.object({
      wave: z.string(),
      rate_hz: z.number(),
      dest: z.string(),
      amount: z.number(),
      sync: z.boolean().optional(),
    }),
  ),
  unison: z
    .object({
      voices: z.number().optional(),
      detune_cents: z.number().optional(),
      spread: z.number().optional(),
    })
    .optional(),
  mono_poly: z.enum(["mono", "poly", "legato"]).optional(),
  fx: z.array(
    z.object({
      type: z.string(),
      mix: z.number(),
    }),
  ),
  macros: z.object({
    brightness: z.number(),
    movement: z.number(),
    bite: z.number(),
    space: z.number(),
  }),
  instructions: z.string(),
  mappings: z
    .object({
      vst3: z.record(z.unknown()).optional(),
      midi_cc: z.record(z.number()).optional(),
      sysex: z.object({ enabled: z.boolean() }).optional(),
    })
    .optional(),
});

export const SessionExportSchema = z.object({
  svivva_play_version: z.string(),
  project_id: z.string(),
  exported_at: z.string(),
  source_audio: z
    .object({
      name: z.string().optional(),
      duration_s: z.number().optional(),
    })
    .optional(),
  analysis: AnalysisSchema.optional(),
  mode: z.string(),
  style: z
    .object({
      preset: z.string().optional(),
      prompt: z.string().optional(),
      seed: z.number().optional(),
    })
    .optional(),
  plan: PlanSchema.optional(),
  stems: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      instrument_hint: z.string().optional(),
      midi: z.string().optional(),
      audio: z.string().optional(),
      pan: z.number().optional(),
      gain_db: z.number().optional(),
      expression: z
        .object({
          mpe: z.boolean().optional(),
          meend: z.boolean().optional(),
        })
        .optional(),
    }),
  ),
  patches: z.array(PatchSchema).optional(),
  quality_tier: z.enum(["professional", "beta"]),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type PlanStem = z.infer<typeof PlanStemSchema>;
export type MidiEvent = z.infer<typeof MidiEventSchema>;
export type MidiStem = z.infer<typeof MidiStemSchema>;
export type MidiOutput = z.infer<typeof MidiOutputSchema>;
export type Patch = z.infer<typeof PatchSchema>;
export type SessionExport = z.infer<typeof SessionExportSchema>;
