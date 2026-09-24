import {
  findMatchedGscSite,
  getGoogleOAuthAccessTokenForUser,
  listGscSites,
  listGscSitemaps,
} from "@/lib/google-gsc-oauth";
import { getGscConnectionStatus } from "@/lib/orbit/gsc-connection-status";
import { getSiteUrl, getSitemapUrl } from "@/lib/site-url";

/** True when the main sitemap URL is registered on the matched GSC property (OAuth). */
export async function isMainGscSitemapRegistered(): Promise<boolean> {
  const gsc = await getGscConnectionStatus();
  if (!gsc.oauthConnected || !gsc.siteUrl) return false;

  const accessToken = await getGoogleOAuthAccessTokenForUser(gsc.userId);
  if (!accessToken) return false;

  const sites = await listGscSites(accessToken);
  const matched = findMatchedGscSite(sites, getSiteUrl());
  if (!matched) return false;

  const sitemaps = await listGscSitemaps(accessToken, matched.siteUrl);
  const mainPath = getSitemapUrl();
  return sitemaps.some((s) => s.path === mainPath || s.path.endsWith("/sitemap.xml"));
}
