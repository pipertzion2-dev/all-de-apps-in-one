import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Marketing automation",
  description:
    "IndexNow, SEO landing pages, analytics, and social automation for your ZZAI workspace — grow traffic from one hub.",
  path: "/marketing",
});

export default function MarketingLandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
