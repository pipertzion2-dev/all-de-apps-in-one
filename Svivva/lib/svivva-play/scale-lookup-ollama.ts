/**
 * V-1 JAWN Ollama scale resolver — local LLM with alternates + fuzzy fallback.
 */
import { lookupScaleLocal, matchFromAiPayload, type ScaleLookupAlternate } from "./scale-lookup";
import { scaleNoteNames } from "./reich-engine";
import { registerDynamicScale } from "./dynamic-scales";

const LLM_SYSTEM_PROMPT =
  "You map freeform music prompts to 12-TET scales. Output strict JSON: " +
  '{"matched_scale":"snake_case","intervals":[0,2,...],"confidence":0.0-1.0,' +
  '"alternates":[{"name":"...","intervals":[...]}],"reason":"short string"}';

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

export async function lookupScaleWithOllama(
  query: string,
  keyRoot: string,
): Promise<{
  resolved: ReturnType<typeof matchFromAiPayload>;
  alternates: ScaleLookupAlternate[];
} | null> {
  const host = process.env.OLLAMA_HOST ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3.1";

  try {
    const resp = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: LLM_SYSTEM_PROMPT },
          { role: "user", content: `Prompt: ${query}` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { message?: { content?: string } };
    const parsed = extractJson(data.message?.content ?? "");
    if (!parsed) return null;

    const match = matchFromAiPayload({
      scaleId: String(parsed.matched_scale ?? parsed.scaleId ?? ""),
      relativeSemitoneSteps: parsed.intervals as number[] | undefined,
      displayName: String(parsed.matched_scale ?? ""),
      reason: String(parsed.reason ?? "Ollama scale lookup"),
    });
    if (!match) return null;
    match.source = "ollama";
    match.confidence = Math.round(Number(parsed.confidence ?? 0.85) * 100);
    match.noteNames = scaleNoteNames(match.scaleId, keyRoot);
    registerDynamicScale(match.scaleId, match.relativeSteps);

    const alternates: ScaleLookupAlternate[] = [];
    const rawAlts = parsed.alternates;
    if (Array.isArray(rawAlts)) {
      for (const alt of rawAlts.slice(0, 5)) {
        if (!alt || typeof alt !== "object") continue;
        const a = alt as Record<string, unknown>;
        const steps = Array.isArray(a.intervals)
          ? (a.intervals as number[]).map((n) => ((Number(n) % 12) + 12) % 12).sort((x, y) => x - y)
          : null;
        if (!steps || steps.length < 3) continue;
        const id = String(a.name ?? "").trim().toLowerCase().replace(/\s+/g, "_");
        if (!id) continue;
        alternates.push({ scaleId: id, label: id.replace(/_/g, " "), relativeSteps: steps });
      }
    }

    return { resolved: match, alternates };
  } catch {
    return null;
  }
}

export function lookupScaleWithProvider(
  query: string,
  keyRoot: string,
  provider: "openai" | "ollama" | "local",
): Promise<ReturnType<typeof lookupScaleLocal>> {
  const local = lookupScaleLocal(query, keyRoot);
  if (provider === "local" || local.resolved) {
    return Promise.resolve(local);
  }
  if (provider === "ollama") {
    return lookupScaleWithOllama(query, keyRoot).then((r) => {
      if (!r?.resolved) return local;
      return {
        query,
        resolved: r.resolved,
        suggestions: local.suggestions,
        alternates: r.alternates,
      };
    });
  }
  return Promise.resolve(local);
}
