/** Clutety / Pyracrypt branding tokens (Svivva-hosted). */
export const CLUTETY_TEAL = "#5BA8A0";
export const CLUTETY_BURG = "#6B2C4A";

export const CLUTETY_LOGO_PATH = "/clutety-logo.png";

/** Internal landing while Clutety iOS / standalone app is not live yet. */
export const CLUTETY_COMING_SOON_PATH = "/clutety-coming-soon";

/** Corner ad + promo links (defaults to coming soon, not a dead external host). */
export function getClutetyPromoHref(): string {
  const env =
    process.env.NEXT_PUBLIC_CLUTETY_EXTERNAL_URL?.trim() ||
    process.env.NEXT_PUBLIC_CLUTETY_MAIN_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return CLUTETY_COMING_SOON_PATH;
}

/** Same-origin embed path for the original Pyracrypt UI bundle. */
export const CLUTETY_EMBED_PATH = "/clutety-shell/index.html?skip";

/** Optional external Vite build; otherwise use {@link CLUTETY_EMBED_PATH}. */
export function getClutetyEmbedUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_CLUTETY_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_PYRACRYPT_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return CLUTETY_EMBED_PATH;
}
