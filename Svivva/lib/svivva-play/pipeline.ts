import { openai, getPlayModelChain, isAnyAiProviderAvailable } from "@/lib/llm/openai";
import {
  ANALYSIS_ORCHESTRATOR,
  ARRANGEMENT_PLANNER,
  MIDI_GENERATOR,
  PATCH_DESIGNER,
  MODE_PROMPT_ADDONS,
  fillTemplate,
} from "./templates";
import { enrichAnalysisHeuristically } from "./heuristic-analysis";
import {
  isOrchestralPreset,
  ORCHESTRAL_MIDI_ADDON,
  ORCHESTRAL_PLAN_ADDON,
} from "./prompts/orchestral-composer";
import {
  AnalysisSchema,
  PlanSchema,
  MidiOutputSchema,
  PatchSchema,
  type Analysis,
  type Plan,
  type MidiOutput,
  type Patch,
} from "./schemas";

export type PlayMode = "composition" | "interpolation" | "chords" | "solo" | "patch" | "ensemble";

export interface PipelineSettings {
  density?: number;
  complexity?: number;
  harmonyMode?: "match" | "reharmonize";
  tension?: number;
  rootMovement?: number;
  voiceLeading?: "smooth" | "moderate" | "jumpy";
  risk?: number;
  callResponse?: boolean;
  styleStrength?: number;
  keepHarmony?: boolean;
  compingPattern?: string;
  soloType?: string;
  synthFamily?: string;
  macros?: { brightness: number; movement: number; bite: number; space: number };
  meend?: boolean;
  userPrompt?: string;
  seed?: number;
  ensembleSize?: number;
  vocalistEnabled?: boolean;
  vocalistMode?: string;
  loopBars?: number;
  loopT0?: number;
  loopT1?: number;
  lockedNotes?: string[];
  scale?: string;
  stylePreset?: string;
  reichStyle?: string;
  reichType?: string;
  reichScale?: string;
  /** 0–100, BLUES JAWN jazz swing on 16th grid. */
  swingAmount?: number;
  /** AI V-2 hocket groove style when reichType is hocket. */
  hocketGroove?: string;
  /** Reich/orchestral repeating cell multiplier. */
  patternLength?: "standard" | "extended" | "long";
  /** Skip cloud LLM — use Melodyne + input alignment only. */
  analysisFocus?: "melodyne_mix" | "full_cloud";
}

export interface PipelineStageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawResponse?: string;
}

async function callLLM(systemPrompt: string, userInput: Record<string, unknown>): Promise<string> {
  if (!isAnyAiProviderAvailable()) {
    throw new Error("no-ai-provider");
  }

  const filledPrompt = fillTemplate(systemPrompt, userInput);
  const parts = filledPrompt.split("USER INPUT (JSON):");
  const systemPart = parts[0].replace("SYSTEM:\n", "").replace("DEVELOPER:\n", "\n").trim();
  const userPart = parts[1]?.trim() || JSON.stringify(userInput, null, 2);

  let lastError: unknown;
  for (const model of getPlayModelChain()) {
    try {
      const completion = await openai.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: systemPart },
            { role: "user", content: userPart },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        },
        { timeout: 25000 },
      );
      const content = completion.choices[0].message.content;
      if (content) return content;
    } catch (err) {
      lastError = err;
      console.warn(`LLM model ${model} failed, trying next:`, err);
    }
  }

  throw lastError ?? new Error("All LLM models failed");
}

export function buildMinimalPlayAnalysis(realAnalysis: {
  bpm: number;
  key: string;
  keyConfidence: number;
  durationSec?: number;
}): Analysis {
  const durationSec = realAnalysis.durationSec ?? 180;
  const base: Analysis = {
    bpm: realAnalysis.bpm,
    time_signature: "4/4",
    key: realAnalysis.key,
    key_confidence: Math.max(25, realAnalysis.keyConfidence),
    chords: [],
    sections: [{ name: "Full", t0: 0, t1: durationSec, bars: 32 }],
    downbeats: [],
    style_compatibility: [],
    timbre_descriptors: {},
  };
  return enrichAnalysisHeuristically(base, durationSec);
}

