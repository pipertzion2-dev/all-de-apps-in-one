import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Clutter",
  description: "This legacy path redirects to Cyber Security Mini Apps on ZZAI.",
  path: "/cyber-security-mini-apps",
  noindex: true,
});

export default function ClutterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
