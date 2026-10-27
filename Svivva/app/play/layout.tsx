import type { Metadata } from "next";
import { ProductBetaShell } from "@/components/product-beta-shell";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "ZZAI Play — The Moves Like & Studio",
  description:
    "Play hosts The Moves Like (front-camera god moves) and the ZZAI MIDI Studio. Klean Sneaks remains free at /clean-sneaks.",
  path: "/play",
});

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <ProductBetaShell>{children}</ProductBetaShell>;
}
