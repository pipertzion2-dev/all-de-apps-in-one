import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Clean Sneaks — ZZAI Play",
  description:
    "Run the streets and keep your kicks clean. An endless runner from ZZAI Play featuring the Baloon8 car-shoe.",
  path: "/clean-sneaks",
});

export default function CleanSneaksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
