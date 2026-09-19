/** Validate Google AdSense publisher / slot ids. */

export function isValidAdsenseClientId(raw: string | null | undefined): boolean {
  const v = raw?.trim() || "";
  return /^ca-pub-\d{10,20}$/.test(v);
}

export function isValidAdsenseSlotId(raw: string | null | undefined): boolean {
  const v = raw?.trim() || "";
  return /^\d{6,20}$/.test(v);
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
