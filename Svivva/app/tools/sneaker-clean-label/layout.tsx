import type { Metadata } from "next";
import { featureMiniAppMetadata } from "@/lib/tools/feature-mini-apps";

export const metadata: Metadata = featureMiniAppMetadata("sneaker-clean-label");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
