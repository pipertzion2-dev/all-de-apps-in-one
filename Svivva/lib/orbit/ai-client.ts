/**
 * Orbit marketing/admin AI — uses paid OpenAI when configured (see getOrbitActiveAiProvider).
 */
import {
  isEasyPeasyConfiguredFromEnv,
  getEasyPeasyModel,
  getEasyPeasyModelFallbackChain,
} from "@/lib/easypeasy/runtime";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import {
  getOrbitDefaultModel,
  getOrbitModelChain,
  isOrbitAiConfigured,
  isOrbitUsingGemini,
  isOrbitUsingOllama,
  orbitOpenai,
  resetOpenAIClientCache,
} from "@/lib/llm/openai";
import {
  buildAiClient,
  getOrbitActiveAiProvider,
  getOrbitAiProviderLabel,
  getOrbitDefaultModelForProvider,
  getOrbitModelFallbackChain,
  type AiProvider,
} from "@/lib/llm/providers";

export {
  isOrbitAiConfigured,
  isOrbitUsingGemini,
  isOrbitUsingOllama,
  getOrbitActiveAiProvider,
  getOrbitAiProviderLabel,
};

function isRetryableModelError(e: unknown): boolean {
  const msg = String(e instanceof Error ? e.message : e);
  // Same EasyPeasy account quota — switching models (especially to premium) cannot fix this.
  if (isEasyPeasyWordLimitError(msg)) return false;
  const lower = msg.toLowerCase();
  if (lower.includes("rate limit")) return true;
  if (lower.includes("401") || lower.includes("403") || lower.includes("invalid api key"))
    return false;
  return (
    lower.includes("model") &&
    (lower.includes("not found") ||
      lower.includes("does not exist") ||
      lower.includes("invalid") ||
      lower.includes("unsupported"))
  );
}

function isProviderLevelFailure(e: unknown): boolean {
  const msg = String(e instanceof Error ? e.message : e).toLowerCase();
  return (
    isEasyPeasyWordLimitError(msg) ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("invalid api key") ||
    msg.includes("not configured") ||
    (msg.includes("easypeasy") && msg.includes("fail"))
  );
}

/** Provider fallback order when the active route fails mid-run. */
function getOrbitProviderFallbackChain(active: AiProvider): AiProvider[] {
  const chain: AiProvider[] = [];
  if (active !== "gemini") chain.push("gemini");
  if (active !== "openai") chain.push("openai");
  if (active === "openai" && isEasyPeasyConfiguredFromEnv()) {
    // Already on EasyPeasy openai route — no further openai fallback
  }
  return chain.filter((p) => p !== active);
}

/**
 * Model used for marketing + research work. Defaults to gpt-5 for paid OpenAI;
 * override with ORBIT_AI_MODEL in Vercel / Platform Secrets.
 */
export function getMarketingModel(): string {
  const provider = getOrbitActiveAiProvider();
  if (provider === "openai" && isEasyPeasyConfiguredFromEnv()) return getEasyPeasyModel();
  const override = process.env.ORBIT_AI_MODEL?.trim();
  if (override) return override;
  return getOrbitDefaultModel();
}

/** Ordered models for Orbit marketing — primary first, then fallbacks. */
export function getMarketingModelChain(): string[] {
  const primary = getMarketingModel();
  const provider = getOrbitActiveAiProvider();
  if (provider === "openai" && isEasyPeasyConfiguredFromEnv()) {
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

  async function tryModels(
    client: typeof orbitOpenai,
    modelList: string[],
  ): Promise<string | null> {
    for (const m of modelList) {
      try {
        const res = await client.chat.completions.create({
          model: m,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        });
        return res.choices[0]?.message?.content?.trim() ?? "";
      } catch (e) {
        lastError = e;
        if (!isRetryableModelError(e) || m === modelList[modelList.length - 1]) break;
      }
    }
    return null;
  }

  const primary = await tryModels(orbitOpenai, models);
  if (primary != null) return primary;

  if (lastError && isProviderLevelFailure(lastError)) {
    const active = getOrbitActiveAiProvider();
    for (const fallbackProvider of getOrbitProviderFallbackChain(active)) {
      const built = buildAiClient(fallbackProvider);
      if (built.provider === "none") continue;
      const fallbackModels = [
        ...new Set([
          getOrbitDefaultModelForProvider(fallbackProvider),
          ...getOrbitModelFallbackChain(fallbackProvider),
        ]),
      ];
      process.env.ORBIT_AI_PROVIDER = fallbackProvider;
      resetOpenAIClientCache();
      const text = await tryModels(built.client, fallbackModels);
      if (text != null) return text;
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
