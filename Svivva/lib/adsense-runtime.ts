import {
  isValidAdsenseClientId,
  isValidAdsenseSlotId,
  resolveSiteAdsenseClient,
} from "@/lib/adsense-credentials";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";

export type AdsenseRuntimeConfig = {
  client: string | null;
  slotBanner: string | null;
  slotInterstitial: string | null;
  slotRewarded: string | null;
};

function readSlot(envKey: string): string | null {
  const v = process.env[envKey]?.trim();
  return isValidAdsenseSlotId(v) ? v! : null;
}

/** Effective AdSense ids after optional DB hydrate (Orbit Platform Secrets). */
export async function getAdsenseRuntimeConfig(options?: {
  hydrate?: boolean;
}): Promise<AdsenseRuntimeConfig> {
  if (options?.hydrate !== false) {
    try {
      await hydratePlatformSecrets();
    } catch {
      /* DB optional in dev */
    }
  }

  const clientRaw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const client = isValidAdsenseClientId(clientRaw)
    ? clientRaw!
    : resolveSiteAdsenseClient(clientRaw);

  return {
    client: isValidAdsenseClientId(client) ? client : null,
    slotBanner: readSlot("NEXT_PUBLIC_ADSENSE_SLOT_BANNER"),
    slotInterstitial: readSlot("NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL"),
    slotRewarded: readSlot("NEXT_PUBLIC_ADSENSE_SLOT_REWARDED"),
  };
}

/** Inline script body for window.__ADSENSE_* (root layout). */
export function adsenseRuntimeInlineScript(config: AdsenseRuntimeConfig): string | null {
  if (!config.client) return null;
  let js = `window.__ADSENSE_CLIENT__=${JSON.stringify(config.client)};`;
  if (config.slotBanner) {
    js += `window.__ADSENSE_SLOT_BANNER__=${JSON.stringify(config.slotBanner)};`;
  }
  if (config.slotInterstitial) {
    js += `window.__ADSENSE_SLOT_INTERSTITIAL__=${JSON.stringify(config.slotInterstitial)};`;
  }
  if (config.slotRewarded) {
    js += `window.__ADSENSE_SLOT_REWARDED__=${JSON.stringify(config.slotRewarded)};`;
  }
  return js;
}
