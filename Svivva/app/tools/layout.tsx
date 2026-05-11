import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Free tools for developers and creators — calculators, validators, and playgrounds. Most need no signup.",
  openGraph: {
    title: "Svivva tools",
    description:
      "Free tools for developers and creators — explore calculators, validators, and playgrounds on Svivva.",
    type: "website",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
