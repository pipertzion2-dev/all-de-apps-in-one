import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutety",
  description:
    "Clutety blocks unwanted feed content on YouTube and more — embedded in Svivva with the Pyracrypt-grade protection UI.",
  openGraph: {
    title: "Clutety — embedded in Svivva",
    description:
      "Feed filtering and protection, embedded in the Svivva platform. Same polished UI, built for your feeds.",
    url: "https://svivva.com/clutety",
    siteName: "Svivva",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clutety — embedded in Svivva",
    description: "Block unwanted feed content — embedded in Svivva.",
  },
  alternates: {
    canonical: "https://svivva.com/clutety",
  },
};

export default function ClutetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
