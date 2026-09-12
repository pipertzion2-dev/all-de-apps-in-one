import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Pyracrypt",
  description: "Pyracrypt has moved to Cyber Security Mini Apps on ZZAI.",
  path: "/cyber-security-mini-apps",
  noindex: true,
});

export default function PyracryptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