function buildDspFallbackAnalysis(realAnalysis: {
  bpm: number;
  key: string;
  keyConfidence: number;
  durationSec?: number;
}): Analysis {
  return buildMinimalPlayAnalysis(realAnalysis);
}

export async function runAnalysis(
  audioMeta: {
    name: string;
    size: number;
    type: string;
    durationEstimate?: number;
    audioBase64?: string;
  },
  userHint?: string,
  realAnalysis?: { bpm: number; key: string; keyConfidence: number },
): Promise<PipelineStageResult<Analysis>> {
  try {
    const input: Record<string, unknown> = {
      audio_meta: {
        name: audioMeta.name,
        size: audioMeta.size,
        type: audioMeta.type,
        durationEstimate: audioMeta.durationEstimate,
      },
      user_hint: userHint || "",
    };

    const bpmValid = realAnalysis && realAnalysis.bpm >= 40 && realAnalysis.bpm <= 220;
    const keyValid = realAnalysis && realAnalysis.keyConfidence >= 25;
    const hasReliableDSP = bpmValid && keyValid;

    if (hasReliableDSP) {
      input.detected_bpm = realAnalysis!.bpm;
      input.detected_key = realAnalysis!.key;
      input.analysis_note = `BPM=${realAnalysis!.bpm} and Key=${realAnalysis!.key} were detected via audio DSP. Use these exact values. Focus on chords, sections, style, and timbre.`;
    } else if (realAnalysis) {
      if (bpmValid) input.detected_bpm = realAnalysis.bpm;
      if (keyValid) input.detected_key = realAnalysis.key;
      input.analysis_note = `Partial DSP results provided (BPM reliable: ${bpmValid}, Key reliable: ${keyValid}). Use DSP values where reliable, otherwise analyze from audio metadata and hints.`;
    }

    if (audioMeta.audioBase64) {
      input.audio_data_sample = audioMeta.audioBase64;
    }

    let raw: string;
    try {
      raw = await callLLM(ANALYSIS_ORCHESTRATOR, input);
    } catch (llmError) {
      console.error("Analysis LLM error:", llmError);
      if (realAnalysis && (bpmValid || keyValid)) {
        return { success: true, data: buildDspFallbackAnalysis(realAnalysis) };
      }
      throw llmError;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error("Analysis JSON parse error:", parseError);
      if (realAnalysis && (bpmValid || keyValid)) {
        return { success: true, data: buildDspFallbackAnalysis(realAnalysis) };
      }
      throw parseError;
    }

    let finalBpm = (parsed.bpm as number) ?? 120;
    let finalKey = (parsed.key as string) ?? "C major";
    let finalKeyConfidence =
      (parsed.key_confidence as number) ?? (parsed.keyConfidence as number) ?? 75;

    if (bpmValid) finalBpm = realAnalysis!.bpm;
    if (keyValid) {
      finalKey = realAnalysis!.key;
      finalKeyConfidence = realAnalysis!.keyConfidence;
    }

    if (finalBpm < 40 || finalBpm > 220) finalBpm = 120;
    if (finalKeyConfidence < 0) finalKeyConfidence = 50;

    const normalized = {
      bpm: finalBpm,
      time_signature:
        (parsed.time_signature as string) ?? (parsed.timeSignature as string) ?? "4/4",
      key: finalKey,
      key_confidence: finalKeyConfidence,
      chords: Array.isArray(parsed.chords) ? parsed.chords : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      downbeats: Array.isArray(parsed.downbeats) ? parsed.downbeats : [],
      style_compatibility: Array.isArray(parsed.style_compatibility)
        ? parsed.style_compatibility
        : [],
      timbre_descriptors: parsed.timbre_descriptors || {},
    };

    const validated = AnalysisSchema.safeParse(normalized);
    if (!validated.success) {
      console.warn("Analysis validation warnings:", validated.error.issues);
      return { success: true, data: normalized as Analysis, rawResponse: raw };
    }

    return { success: true, data: validated.data, rawResponse: raw };
  } catch (error) {
    console.error("Analysis pipeline error:", error);
    if (realAnalysis && realAnalysis.bpm >= 40 && realAnalysis.bpm <= 220) {
      return { success: true, data: buildDspFallbackAnalysis(realAnalysis) };
    }
    return { success: false, error: String(error) };
  }
}

