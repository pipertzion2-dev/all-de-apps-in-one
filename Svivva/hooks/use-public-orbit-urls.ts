"use client";

import { useEffect, useState } from "react";
import {
  getPublicSiteHostname,
  getPublicSiteUrl,
  getPublicSitemapUrl,
} from "@/lib/site-url-public";

export type PublicOrbitUrlPack = {
  site: string;
  host: string;
  sitemap: string;
};

/**
 * After mount, uses `window.location` so Orbit copy matches how you opened the app
 * (e.g. http://192.168.x.x:5000 on your phone). SSR/first paint uses NEXT_PUBLIC_SITE_URL.
 */
export function usePublicOrbitUrls(): PublicOrbitUrlPack {
  const [pack, setPack] = useState<PublicOrbitUrlPack>(() => ({
    site: getPublicSiteUrl(),
    host: getPublicSiteHostname(),
    sitemap: getPublicSitemapUrl(),
  }));

  useEffect(() => {
    const origin = window.location.origin;
    setPack({
      site: origin,
      host: window.location.hostname,
      sitemap: `${origin}/sitemap.xml`,
    });
  }, []);

  return pack;
}
