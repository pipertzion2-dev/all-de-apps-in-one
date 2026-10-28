import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { PRODUCT_TAGLINE } from "@/lib/product-positioning";

export const metadata: Metadata = buildSeoMetadata({
  title: `Invention Protection Studio — Poor Man Protection · ${PRODUCT_TAGLINE}`,
  description:
    "Document inventions, hash evidence, explore 3D models, and prepare disclosure packs inside ZZAI Poor Man Protection. Not a USPTO filing.",
  path: "/poor-man-protection/invention-studio",
});

export default function InventionStudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