export async function runPlan(
  analysis: Analysis,
  mode: PlayMode,
  stylePreset: string,
  settings: PipelineSettings,
): Promise<PipelineStageResult<Plan>> {
  try {
    const modeAddon = MODE_PROMPT_ADDONS[mode] || "";
    const orchestralAddon = isOrchestralPreset(stylePreset) ? ORCHESTRAL_PLAN_ADDON : "";
    const constraints = buildConstraints(mode, settings);

    const input = {
      analysis,
      mode,
      style_preset: stylePreset,
      user_prompt: settings.userPrompt || "",
      constraints,
    };

    const fullPrompt = ARRANGEMENT_PLANNER + "\n\n" + modeAddon + orchestralAddon;
    const raw = await callLLM(fullPrompt, input);
    const parsed = JSON.parse(raw);

    const normalized = {
      stems: Array.isArray(parsed.stems)
        ? parsed.stems.map((s: any) => ({
            name: String(s.name || "Untitled"),
            role: s.role || "melody",
            register: s.register || "mid",
            instrument_hint: String(s.instrument_hint || s.instrumentHint || "Piano"),
            density_curve: Array.isArray(s.density_curve) ? s.density_curve : [],
            pan: s.pan ?? 0,
            articulations: Array.isArray(s.articulations) ? s.articulations : [],
          }))
        : [],
      motif_rules: parsed.motif_rules || [],
      harmony_rules: parsed.harmony_rules || { mode: settings.harmonyMode || "match" },
      dynamics: parsed.dynamics || [],
      meend_applicable_stems: parsed.meend_applicable_stems || [],
      form: parsed.form || {},
    };

    const validated = PlanSchema.safeParse(normalized);
    if (!validated.success) {
      console.warn("Plan validation warnings:", validated.error.issues);
    }

    return { success: true, data: normalized as Plan, rawResponse: raw };
  } catch (error) {
    console.error("Plan pipeline error:", error);
    return { success: false, error: String(error) };
  }
}

export async function runMidiGeneration(
  analysis: Analysis,
  plan: Plan,
  range: { startBar: number; endBar: number },
  settings: PipelineSettings,
): Promise<PipelineStageResult<MidiOutput>> {
  try {
    const input = {
      analysis,
      plan,
      range,
      settings: {
        density: settings.density ?? 50,
        complexity: settings.complexity ?? 50,
        meend: settings.meend ?? false,
        seed: settings.seed ?? Math.floor(Math.random() * 999999),
        harmonyMode: settings.harmonyMode || "match",
        risk: settings.risk ?? 30,
      },
    };

    const preset = settings.stylePreset;
    const orchestralMidiAddon = isOrchestralPreset(preset) ? ORCHESTRAL_MIDI_ADDON : "";
    const midiPrompt = orchestralMidiAddon
      ? `${MIDI_GENERATOR}\n\n${orchestralMidiAddon}`
      : MIDI_GENERATOR;

    const raw = await callLLM(midiPrompt, input);
    const parsed = JSON.parse(raw);

    const normalized = {
      stems: Array.isArray(parsed.stems)
        ? parsed.stems.map((s: any) => ({
            name: String(s.name || "Untitled"),
            midi_events: Array.isArray(s.midi_events)
              ? s.midi_events
                  .filter((e: Record<string, unknown>) => {
                    const start = e.startBeat ?? e.start_beat;
                    const dur = e.duration ?? e.duration_beats;
                    return (
                      typeof e.note === "number" &&
                      typeof start === "number" &&
                      typeof dur === "number"
                    );
                  })
                  .map((e: Record<string, unknown>) => ({
                    note: Math.max(0, Math.min(127, Number(e.note))),
                    velocity: Math.max(1, Math.min(127, Number(e.velocity || 80))),
                    startBeat: Math.max(0, Number(e.startBeat ?? e.start_beat)),
                    duration: Math.max(0.01, Number(e.duration ?? e.duration_beats)),
                    channel: Math.max(0, Math.min(15, Number(e.channel || 0))),
                  }))
              : [],
            expression: {
              cc: Array.isArray(s.expression?.cc) ? s.expression.cc : [],
              pitchbend: Array.isArray(s.expression?.pitchbend) ? s.expression.pitchbend : [],
            },
          }))
        : [],
    };

    if (
      normalized.stems.length === 0 ||
      normalized.stems.every((s: { midi_events: unknown[] }) => s.midi_events.length === 0)
    ) {
      return { success: false, error: "MIDI generation produced no valid events" };
    }

    return { success: true, data: normalized as MidiOutput, rawResponse: raw };
  } catch (error) {
    console.error("MIDI generation pipeline error:", error);
    return { success: false, error: String(error) };
  }
}

