"use client";

import dynamic from "next/dynamic";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { FeatureScrollToTop } from "@/components/feature-scroll-to-top";

const FeatureThreeBg = dynamic(
  () =>
    import("@/components/feature-three-background").then((m) => ({
      default: m.FeatureThreeBackground,
    })),
  { ssr: false },
);

const FeaturePageHero = dynamic(
  () => import("@/components/feature-page-hero").then((m) => m.FeaturePageHero),
  { ssr: false },
);

type Props = {
  variant: FeatureId;
  children: React.ReactNode;
  /** Show stats + scroll-band 3D hero (default true on feature routes). */
  showHero?: boolean;
  subtitle?: string;
  className?: string;
};

/** Standard wrapper: page-scoped WebGL bg + optional mesh hero + content. */
export function FeaturePageShell({
  variant,
  children,
  showHero = true,
  subtitle,
  className = "",
}: Props) {
  return (
    <div
      className={`relative min-h-0 bg-transparent overflow-x-hidden ${className}`}
      data-feature-page
      data-page-shell
    >
      <FeatureScrollToTop />
      <FeatureThreeBg variant={variant} dramatic scope="page" />
      <div
        className="relative z-10 px-4 sm:px-6 pb-0 [&_.border]:bg-card/40 [&_.border]:backdrop-blur-md [&_.border]:border-border/50"
        data-feature-content
      >
        {showHero ? <FeaturePageHero variant={variant} subtitle={subtitle} /> : null}
        {children}
      </div>
    </div>
  );
}
