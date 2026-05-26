import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutety",
  description: "Pyracrypt has moved to Clutety — embedded in Svivva at /clutety.",
  alternates: { canonical: "https://svivva.com/clutety" },
};

export default function PyracryptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
