import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ZZAI Security",
  description: "Encrypt and scan in your browser — ZZAI Security suite.",
  appleWebApp: {
    capable: true,
    title: "ZZAI Security",
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
