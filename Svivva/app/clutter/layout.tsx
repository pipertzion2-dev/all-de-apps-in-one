import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutety",
  description: "Redirects to Clutety on Svivva.",
  alternates: { canonical: "https://zzaizzai.com/clutety" },
};

export default function ClutterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
