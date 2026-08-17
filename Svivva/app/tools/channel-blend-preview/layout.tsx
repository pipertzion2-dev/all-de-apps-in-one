import type { Metadata } from "next";
import { featureMiniAppLayoutMeta } from "@/lib/tools/feature-mini-apps";

const meta = featureMiniAppLayoutMeta("channel-blend-preview");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords,
  alternates: { canonical: meta.canonical },
  robots: { index: true, follow: true },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: meta.canonical,
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
