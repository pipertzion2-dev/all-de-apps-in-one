import { getOllamaApiBase, getOllamaModel } from "@/lib/env";
import { getActiveAiProvider } from "@/lib/llm/providers";
import type { StylePresetId, TransformOptions } from "./types";
import { STYLE_PRESETS } from "./style-presets";

export type AiEvolutionPlan = {
  preset: StylePresetId;
  stevieSlides: boolean;
  meendLevel: TransformOptions["meendLevel"];
  intentSummary: string;
  harmonicDirection: string;
  motifFocus: string;
  provider?: string;
  model?: string;
};

const SYSTEM_PROMPT =
  "You interpret music transformation prompts for a MIDI evolution engine. " +
  'Return strict JSON: {"preset":"glasper|derrick-hodge|stevie-wonder|indian-fusion|custom",' +
  '"stevieSlides":boolean,"meendLevel":"off|light|medium|heavy",' +
  '"intentSummary":"short","harmonicDirection":"short","motifFocus":"short"}';

function extractJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function heuristicPlan(prompt: string, selected: StylePresetId): AiEvolutionPlan {
  const text = prompt.toLowerCase();
  let preset = selected;
  for (const [id, p] of Object.entries(STYLE_PRESETS) as [
    StylePresetId,
    typeof STYLE_PRESETS.glasper,
  ][]) {
    if (id !== "custom" && p.keywords.some((k) => text.includes(k))) {
      preset = selected === "custom" ? id : selected;
      break;
    }
  }
  const stevieSlides = /\b(stevie|slide|legato)\b/i.test(prompt);
  const meendLevel: AiEvolutionPlan["meendLevel"] = /\b(meend|indian|raga|ornament)\b/i.test(prompt)
    ? "heavy"
    : /\b(subtle|light)\b/i.test(prompt)
      ? "light"
      : stevieSlides
        ? "medium"
        : "off";

  return {
    preset,
    stevieSlides,
    meendLevel,
    intentSummary: prompt.slice(0, 120) || "Style-driven harmonic evolution",
    harmonicDirection: STYLE_PRESETS[preset].description,
    motifFocus: /\b(continuation|next part)\b/i.test(prompt) ? "continuation" : "motif genealogy",
    provider: "heuristic",
  };
}

async function planWithOllama(
  prompt: string,
  selected: StylePresetId,
): Promise<AiEvolutionPlan | null> {
  const host = getOllamaApiBase() ?? "http://127.0.0.1:11434";
  const model = getOllamaModel();
  try {
    const resp = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Selected preset: ${selected}. Prompt: ${prompt}`,
          },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { message?: { content?: string } };
    const parsed = extractJson(data.message?.content ?? "");
    if (!parsed) return null;

    const presetRaw = String(parsed.preset ?? selected) as StylePresetId;
    const preset = presetRaw in STYLE_PRESETS ? presetRaw : selected;
    const meendRaw = String(parsed.meendLevel ?? "off");
    const meendLevel = (["off", "light", "medium", "heavy"] as const).includes(meendRaw as "off")
      ? (meendRaw as AiEvolutionPlan["meendLevel"])
      : "off";

    return {
      preset,
      stevieSlides: Boolean(parsed.stevieSlides),
      meendLevel,
      intentSummary: String(parsed.intentSummary ?? prompt.slice(0, 120)),
      harmonicDirection: String(parsed.harmonicDirection ?? STYLE_PRESETS[preset].description),
      motifFocus: String(parsed.motifFocus ?? "motif genealogy"),
      provider: "ollama",
      model,
    };
  } catch {
    return null;
  }
}

/** Ollama-first prompt interpretation with deterministic fallback. */
export async function interpretEvolutionPrompt(
  prompt: string,
  selected: StylePresetId,
): Promise<AiEvolutionPlan> {
  const provider = getActiveAiProvider();
  if (provider === "ollama" || getOllamaApiBase()) {
    const ollamaPlan = await planWithOllama(prompt, selected);
    if (ollamaPlan) return ollamaPlan;
  }
  return heuristicPlan(prompt, selected);
}

export function mergePlanIntoOptions(
  plan: AiEvolutionPlan,
  base: TransformOptions,
): TransformOptions {
  return {
    ...base,
    preset: base.preset === "custom" ? plan.preset : base.preset,
    stevieSlides: base.stevieSlides ?? plan.stevieSlides,
    meendLevel: base.meendLevel ?? plan.meendLevel,
  };
}
