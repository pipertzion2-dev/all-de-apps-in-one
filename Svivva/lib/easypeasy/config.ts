import { getOpenAIApiKey, getOpenAIBaseUrl } from "@/lib/env";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";

/** OpenAI-compatible chat completions base URL. */
export const EASYPEASY_BASE_URL = "https://easy-peasy.ai/api";

/** Default model on EasyPeasy — override with EASYPEASY_MODEL or ORBIT_AI_MODEL. */
export const EASYPEASY_DEFAULT_MODEL = "gemini-3-flash";

export function isEasyPeasyBaseUrl(url: string | null | undefined): boolean {
  const t = url?.trim().toLowerCase();
  if (!t) return false;
  return t.includes("easy-peasy.ai");
}

export function getEasyPeasyModel(): string {
  return (
    process.env.EASYPEASY_MODEL?.trim() ||
    process.env.ORBIT_AI_MODEL?.trim() ||
    EASYPEASY_DEFAULT_MODEL
  );
}

export function isEasyPeasyConfiguredFromEnv(): boolean {
  if (process.env.EASYPEASY_API_KEY?.trim()) return true;
  const key = getOpenAIApiKey()?.trim();
  const base = getOpenAIBaseUrl()?.trim();
  return !!(key && base && isEasyPeasyBaseUrl(base));
}

export type EasyPeasyConfig = {
  apiKey: string | null;
  baseUrl: string;
  model: string;
};

function trimKey(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t || null;
}

function fromEnv(): EasyPeasyConfig {
  const envKey = trimKey(process.env.EASYPEASY_API_KEY);
  const openaiKey = trimKey(process.env.ORBIT_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  const base =
    trimKey(process.env.ORBIT_OPENAI_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) ||
    EASYPEASY_BASE_URL;

  if (envKey) {
    return { apiKey: envKey, baseUrl: EASYPEASY_BASE_URL, model: getEasyPeasyModel() };
  }

  if (openaiKey && isEasyPeasyBaseUrl(base)) {
    return { apiKey: openaiKey, baseUrl: EASYPEASY_BASE_URL, model: getEasyPeasyModel() };
  }

  return { apiKey: null, baseUrl: EASYPEASY_BASE_URL, model: getEasyPeasyModel() };
}

export function mergeEasyPeasyConfig(
  db: Partial<{ apiKey: string | null; baseUrl: string | null }> | null | undefined,
): EasyPeasyConfig {
  const env = fromEnv();
  const dbKey = trimKey(db?.apiKey);
  const dbBase = trimKey(db?.baseUrl);

  if (env.apiKey) return env;

  if (dbKey && isEasyPeasyBaseUrl(dbBase)) {
    return {
      apiKey: dbKey,
      baseUrl: EASYPEASY_BASE_URL,
      model: getEasyPeasyModel(),
    };
  }

  return env;
}

export async function loadEasyPeasyConfig(): Promise<EasyPeasyConfig> {
  const row = await getPlatformRuntimeSecretsRow();
  return mergeEasyPeasyConfig(
    row
      ? {
          apiKey: row.openaiApiKey,
          baseUrl: row.openaiBaseUrl,
        }
      : null,
  );
}

export function isEasyPeasyActive(config: EasyPeasyConfig): boolean {
  return !!config.apiKey?.trim();
}

export function isEasyPeasyActiveNow(): boolean {
  return isEasyPeasyConfiguredFromEnv();
}
