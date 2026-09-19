import type { Metadata } from "next";
import Script from "next/script";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { adsenseClientId } from "@/lib/clean-sneaks/ads/config";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: `${KLEAN_SNEAKS.title} — ZZAI Play`,
  description:
    "Run the streets and keep your kicks clean. An endless runner from ZZAI Play featuring the Baloon8 car-sneaker.",
  path: "/clean-sneaks",
  imagePath: "/assets/clean-sneaks/baloon8-sneaker-thumbnail.png",
});

export default function CleanSneaksLayout({ children }: { children: React.ReactNode }) {
  const adsense = adsenseClientId();

  return (
    <>
      {adsense ? (
        <Script
          id="adsense-clean-sneaks"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      ) : null}
      {children}
    </>
  );
}
