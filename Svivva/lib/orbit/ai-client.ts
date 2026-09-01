/**
 * Orbit marketing/admin AI — uses paid OpenAI when configured (see getOrbitActiveAiProvider).
 */
import {
  isEasyPeasyConfiguredFromEnv,
  getEasyPeasyModel,
  getEasyPeasyModelFallbackChain,
} from "@/lib/easypeasy/config";
import {
  getOrbitDefaultModel,
  getOrbitModelChain,
  isOrbitAiConfigured,
  isOrbitUsingGemini,
  isOrbitUsingOllama,
  orbitOpenai,
} from "@/lib/llm/openai";
import { getOrbitActiveAiProvider, getOrbitAiProviderLabel } from "@/lib/llm/providers";

export {
  isOrbitAiConfigured,
  isOrbitUsingGemini,
  isOrbitUsingOllama,
  getOrbitActiveAiProvider,
  getOrbitAiProviderLabel,
};

function isRetryableModelError(e: unknown): boolean {
  const msg = String(e instanceof Error ? e.message : e).toLowerCase();
  return (
    msg.includes("model") &&
    (msg.includes("not found") ||
      msg.includes("does not exist") ||
      msg.includes("invalid") ||
      msg.includes("unsupported"))
  );
}

/**
 * Model used for marketing + research work. Defaults to gpt-5 for paid OpenAI;
 * override with ORBIT_AI_MODEL in Vercel / Platform Secrets.
 */
export function getMarketingModel(): string {
  const override = process.env.ORBIT_AI_MODEL?.trim() || process.env.EASYPEASY_MODEL?.trim();
  if (override) return override;
  if (isEasyPeasyConfiguredFromEnv()) return getEasyPeasyModel();
  return getOrbitDefaultModel();
}

/** Ordered models for Orbit marketing — primary first, then fallbacks. */
export function getMarketingModelChain(): string[] {
  const primary = getMarketingModel();
  if (isEasyPeasyConfiguredFromEnv()) {
    return [...new Set([primary, ...getEasyPeasyModelFallbackChain()])];
  }
  return [...new Set([primary, ...getOrbitModelChain()])];
}

export async function generateText(
  prompt: string,
  opts: { maxTokens?: number; systemPrompt?: string; model?: string } = {},
): Promise<string> {
  const { maxTokens = 800, systemPrompt, model } = opts;
  const messages: { role: "system" | "user"; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const models = model ? [model] : getMarketingModelChain();
  let lastError: unknown;

  for (const m of models) {
    try {
      const res = await orbitOpenai.chat.completions.create({
        model: m,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      });
      return res.choices[0]?.message?.content?.trim() ?? "";
    } catch (e) {
      lastError = e;
      if (!isRetryableModelError(e) || m === models[models.length - 1]) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Generate and parse a JSON response, tolerating ```json fences. */
export async function generateJson<T = unknown>(
  prompt: string,
  opts: { maxTokens?: number; systemPrompt?: string; model?: string } = {},
): Promise<T> {
  const raw = await generateText(prompt, { maxTokens: 2000, ...opts });
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  const slice = start >= 0 ? cleaned.slice(start) : cleaned;
  return JSON.parse(slice) as T;
}
