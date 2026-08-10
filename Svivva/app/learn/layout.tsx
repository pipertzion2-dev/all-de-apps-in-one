import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "AP Science Lab · ZZAI",
    template: "%s · ZZAI Learn",
  },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
