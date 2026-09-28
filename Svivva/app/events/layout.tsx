import type { Metadata } from "next";
import { ProductBetaShell } from "@/components/product-beta-shell";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "ZZAI Show events — Beta",
  description: "Live and on-demand events (beta). Core product: production guardrails for AI APIs.",
  path: "/events",
});

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <ProductBetaShell>{children}</ProductBetaShell>;
}
