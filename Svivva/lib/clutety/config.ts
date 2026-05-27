/** Clutety / Pyracrypt branding tokens (Svivva-hosted). */
export const CLUTETY_TEAL = "#5BA8A0";
export const CLUTETY_BURG = "#6B2C4A";

export const CLUTETY_LOGO_PATH = "/clutety-logo.png";

/** Same-origin embed: original Lock UI only (no tab shell). */
export const CLUTETY_EMBED_PATH = "/clutety/embed";

/** Optional external Vite build; otherwise use {@link CLUTETY_EMBED_PATH}. */
export function getClutetyEmbedUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_CLUTETY_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_PYRACRYPT_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return CLUTETY_EMBED_PATH;
}
