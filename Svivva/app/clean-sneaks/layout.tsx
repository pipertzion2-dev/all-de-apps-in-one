import type { Metadata } from "next";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: `${KLEAN_SNEAKS.title} — ZZAI Play`,
  description:
    "Run the streets and keep your kicks clean. An endless runner from ZZAI Play featuring the Baloon8 car-sneaker.",
  path: "/clean-sneaks",
  imagePath: "/assets/clean-sneaks/baloon8-sneaker-thumbnail.png",
});

/** AdSense script loads sitewide from root layout when NEXT_PUBLIC_ADSENSE_CLIENT is set. */
export default function CleanSneaksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
