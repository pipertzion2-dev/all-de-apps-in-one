import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Seeds — From PDF or YouTube to Apps",
  description:
    "ZZAI Seeds turns PDFs, YouTube transcripts, and plain-language briefs into deployable apps with guardrails — describe, ship, and grow.",
  path: "/seeds",
});

export default function SeedsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
