/** Clutety branding — app UI is embedded natively in Svivva (not an external iframe). */
export const CLUTETY_TEAL = "#5BA8A0";
export const CLUTETY_BURG = "#6B2C4A";

export const CLUTETY_LOGO_PATH = "/clutety-logo.png";

/** Legacy: optional external URL if you host the Vite app elsewhere. */
export function getClutetyEmbedUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_CLUTETY_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_PYRACRYPT_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return "/clutety#app";
}
