import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Tools",
  description:
    "Free tools for developers and creators — calculators, validators, and playgrounds. Most need no signup.",
  path: "/tools",
});

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
