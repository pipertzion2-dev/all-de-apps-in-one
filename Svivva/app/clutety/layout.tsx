import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Clutety",
  description:
    "Clutety has moved to Cyber Security Mini Apps on ZZAI — free security tools and parental controls.",
  path: "/cyber-security-mini-apps",
  noindex: true,
});

export default function ClutetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
