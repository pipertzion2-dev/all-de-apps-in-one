import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutter",
  description:
    "Clutter is the Svivva-integrated mobile shell powered by Pyracrypt-grade privacy patterns — secure by default, embedded in the Svivva platform.",
  openGraph: {
    title: "Clutter — embedded in Svivva",
    description:
      "A Svivva-integrated experience using Pyracrypt-grade privacy patterns. Embedded in the Svivva platform.",
    url: "https://svivva.com/clutter",
    siteName: "Svivva",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clutter — embedded in Svivva",
    description:
      "A Svivva-integrated experience using Pyracrypt-grade privacy patterns. Embedded in the Svivva platform.",
  },
  alternates: {
    canonical: "https://svivva.com/clutter",
  },
};

export default function ClutterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
