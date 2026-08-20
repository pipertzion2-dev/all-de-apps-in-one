/** Share auth/OAuth cookies across www and apex (e.g. `.zzaizzai.com`). */
export function siteCookieDomain(): string | undefined {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!site || process.env.NODE_ENV !== "production") return undefined;
  try {
    const hostname = new URL(site.startsWith("http") ? site : `https://${site}`).hostname;
    if (hostname === "localhost" || hostname.endsWith(".vercel.app")) return undefined;
    return `.${hostname.replace(/^www\./, "")}`;
  } catch {
    return undefined;
  }
}
