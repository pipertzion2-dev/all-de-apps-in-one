"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import {
  HOMEPAGE_APPLICATIONS_SUBLINE,
  HOMEPAGE_APPLICATIONS_TITLE,
  PRODUCT_NAME_LINE,
} from "@/lib/product-positioning";
import { Camera, Clapperboard, Music2, Shield } from "lucide-react";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";

const HIGHLIGHTS = [
  {
    icon: Music2,
    title: "The Moves Like",
    description:
      "Interactive dance workstation — Discover, Learn, Create, Studio, Play, and Style Clash.",
    href: "/the-moves-like",
    beta: false,
  },
  {
    icon: Camera,
    title: "Front-camera practice",
    description: "Ghost Mode mirrors your selfie camera so you can learn against a reference take.",
    href: "/the-moves-like",
    beta: false,
  },
  {
    icon: Clapperboard,
    title: "Create & Studio",
    description: "Record takes, assemble routines, and keep the glass UI tuned for phones.",
    href: "/the-moves-like",
    beta: false,
  },
  {
    icon: Shield,
    title: "Poor Man Protection",
    description:
      "Still on the desk — seal uploads with hashes and export a court pack when priority matters.",
    href: "/dashboard/poor-man-protection",
    beta: false,
  },
] as const;

/** Brief product overview below The Moves Like hero. */
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
          <Badge variant="secondary" className="px-4 py-1.5">
            {PRODUCT_NAME_LINE} on {BRAND.name}
          </Badge>
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
          <Button asChild className="bg-[#AC81AF] text-white hover:bg-[#9a6f9d]">
            <Link href="/the-moves-like">Open The Moves Like</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clean-sneaks">Klean Sneaks demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
