/**
 * Orbit marketing/admin AI — uses paid OpenAI when configured (see getOrbitActiveAiProvider).
 */
import {
  getOrbitDefaultModel,
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

/**
 * Model used for marketing + research work. Defaults to the provider's model,
 * but can be upgraded to a stronger model (e.g. gpt-4o, gpt-4.1)
 * by setting ORBIT_AI_MODEL — no code change needed when you add credits.
 */
export function getMarketingModel(): string {
  const override = process.env.ORBIT_AI_MODEL?.trim();
  return override || getOrbitDefaultModel();
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

  const res = await orbitOpenai.chat.completions.create({
    model: model || getMarketingModel(),
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });

  return res.choices[0]?.message?.content?.trim() ?? "";
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
