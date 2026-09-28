import type { Metadata } from "next";
import { ProductBetaShell } from "@/components/product-beta-shell";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "ZZAI Play — Beta",
  description:
    "Full ZZAI Play studio (beta). GA demo: Klean Sneaks at /clean-sneaks — BALOON8 car×sneaker colorways and the Hybrid² + Klean metaphor.",
  path: "/play",
});

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <ProductBetaShell>{children}</ProductBetaShell>;
}
