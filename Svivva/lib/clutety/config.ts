/** Clutety branding + embed URL (Pyracrypt UI shell, feed-blocking product). */
export const CLUTETY_TEAL = "#5BA8A0";
export const CLUTETY_BURG = "#6B2C4A";

const DEFAULT_EMBED = "https://pyracrypt.replit.app";

function trimUrl(u: string): string {
  return u.trim().replace(/\/$/, "");
}

/** Live app iframe target (Replit / custom deploy). */
export function getClutetyEmbedUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_CLUTETY_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_PYRACRYPT_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_PYRACRYPT_MAIN_URL?.trim();
  if (env) return trimUrl(env);
  return DEFAULT_EMBED;
}

export const CLUTETY_LOGO_PATH = "/clutety-logo.png";
