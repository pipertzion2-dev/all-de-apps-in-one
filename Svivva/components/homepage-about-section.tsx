"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HOMEPAGE_APPLICATIONS_SUBLINE,
  HOMEPAGE_APPLICATIONS_TITLE,
  HOMEPAGE_SCROLL_TO_PROTECTION,
  PRODUCT_PROTECTION_PATH,
} from "@/lib/product-positioning";
import { Layers, Orbit, Shield, Sprout } from "lucide-react";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: "Poor Man Protection",
    description: "Hash uploads and export a court pack.",
    href: PRODUCT_PROTECTION_PATH,
    beta: false,
  },
  {
    icon: Sprout,
    title: "ZZAI Seeds",
    description: "PDF or YouTube brief → deployable apps.",
    href: "/seeds",
    beta: true,
  },
  {
    icon: Orbit,
    title: "Orbit",
    description: "Search and answer-engine growth.",
    href: "/orbit",
    beta: true,
  },
  {
    icon: Layers,
    title: "Hybrid² Lab",
    description: "Fuse modules into one product.",
    href: "/dashboard/hybrid-lab",
    beta: true,
  },
] as const;

/** Brief product overview — Poor Man Protection first; desk beta apps second. */
export function HomepageAboutSection() {
  return (
    <section
      id="about"
      className="relative snap-start scroll-mt-3 border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D91B3]">
            Applications
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {HOMEPAGE_APPLICATIONS_TITLE}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            {HOMEPAGE_APPLICATIONS_SUBLINE}
          </p>
        </div>

        <ul className="grid gap-3 text-left sm:grid-cols-2">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="block h-full rounded-xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-[#6D91B3]/50"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#6D91B3]" aria-hidden />
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {item.title}
                      {item.beta ? <FeatureBetaBadge compact /> : null}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild className="bg-[#5B8DA8] text-white hover:bg-[#4a7a94]">
            <Link href={PRODUCT_PROTECTION_PATH}>{HOMEPAGE_SCROLL_TO_PROTECTION}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
