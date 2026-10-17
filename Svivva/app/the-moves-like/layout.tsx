import type { ReactNode } from "react";
import type { Viewport } from "next";

/** Phone-first safe areas for Train capture + Studio timeline. */
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
