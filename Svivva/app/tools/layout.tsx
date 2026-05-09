import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI & Developer Tools | Svivva",
  description:
    "Explore our collection of free AI-powered tools designed for developers, creators, and teams. No signup required.",
  openGraph: {
    title: "Free AI & Developer Tools | Svivva",
    description:
      "Explore our collection of free AI-powered tools designed for developers, creators, and teams. No signup required.",
    type: "website",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
