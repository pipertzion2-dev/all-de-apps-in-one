import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Center",
  description: "Feed Shield and threat analysis for your Svivva workspace.",
  robots: { index: false, follow: false },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
