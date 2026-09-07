import type { Metadata } from "next";

/** Child routes set their own canonical URLs — do not set alternates here or /tools/* inherits /tools. */
export const metadata: Metadata = {
  title: {
    template: "%s | ZZAI Tools",
    default: "Tools | ZZAI",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
