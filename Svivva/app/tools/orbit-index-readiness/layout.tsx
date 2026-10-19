import type { Metadata } from "next";
import { featureMiniAppMetadata } from "@/lib/tools/feature-mini-apps";

export const metadata: Metadata = featureMiniAppMetadata("orbit-index-readiness");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
