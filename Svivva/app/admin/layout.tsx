import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner access",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminAccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
