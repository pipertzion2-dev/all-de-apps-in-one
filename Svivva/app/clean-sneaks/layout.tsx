import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Clean Sneaks — ZZAI Play",
  description:
    "Run the streets and keep your kicks clean. An endless runner from ZZAI Play featuring the Baloon8 car-sneaker.",
  path: "/clean-sneaks",
  imagePath: "/assets/clean-sneaks/baloon8-sneaker-thumbnail.png",
});

export default function CleanSneaksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
