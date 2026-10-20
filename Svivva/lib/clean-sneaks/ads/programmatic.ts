/**
 * Free-to-join publisher networks (no Google approval wait).
 * Sign up → paste tag / invoke URL into Vercel env → redeploy.
 */

export type ProgrammaticNetwork = "monetag" | "adsterra" | "medianet";

/** All configured alt networks (Monetag → Adsterra → Media.net). */
export function configuredProgrammaticNetworks(): ProgrammaticNetwork[] {
  const out: ProgrammaticNetwork[] = [];
  if (process.env.NEXT_PUBLIC_MONETAG_ZONE_ID?.trim()) out.push("monetag");
  if (process.env.NEXT_PUBLIC_ADSTERRA_INVOKE_URL?.trim()) out.push("adsterra");
  if (process.env.NEXT_PUBLIC_MEDIANET_CID?.trim()) out.push("medianet");
  return out;
}

/** First configured free network (Monetag is fastest signup for many publishers). */
export function programmaticNetwork(): ProgrammaticNetwork | null {
  return configuredProgrammaticNetworks()[0] ?? null;
}

export function monetagZoneId(): string | null {
  const z = process.env.NEXT_PUBLIC_MONETAG_ZONE_ID?.trim();
  return z && z.length >= 4 ? z : null;
}

export function preferProgrammaticOverAdsense(): boolean {
  if (process.env.NEXT_PUBLIC_PREFER_PROGRAMMATIC_ADS === "1") return true;
  if (process.env.NEXT_PUBLIC_PREFER_PROGRAMMATIC_ADS === "0") return false;
  const alts = configuredProgrammaticNetworks();
  const adsenseBannerReady =
    process.env.NEXT_PUBLIC_KLEAN_USE_ADSENSE?.trim() === "1" &&
    Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim());
  /** When both paid stacks are wired, rotate instead of hiding AdSense behind Monetag. */
  if (adsenseBannerReady && alts.length > 0) return false;
  if (alts.length > 0) return true;
  return !process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim();
}

export function medianetConfig(): { cid: string; tagId: string } | null {
  const cid = process.env.NEXT_PUBLIC_MEDIANET_CID?.trim();
  const tagId = process.env.NEXT_PUBLIC_MEDIANET_TAG_ID?.trim() || "6253254";
  if (!cid) return null;
  return { cid, tagId };
}

export function adsterraInvokeUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_ADSTERRA_INVOKE_URL?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url;
}

export function adsterraContainerId(): string {
  return process.env.NEXT_PUBLIC_ADSTERRA_CONTAINER_ID?.trim() || "adsterra-klean-banner";
}
