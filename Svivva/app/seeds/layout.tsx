import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Seeds — Build & Deploy AI Products from Intent",
  description:
    "Turn ideas into shippable products with Seeds: specs, marketing copy, engineering docs, and deployment workflows from one ZZAI workspace.",
  path: "/seeds",
});

export default function SeedsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
