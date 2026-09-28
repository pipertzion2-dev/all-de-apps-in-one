import type { Metadata } from "next";
import { ProductBetaShell } from "@/components/product-beta-shell";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "ZZAI Play — Beta",
  description:
    "Full ZZAI Play studio (beta). The GA demo is Klean Sneaks at /clean-sneaks — production guardrails metaphor in game form.",
  path: "/play",
});

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <ProductBetaShell>{children}</ProductBetaShell>;
}
