import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutety",
  description:
    "Pyracrypt-grade file protection in your browser — encrypt, scan, and shield locally. Embedded in Svivva.",
  openGraph: {
    title: "Clutety — Pyracrypt on Svivva",
    description:
      "Encrypt, scan, and shield files in your browser. The original Pyracrypt Lock UI, hosted on Svivva.",
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
