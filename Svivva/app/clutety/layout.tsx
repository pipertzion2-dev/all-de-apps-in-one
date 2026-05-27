import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutety",
  description:
    "Clutety embeds the original Pyracrypt protection app in Svivva — encrypt, scan, and shield locally.",
  openGraph: {
    title: "Clutety — embedded in Svivva",
    description:
      "The original Pyracrypt UI, hosted on Svivva. Encrypt, scan, and shield files in your browser.",
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
