import type { Metadata } from "next";
import { ProductBetaShell } from "@/components/product-beta-shell";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Model agency signing desk — Beta",
  description: "Comp card to agency submission pack (beta) on ZZAI Show events.",
  path: "/events/model-agency",
});

export default function ModelAgencyLayout({ children }: { children: React.ReactNode }) {
  return <ProductBetaShell>{children}</ProductBetaShell>;
}
