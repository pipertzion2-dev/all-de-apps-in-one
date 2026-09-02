import OpenAI from "openai";
import { getGeminiApiKey, getOpenAIApiKey, getOpenAIBaseUrl } from "@/lib/env";
import { ensureEasyPeasyForOrbit } from "@/lib/easypeasy/ensure";
import { isEasyPeasyConfiguredFromEnv } from "@/lib/easypeasy/runtime";
import {
  getOrbitActiveAiProvider,
  getOrbitAiProviderLabel,
  getOrbitDefaultModelForProvider,
  type AiProvider,
} from "@/lib/llm/providers";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import {
  describeOrbitAiAlternatives,
  getOrbitAiAlternatives,
  type OrbitAiAlternative,
} from "@/lib/orbit/orbit-ai-alternatives";
import { resetOpenAIClientCache } from "@/lib/llm/openai";

export type EnsureOrbitAiResult = {
  ok: boolean;
  provider: AiProvider | "easypeasy" | "none";
  providerLabel: string;
  model: string;
  tested: boolean;
  testReply?: string;
  error?: string;
  /** Suggested next steps when ok is false or a lower-priority provider was used after fallback */
  alternatives: OrbitAiAlternative[];
  /** True when we fell back from a higher-priority provider that failed its connection test */
  usedFallback: boolean;
  failedProvider?: AiProvider | "easypeasy";
};

type ProviderProbe = {
  id: AiProvider | "easypeasy";
  label: string;
  model: string;
  canTry: boolean;
};

async function testAiConnection(
  client: OpenAI,
  model: string,
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Reply with exactly the word OK." }],
      max_tokens: 16,
      temperature: 0,
    });
    const reply = completion.choices[0]?.message?.content?.trim() || "";
    if (!reply) return { ok: false, error: "Empty response from AI provider" };
    return { ok: true, reply };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function buildGeminiClient(): OpenAI | null {
  const key = getGeminiApiKey()?.trim();
  if (!key || key.length < 10) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

function buildDirectOpenAiClient(): OpenAI | null {
  const key =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.ORBIT_OPENAI_API_KEY?.trim() ||
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim();
  if (!key?.startsWith("sk-")) return null;
  const base = getOpenAIBaseUrl()?.trim();
  if (base && base.includes("easy-peasy.ai")) return null;
  if (base) return new OpenAI({ apiKey: key, baseURL: base });
  return new OpenAI({ apiKey: key });
}

function orderedProbes(): ProviderProbe[] {
  const probes: ProviderProbe[] = [
    {
      id: "gemini",
      label: "Google Gemini",
      model: getOrbitDefaultModelForProvider("gemini"),
      canTry: !!buildGeminiClient(),
    },
    {
      id: "openai",
      label: "OpenAI",
      model: getOrbitDefaultModelForProvider("openai"),
      canTry: !!buildDirectOpenAiClient(),
    },
    {
      id: "easypeasy",
      label: "EasyPeasy.AI",
      model: getOrbitDefaultModelForProvider("openai"),
      canTry: isEasyPeasyConfiguredFromEnv(),
    },
  ];
  return probes.filter((p) => p.canTry);
}

async function probeProvider(
  probe: ProviderProbe,
  testConnection: boolean,
): Promise<{ ok: boolean; testReply?: string; error?: string }> {
  if (probe.id === "easypeasy") {
    const ep = await ensureEasyPeasyForOrbit({ testConnection, tierId: "standard", forceTier: true });
    if (ep.ok) {
      resetOpenAIClientCache();
      return { ok: true, testReply: ep.testReply };
    }
    return { ok: false, error: ep.error ?? "EasyPeasy connection failed" };
  }

  const client = probe.id === "gemini" ? buildGeminiClient() : buildDirectOpenAiClient();
  if (!client) return { ok: false, error: `${probe.label} is not configured` };

  if (!testConnection) {
    resetOpenAIClientCache();
    return { ok: true };
  }

  const test = await testAiConnection(client, probe.model);
  if (test.ok) {
    resetOpenAIClientCache();
    return { ok: true, testReply: test.reply };
  }
  return { ok: false, error: test.error };
}

/**
 * Wire a working Orbit AI provider before autopilot runs.
 * Prefers Gemini → direct OpenAI → EasyPeasy (last resort).
 */
export async function ensureOrbitAiForRun(opts?: {
  testConnection?: boolean;
}): Promise<EnsureOrbitAiResult> {
  await hydratePlatformSecrets();
  const testConnection = opts?.testConnection ?? true;
  const probes = orderedProbes();

  if (probes.length === 0) {
    const alts = getOrbitAiAlternatives();
    return {
      ok: false,
      provider: "none",
      providerLabel: "none",
      model: "",
      tested: false,
      error: `No AI provider configured. ${describeOrbitAiAlternatives()}`,
      alternatives: alts,
      usedFallback: false,
    };
  }

  let failedProvider: AiProvider | "easypeasy" | undefined;
  let lastError: string | undefined;

  for (let i = 0; i < probes.length; i++) {
    const probe = probes[i];
    const result = await probeProvider(probe, testConnection);

    if (result.ok) {
      // Force env to match winning provider when not EasyPeasy
      if (probe.id === "gemini") {
        process.env.ORBIT_AI_PROVIDER = "gemini";
      } else if (probe.id === "openai") {
        process.env.ORBIT_AI_PROVIDER = "openai";
      }
      resetOpenAIClientCache();

      const activeProvider = getOrbitActiveAiProvider();
      return {
        ok: true,
        provider: probe.id,
        providerLabel: getOrbitAiProviderLabel(activeProvider),
        model: probe.model,
        tested: testConnection,
        testReply: result.testReply,
        alternatives: getOrbitAiAlternatives([probe.id]),
        usedFallback: i > 0,
        failedProvider: i > 0 ? failedProvider : undefined,
      };
    }

    failedProvider = probe.id;
    lastError = result.error;

    // Word-limit on EasyPeasy — don't keep trying EasyPeasy variants; move on (already last)
    if (probe.id === "easypeasy" && isEasyPeasyWordLimitError(lastError)) {
      break;
    }
  }

  const alts = getOrbitAiAlternatives(failedProvider ? [failedProvider] : undefined);
  const altText = describeOrbitAiAlternatives(failedProvider ? [failedProvider] : undefined);

  return {
    ok: false,
    provider: failedProvider ?? "none",
    providerLabel: failedProvider ? String(failedProvider) : "none",
    model: "",
    tested: testConnection,
    error: lastError
      ? `${lastError}${altText ? ` — ${altText}` : ""}`
      : `No working AI provider. ${altText}`,
    alternatives: alts,
    usedFallback: false,
    failedProvider,
  };
}
