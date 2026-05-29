import OpenAI from "openai";
import { getGeminiApiKey, getOpenAIApiKey, getOpenAIBaseUrl, getOllamaUrl } from "@/lib/env";

export type AiProvider = "replit" | "gemini" | "ollama" | "openai" | "none";

let cachedOllamaUrl: string | null | undefined;

export function resetProviderCache(): void {
  cachedOllamaUrl = undefined;
}

export function isOnReplitRuntime(): boolean {
  return !!(
    process.env.REPL_ID ||
    process.env.REPLIT_DEPLOYMENT ||
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.REPLIT_CLUSTER
  );
}

export function hasReplitAiIntegration(): boolean {
  return !!(
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim() &&
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim()
  );
}

export function getActiveAiProvider(): AiProvider {
  if (hasReplitAiIntegration()) return "replit";
  if (getGeminiApiKey()?.trim()) return "gemini";
  if (getOllamaUrl()?.trim() || cachedOllamaUrl) return "ollama";
  const openaiKey = getOpenAIApiKey()?.trim();
  if (openaiKey) return "openai";
  return "none";
}

export function isZeroConfigAiAvailable(): boolean {
  const provider = getActiveAiProvider();
  if (provider !== "none") return true;
  return isOnReplitRuntime() && hasReplitAiIntegration();
}

export function isAnyAiProviderAvailable(): boolean {
  return getActiveAiProvider() !== "none" || cachedOllamaUrl != null;
}

export function getDefaultModelForProvider(provider: AiProvider = getActiveAiProvider()): string {
  switch (provider) {
    case "replit":
      return "gpt-4o-mini";
    case "gemini":
      return "gemini-2.0-flash";
    case "ollama":
      return "llama3.2";
    case "openai":
      return "gpt-4o-mini";
    default:
      return "gpt-4o-mini";
  }
}

export function getModelFallbackChain(provider: AiProvider = getActiveAiProvider()): string[] {
  switch (provider) {
    case "replit":
    case "openai":
      return ["gpt-4o-mini", "gpt-4o"];
    case "gemini":
      return ["gemini-2.0-flash", "gemini-1.5-flash"];
    case "ollama":
      return ["llama3.2", "llama3.1", "mistral", "phi3"];
    default:
      return [];
  }
}

async function probeOllamaEndpoint(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: AbortSignal.timeout(1200),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Try common local Ollama URLs once per process — no env var required on dev machines. */
export async function probeAndCacheOllama(): Promise<string | null> {
  if (cachedOllamaUrl !== undefined) return cachedOllamaUrl;

  const explicit = getOllamaUrl()?.trim();
  if (explicit) {
    cachedOllamaUrl = explicit.replace(/\/$/, "");
    return cachedOllamaUrl;
  }

  const candidates = ["http://127.0.0.1:11434", "http://localhost:11434"];
  for (const url of candidates) {
    if (await probeOllamaEndpoint(url)) {
      cachedOllamaUrl = url;
      process.env.OLLAMA_URL = url;
      return url;
    }
  }

  cachedOllamaUrl = null;
  return null;
}

export function buildAiClient(): {
  client: OpenAI;
  provider: AiProvider;
  isGemini: boolean;
  isOllama: boolean;
} {
  const geminiKey = getGeminiApiKey() ?? "";
  const ollamaUrl = getOllamaUrl() ?? cachedOllamaUrl ?? "";
  const openaiKey = getOpenAIApiKey() ?? "";
  const customBase = getOpenAIBaseUrl() ?? "";

  // 1) Replit-managed OpenAI — zero API key setup when integration is provisioned
  if (hasReplitAiIntegration()) {
    const client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
    });
    return { client, provider: "replit", isGemini: false, isOllama: false };
  }

  // 2) Gemini free tier (only if user already has a key in env)
  if (geminiKey.length > 10) {
    const client = new OpenAI({
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
    return { client, provider: "gemini", isGemini: true, isOllama: false };
  }

  // 3) Ollama — local, no API key
  if (ollamaUrl) {
    const client = new OpenAI({
      apiKey: "ollama",
      baseURL: `${ollamaUrl.replace(/\/$/, "")}/v1`,
    });
    return { client, provider: "ollama", isGemini: false, isOllama: true };
  }

  // 4) Generic OpenAI-compatible proxy (Replit secrets, host env, etc.)
  if (customBase && openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey, baseURL: customBase });
    return { client, provider: "openai", isGemini: false, isOllama: false };
  }

  if (openaiKey) {
    const client = new OpenAI({
      apiKey: openaiKey,
      ...(openaiKey.startsWith("sk-") ? {} : {}),
    });
    return { client, provider: "openai", isGemini: false, isOllama: false };
  }

  // 5) Dev-only localhost Ollama fallback
  if (process.env.NODE_ENV === "development" && cachedOllamaUrl) {
    const client = new OpenAI({
      apiKey: "ollama",
      baseURL: `${cachedOllamaUrl}/v1`,
    });
    return { client, provider: "ollama", isGemini: false, isOllama: true };
  }

  // Inert client — callers must check isAnyAiProviderAvailable() first
  const client = new OpenAI({ apiKey: "unconfigured", baseURL: "http://127.0.0.1:1/v1" });
  return { client, provider: "none", isGemini: false, isOllama: false };
}
