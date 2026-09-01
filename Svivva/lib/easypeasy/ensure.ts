import {
  hydratePlatformSecrets,
  patchPlatformRuntimeSecrets,
  getPlatformRuntimeSecretsRow,
} from "@/lib/platform-runtime-secrets";
import {
  EASYPEASY_BASE_URL,
  isEasyPeasyActive,
  loadEasyPeasyConfig,
  mergeEasyPeasyConfig,
} from "@/lib/easypeasy/config";
import { testEasyPeasyConnection } from "@/lib/easypeasy/client";
import {
  EASYPEASY_DEFAULT_TIER_ID,
  resolveEasyPeasyTierId,
  type EasyPeasyTierId,
} from "@/lib/easypeasy/tiers";

export type EnsureEasyPeasyResult = {
  ok: boolean;
  active: boolean;
  tierId: EasyPeasyTierId;
  model: string;
  tested: boolean;
  testReply?: string;
  error?: string;
  /** True when this call wrote key/base/tier to platform secrets */
  configuredNow: boolean;
};

export type EnsureEasyPeasyOptions = {
  /** Tier to apply when missing or when forceTier is true */
  tierId?: EasyPeasyTierId;
  /** Always patch tier even if one is already stored */
  forceTier?: boolean;
  /** Ping chat completions before returning */
  testConnection?: boolean;
};

/**
 * Idempotent: hydrates secrets, ensures EasyPeasy base URL + tier, optionally tests API.
 * Used by Orbit one-click admin before marketing autopilot runs.
 */
export async function ensureEasyPeasyForOrbit(
  opts: EnsureEasyPeasyOptions = {},
): Promise<EnsureEasyPeasyResult> {
  await hydratePlatformSecrets();

  const tierId = resolveEasyPeasyTierId(opts.tierId ?? process.env.EASYPEASY_TIER);
  let configuredNow = false;

  const envKey = process.env.EASYPEASY_API_KEY?.trim();
  let config = await loadEasyPeasyConfig();

  const patch: Parameters<typeof patchPlatformRuntimeSecrets>[0] = {};

  if (envKey && !config.apiKey) {
    patch.openaiApiKey = envKey;
    patch.openaiBaseUrl = EASYPEASY_BASE_URL;
    configuredNow = true;
  }

  if (opts.tierId && (opts.forceTier || !config.tierId || config.tierId !== tierId)) {
    const row = await getPlatformRuntimeSecretsRow();
    const storedTier = row?.easypeasyTier?.trim();
    if (opts.forceTier || !storedTier || storedTier !== tierId) {
      patch.easypeasyTier = tierId;
      configuredNow = true;
    }
  }

  if (Object.keys(patch).length > 0) {
    await patchPlatformRuntimeSecrets(patch);
    await hydratePlatformSecrets();
    config = await loadEasyPeasyConfig();
  }

  if (!isEasyPeasyActive(config)) {
    const merged = mergeEasyPeasyConfig(
      config.apiKey
        ? { apiKey: config.apiKey, baseUrl: config.baseUrl, tierId: config.tierId }
        : null,
    );
    if (!isEasyPeasyActive(merged)) {
      return {
        ok: false,
        active: false,
        tierId: EASYPEASY_DEFAULT_TIER_ID,
        model: merged.model,
        tested: false,
        configuredNow,
        error:
          "EasyPeasy is not configured — paste your API key in Launchpad or set EASYPEASY_API_KEY in Vercel.",
      };
    }
    config = merged;
  }

  const resolvedTier = resolveEasyPeasyTierId(config.tierId ?? tierId);
  let tested = false;
  let testReply: string | undefined;
  let error: string | undefined;

  if (opts.testConnection !== false) {
    const test = await testEasyPeasyConnection({
      apiKey: config.apiKey!,
      model: config.model,
    });
    tested = true;
    if (test.ok) {
      testReply = test.reply;
    } else {
      error = test.error;
      return {
        ok: false,
        active: true,
        tierId: resolvedTier,
        model: config.model,
        tested,
        testReply,
        configuredNow,
        error: test.error,
      };
    }
  }

  return {
    ok: true,
    active: true,
    tierId: resolvedTier,
    model: config.model,
    tested,
    testReply,
    configuredNow,
    error,
  };
}
