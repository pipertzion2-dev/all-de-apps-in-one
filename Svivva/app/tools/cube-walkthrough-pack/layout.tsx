import type { Metadata } from "next";
import { featureMiniAppMetadata } from "@/lib/tools/feature-mini-apps";

export const metadata: Metadata = featureMiniAppMetadata("cube-walkthrough-pack");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
