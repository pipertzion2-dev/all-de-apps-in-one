import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { PRODUCT_ONE_LINER, PRODUCT_TAGLINE } from "@/lib/product-positioning";

export const metadata: Metadata = buildSeoMetadata({
  title: `Poor Man Protection — ${PRODUCT_TAGLINE}`,
  description: PRODUCT_ONE_LINER,
  path: "/poor-man-protection",
});

export default function PoorManProtectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