export async function runPatchDesign(
  analysis: Analysis,
  settings: PipelineSettings,
): Promise<PipelineStageResult<Patch>> {
  try {
    const modeAddon = MODE_PROMPT_ADDONS.patch;

    const input = {
      timbre_features: analysis.timbre_descriptors || {},
      family: settings.synthFamily || "subtractive",
      macros: settings.macros || { brightness: 0.5, movement: 0.5, bite: 0.3, space: 0.5 },
      user_prompt: settings.userPrompt || "",
      analysis_summary: {
        key: analysis.key,
        bpm: analysis.bpm,
        style: analysis.style_compatibility,
      },
    };

    const fullPrompt = PATCH_DESIGNER + "\n\n" + modeAddon;
    const raw = await callLLM(fullPrompt, input);
    const parsed = JSON.parse(raw);

    const validated = PatchSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn("Patch validation warnings:", validated.error.issues);
      return { success: true, data: parsed as Patch, rawResponse: raw };
    }

    return { success: true, data: validated.data, rawResponse: raw };
  } catch (error) {
    console.error("Patch design pipeline error:", error);
    return { success: false, error: String(error) };
  }
}

function buildConstraints(mode: PlayMode, settings: PipelineSettings): Record<string, unknown> {
  const base: Record<string, unknown> = {
    density: settings.density ?? 50,
    complexity: settings.complexity ?? 50,
    harmony_mode: settings.harmonyMode || "match",
    meend: settings.meend ?? false,
    seed: settings.seed ?? Math.floor(Math.random() * 999999),
  };

  switch (mode) {
    case "composition":
      return {
        ...base,
        scale: settings.scale || "auto",
      };
    case "interpolation":
      return {
        ...base,
        loop: { t0: settings.loopT0 ?? 0, t1: settings.loopT1 ?? 16, bars: settings.loopBars ?? 4 },
        transfer: {
          keep_harmony: settings.keepHarmony ?? true,
          style_strength: settings.styleStrength ?? 50,
          target_prompt: settings.userPrompt || "",
        },
      };
    case "chords":
      return {
        ...base,
        reharm: {
          tension: settings.tension ?? 40,
          root_movement: settings.rootMovement ?? 50,
          voice_leading: settings.voiceLeading || "smooth",
          locked_notes: settings.lockedNotes || [],
        },
        comping: {
          pattern: settings.compingPattern || "sustained_pads",
          swing: 0.5,
          humanize_ms: 12,
        },
      };
    case "solo":
      return {
        ...base,
        solo_arc: {
          risk: settings.risk ?? 30,
          call_response: settings.callResponse ?? false,
          solo_type: settings.soloType || "instrument",
        },
      };
    case "patch":
      return {
        ...base,
        synth_family: settings.synthFamily || "subtractive",
        macros: settings.macros || { brightness: 0.5, movement: 0.5, bite: 0.3, space: 0.5 },
      };
    case "ensemble":
      return {
        ...base,
        ensemble: {
          size: settings.ensembleSize ?? 12,
          vocalist: {
            enabled: settings.vocalistEnabled ?? false,
            mode: settings.vocalistMode || "vocalize",
          },
          articulations_required: true,
          dynamics: { pp_to_ff: true, crescendos: true },
        },
      };
    default:
      return base;
  }
}
