import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Orbit — SEO & Growth Autopilot",
  description:
    "Orbit on ZZAI automates indexing, sitemap health, content generation, and growth workflows — from seed to symphony for organic traffic.",
  path: "/orbit",
});

export default function OrbitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
