/** Validate Google AdSense publisher / slot ids. */

/**
 * zzaizzai.com AdSense publisher client (public ca-pub id).
 * Used for site verification + Auto ads when Orbit/Vercel env is empty.
 */
export const SITE_ADSENSE_CLIENT = "ca-pub-3958850022852446";

/**
 * Default Display ad unit slot for zzaizzai.com (ZZAI ADS).
 * Env / Orbit Platform Secrets override this when set.
 */
export const SITE_ADSENSE_SLOT_BANNER = "9914022148";

export function isValidAdsenseClientId(raw: string | null | undefined): boolean {
  const v = raw?.trim() || "";
  return /^ca-pub-\d{10,20}$/.test(v);
}

/** Effective client: env / Orbit hydrate wins, else site default. */
export function resolveSiteAdsenseClient(
  raw: string | null | undefined = process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
): string {
  const fromEnv = raw?.trim() || "";
  if (isValidAdsenseClientId(fromEnv)) return fromEnv;
  return SITE_ADSENSE_CLIENT;
}

export function isValidAdsenseSlotId(raw: string | null | undefined): boolean {
  const v = raw?.trim() || "";
  return /^\d{6,20}$/.test(v);
}

/** Effective banner slot: env / Orbit wins, else site Display unit. */
export function resolveSiteAdsenseSlotBanner(
  raw: string | null | undefined = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER,
): string {
  const fromEnv = raw?.trim() || "";
  if (isValidAdsenseSlotId(fromEnv)) return fromEnv;
  return SITE_ADSENSE_SLOT_BANNER;
}

/** Normalize pasted values (trim, strip accidental "ca-" on pub-only paste). */
export function normalizeAdsenseClientId(raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (/^pub-\d{10,20}$/.test(v)) v = `ca-${v}`;
  return isValidAdsenseClientId(v) ? v : null;
}

export function normalizeAdsenseSlotId(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  return isValidAdsenseSlotId(v) ? v : null;
}
