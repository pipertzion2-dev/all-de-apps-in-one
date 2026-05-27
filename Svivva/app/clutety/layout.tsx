import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutety",
  description:
    "Clutety — detect threats before they strike. Original Replit UI with WireBar, embedded in Svivva.",
  openGraph: {
    title: "Clutety — embedded in Svivva",
    description:
      "Clutety brings the original cybersecurity UI to Svivva — LED controls, WireBar, and threat analysis.",
    url: "https://svivva.com/clutety",
    siteName: "Svivva",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clutety — embedded in Svivva",
    description: "Clutety — original protection UI embedded in Svivva.",
  },
  alternates: {
    canonical: "https://svivva.com/clutety",
  },
};

export default function ClutetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
