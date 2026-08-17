/**
 * ZZAI Security — unified home for Feed Shield, threat scanning, PQC proofs,
 * and the embedded security suite (formerly standalone Pyracrypt / Clutety).
 */
export {
  CLUTETY_TEAL as ZZAI_SECURITY_TEAL,
  CLUTETY_BURG as ZZAI_SECURITY_BURG,
  CLUTETY_EMBED_PATH as ZZAI_SECURITY_SUITE_EMBED,
  CLUTETY_LOGO_PATH as ZZAI_SECURITY_LOGO,
  getClutetyEmbedUrl as getZzaiSecuritySuiteEmbedUrl,
} from "@/lib/clutety/config";

export const ZZAI_SECURITY_NAME = "ZZAI Security";

export const ZZAI_SECURITY_TAGLINE =
  "Feed filtering, threat analysis, and post-quantum proofs — built into ZZAI.";

export const ZZAI_SECURITY_HUB_PATH = "/cyber-security-mini-apps";

export const ZZAI_SECURITY_CENTER_PATH = "/dashboard/security";

/** Public free tools funnel; logged-in suite at {@link ZZAI_SECURITY_CENTER_PATH}. */
export const ZZAI_SECURITY_FUNNEL = {
  publicHub: ZZAI_SECURITY_HUB_PATH,
  loggedInCenter: ZZAI_SECURITY_CENTER_PATH,
  aiToolsHub: "/ai-tools-hub",
} as const;
