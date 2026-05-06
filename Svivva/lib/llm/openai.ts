import OpenAI from "openai";
import { getOpenAIApiKey, getOpenAIBaseUrl } from "@/lib/env";

let _client: OpenAI | null = null;
let _lastSig = "";

export function resetOpenAIClientCache() {
  _client = null;
  _lastSig = "";
}

function getClientSync(): OpenAI {
  const apiKey = getOpenAIApiKey() ?? "";
  const baseURL = getOpenAIBaseUrl() ?? "";
  const sig = `${apiKey}\0${baseURL}`;
  if (!_client || sig !== _lastSig) {
    _client = new OpenAI({
      apiKey: apiKey || "unconfigured-set-OPENAI_API_KEY",
      ...(baseURL ? { baseURL } : {}),
    });
    _lastSig = sig;
  }
  return _client;
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

export const DEFAULT_MODEL = "gpt-4o";
