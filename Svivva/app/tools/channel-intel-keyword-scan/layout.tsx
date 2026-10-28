import type { Metadata } from "next";
import { featureMiniAppMetadata } from "@/lib/tools/feature-mini-apps";

export const metadata: Metadata = featureMiniAppMetadata("channel-intel-keyword-scan");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
