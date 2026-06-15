"use client";

import dynamic from "next/dynamic";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { FEATURES } from "@/components/svivva-artifact/feature-defs";
import { FeatureScrollToTop } from "@/components/feature-scroll-to-top";
import { FeatureSignInBanner } from "@/components/feature-sign-in-banner";

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
  const feature = FEATURES.find((f) => f.id === variant) ?? FEATURES[0];

  return (
    <div
      className={`relative bg-background overflow-x-hidden ${className}`}
      data-feature-page
    >
      <FeatureScrollToTop />
      <FeatureThreeBg variant={variant} dramatic scope="page" />
      <div className="relative z-10 px-4 sm:px-6 pb-6">
        <div className="pt-4 pb-2">
          <FeatureSignInBanner featureName={feature.name} accentColor={feature.accentColor} />
        </div>
        {showHero ? <FeaturePageHero variant={variant} subtitle={subtitle} /> : null}
        {children}
      </div>
    </div>
  );
}
