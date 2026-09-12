import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Badge",
  description:
    "Embeddable “Built with ZZAI” badges for your README or site — From seed to symphony.",
  path: "/badge",
  noindex: true,
});

export default function BadgeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
