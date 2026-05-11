import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Badge",
  description:
    "Embeddable “Built with Svivva” badges for your README or site — From seed to symphony.",
};

export default function BadgeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
