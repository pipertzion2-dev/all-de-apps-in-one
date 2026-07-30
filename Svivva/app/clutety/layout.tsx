import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutety",
  description:
    "Clutety — control what appears on your feeds. Original Replit UI with WireBar, embedded in ZZAI.",
  openGraph: {
    title: "Clutety — embedded in ZZAI",
    description:
      "Clutety brings the original cybersecurity UI to ZZAI — LED controls, WireBar, and threat analysis.",
    url: "https://zzaizzai.com/clutety",
    siteName: "ZZAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clutety — embedded in ZZAI",
    description: "Clutety — original protection UI embedded in ZZAI.",
  },
  alternates: {
    canonical: "https://zzaizzai.com/clutety",
  },
};

export default function ClutetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
