import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Clutety App",
  description: "Clutety — feed shield and security scanner, embedded in Svivva.",
  appleWebApp: {
    capable: true,
    title: "Clutety",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#080c14",
};

export default function ClutetyAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
