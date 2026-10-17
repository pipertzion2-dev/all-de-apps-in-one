import type { ReactNode } from "react";
import type { Viewport } from "next";

/** Phone-first: fill the notch / home-indicator safe areas for selfie camera UI. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F7FBFC",
};

export default function TheMovesLikeLayout({ children }: { children: ReactNode }) {
  return children;
}
