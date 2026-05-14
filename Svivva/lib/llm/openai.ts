import OpenAI from "openai";
import { getOpenAIApiKey, getOpenAIBaseUrl, getOllamaUrl } from "@/lib/env";

let _client: OpenAI | null = null;
let _lastSig = "";
let _isOllama = false;

export function resetOpenAIClientCache() {
  _client = null;
  _lastSig = "";
  _isOllama = false;
}

function buildClient(): { client: OpenAI; isOllama: boolean } {
  const ollamaUrl = getOllamaUrl();
  const openaiKey = getOpenAIApiKey() ?? "";
  const customBase = getOpenAIBaseUrl() ?? "";

  // Priority: 1) Ollama (free, local, no key)  2) Custom base + key  3) OpenAI key
  if (ollamaUrl) {
    const client = new OpenAI({
      apiKey: "ollama",
      baseURL: `${ollamaUrl.replace(/\/$/, "")}/v1`,
    });
    return { client, isOllama: true };
  }

  if (customBase && openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey, baseURL: customBase });
    return { client, isOllama: false };
  }

  if (openaiKey && openaiKey.startsWith("sk-")) {
    const client = new OpenAI({ apiKey: openaiKey });
    return { client, isOllama: false };
  }

  // No OpenAI key configured — default to local Ollama (zero-config fallback)
  // If Ollama isn't running, the API call will show a clear connection error
  const defaultOllama = "http://127.0.0.1:11434";
  const client = new OpenAI({
    apiKey: "ollama",
    baseURL: `${defaultOllama}/v1`,
  });
  return { client, isOllama: true };
}

function getClientSync(): OpenAI {
  const ollamaUrl = getOllamaUrl();
  const openaiKey = getOpenAIApiKey() ?? "";
  const customBase = getOpenAIBaseUrl() ?? "";
  const sig = `${openaiKey}\0${customBase}\0${ollamaUrl ?? ""}`;
  if (!_client || sig !== _lastSig) {
    const { client, isOllama } = buildClient();
    _client = client;
    _isOllama = isOllama;
    _lastSig = sig;
  }
  return _client;
}

/** True when the active client points to a local Ollama instance. */
export function isUsingOllama(): boolean {
  getClientSync(); // ensure _isOllama is current
  return _isOllama;
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

/** Preferred model — Ollama-compatible if Ollama is active. */
export const DEFAULT_MODEL = "gpt-4o";

/** Runtime model selection — picks Ollama model when no OpenAI key (auto-detects Ollama). */
export function getDefaultModel(): string {
  const hasOpenAI = !!getOpenAIApiKey();
  const hasOllamaEnv = !!getOllamaUrl();
  // Ollama mode if: explicit OLLAMA_URL env, or no OpenAI key configured (zero-config fallback)
  return hasOllamaEnv || !hasOpenAI ? "llama3.2" : "gpt-4o";
}
