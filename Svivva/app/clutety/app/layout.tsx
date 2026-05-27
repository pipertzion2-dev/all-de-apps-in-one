import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Clutety App",
  description: "Pyracrypt Lock UI — encrypt and scan in your browser, on Svivva.",
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
  themeColor: "#EEF2F8",
};

export default function ClutetyAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
