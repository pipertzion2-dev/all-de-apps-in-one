import OpenAI from "openai";
import { getOpenAIApiKey, getOpenAIBaseUrl, getOllamaUrl, getGeminiApiKey } from "@/lib/env";

let _client: OpenAI | null = null;
let _lastSig = "";
let _isOllama = false;
let _isGemini = false;

export function resetOpenAIClientCache() {
  _client = null;
  _lastSig = "";
  _isOllama = false;
  _isGemini = false;
}

function buildClient(): { client: OpenAI; isOllama: boolean; isGemini: boolean } {
  const geminiKey = getGeminiApiKey() ?? "";
  const ollamaUrl = getOllamaUrl();
  const openaiKey = getOpenAIApiKey() ?? "";
  const customBase = getOpenAIBaseUrl() ?? "";

  // Priority: 1) Gemini (free, cloud, works on Vercel)  2) Ollama (free, local)  3) OpenAI (paid)
  if (geminiKey && geminiKey.length > 10) {
    const client = new OpenAI({
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
    return { client, isOllama: false, isGemini: true };
  }

  if (ollamaUrl) {
    const client = new OpenAI({
      apiKey: "ollama",
      baseURL: `${ollamaUrl.replace(/\/$/, "")}/v1`,
    });
    return { client, isOllama: true, isGemini: false };
  }

  if (customBase && openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey, baseURL: customBase });
    return { client, isOllama: false, isGemini: false };
  }

  if (openaiKey && openaiKey.startsWith("sk-")) {
    const client = new OpenAI({ apiKey: openaiKey });
    return { client, isOllama: false, isGemini: false };
  }

  if (openaiKey) {
    const client = new OpenAI({
      apiKey: openaiKey,
      ...(customBase ? { baseURL: customBase } : {}),
    });
    return { client, isOllama: false, isGemini: false };
  }

  if (process.env.NODE_ENV === "development") {
    const defaultOllama = "http://127.0.0.1:11434";
    const client = new OpenAI({
      apiKey: "ollama",
      baseURL: `${defaultOllama}/v1`,
    });
    return { client, isOllama: true, isGemini: false };
  }

  throw new Error(
    "No AI provider configured. Set GEMINI_API_KEY, AI_INTEGRATIONS_OPENAI_API_KEY, or OLLAMA_URL.",
  );
}

function getClientSync(): OpenAI {
  const geminiKey = getGeminiApiKey() ?? "";
  const ollamaUrl = getOllamaUrl();
  const openaiKey = getOpenAIApiKey() ?? "";
  const customBase = getOpenAIBaseUrl() ?? "";
  const sig = `${openaiKey}\0${customBase}\0${ollamaUrl ?? ""}\0${geminiKey}`;
  if (!_client || sig !== _lastSig) {
    const { client, isOllama, isGemini } = buildClient();
    _client = client;
    _isOllama = isOllama;
    _isGemini = isGemini;
    _lastSig = sig;
  }
  return _client;
}

/** True when the active client points to a local Ollama instance. */
export function isUsingOllama(): boolean {
  getClientSync();
  return _isOllama;
}

/** True when the active client points to Google Gemini. */
export function isUsingGemini(): boolean {
  getClientSync();
  return _isGemini;
}

/** Lazily built so DB-hydrated keys apply after instrumentation. */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getClientSync();
    const value = Reflect.get(client, prop, client);
    if (typeof value === "function") return value.bind(client);
    return value;
  },
});

/** Preferred model — Gemini/Ollama-compatible. */
export const DEFAULT_MODEL = "gemini-2.0-flash";

/** Runtime model selection — Gemini first, then Ollama, then OpenAI. */
export function getDefaultModel(): string {
  const hasGemini = !!getGeminiApiKey();
  const hasOllamaEnv = !!getOllamaUrl();
  const hasOpenAI = !!getOpenAIApiKey();
  if (hasGemini) return "gemini-2.0-flash";
  if (hasOllamaEnv || !hasOpenAI) return "llama3.2";
  return "gpt-4o";
}

/**
 * Orbit / Launchpad marketing steps: use only “free-tier friendly” providers.
 * - Google Gemini (`GEMINI_API_KEY` from AI Studio — generous free quota)
 * - Self-hosted Ollama (`OLLAMA_URL`)
 *
 * Paid OpenAI is intentionally excluded so Orbit never consumes `sk-*` keys here.
 */
export function isOrbitFreeAIConfigured(): boolean {
  return !!(getGeminiApiKey()?.trim() || getOllamaUrl()?.trim());
}
