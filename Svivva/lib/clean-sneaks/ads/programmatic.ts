/**
 * Alternatives when Google AdSense has no fill or is not approved.
 * Configure one network via env — Media.net or Adsterra invoke script.
 */

export type ProgrammaticNetwork = "medianet" | "adsterra";

export function programmaticNetwork(): ProgrammaticNetwork | null {
  if (process.env.NEXT_PUBLIC_MEDIANET_CID?.trim()) return "medianet";
  if (process.env.NEXT_PUBLIC_ADSTERRA_INVOKE_URL?.trim()) return "adsterra";
  return null;
}

export function preferProgrammaticOverAdsense(): boolean {
  if (process.env.NEXT_PUBLIC_PREFER_PROGRAMMATIC_ADS === "1") return true;
  // When AdSense slots are missing but an alt network exists, use it.
  return programmaticNetwork() !== null && !process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim();
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
