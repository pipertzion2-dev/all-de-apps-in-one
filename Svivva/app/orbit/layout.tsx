import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Orbit — SEO & Growth Automation",
  description:
    "Automate Search Console, IndexNow, keyword research, content seeding, and traffic growth for your ZZAI workspace — one growth command center.",
  path: "/orbit",
});

export default function OrbitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
