"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { BED_STUY_VYBES } from "@/lib/brand/bed-stuy-vybes";
import {
  PRODUCT_HOOK_SHORT,
  PRODUCT_MAIN_GOAL,
  PRODUCT_ONE_LINER,
  PRODUCT_PROTECTION_PITCH,
  PRODUCT_TAGLINE,
} from "@/lib/product-positioning";
import { HomepageMainGoal } from "@/components/homepage-main-goal";
import { BarChart3, Eye, GitBranch, GitMerge, Shield } from "lucide-react";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: "Court-ready evidence",
    description:
      "Poor Man Protection seals sketches and ideas with hashes, custody logs, and coin metadata you can verify.",
  },
  {
    icon: GitMerge,
    title: `${BED_STUY_VYBES.name}`,
    description: `Fashion collaboration at ${BED_STUY_VYBES.fullAddress} — protect storefront ideas before they leak.`,
  },
  {
    icon: Eye,
    title: "Protect your sneakers",
    description:
      "Klean Sneaks demo — keep BALOON8 colorways Klean on the walk; same metaphor for real assets.",
  },
  {
    icon: Shield,
    title: "Blockchain & coin",
    description: "Mint-ready protection coin ties your file to a timestamped chain record.",
  },
  {
    icon: GitBranch,
    title: "One-click rollback",
    description: "When quality scuffs, revert to the last good prompt version instantly.",
  },
  {
    icon: BarChart3,
    title: "Pulse metrics",
    description: "Latency, success rate, and token spend — alerts before support tickets.",
  },
] as const;

/** Brief product overview below the nav cube on the homepage. */
export function HomepageAboutSection() {
  return (
    <section
      id="about"
      className="relative border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <div className="space-y-3">
          <Badge variant="secondary" className="px-4 py-1.5">
            What {BRAND.name} is for
          </Badge>
          <div className="hidden sm:block">
            <HomepageMainGoal density="full" />
          </div>
          <div className="sm:hidden">
            <HomepageMainGoal density="compact" />
          </div>
          <p className="mx-auto hidden max-w-2xl text-sm text-muted-foreground md:block">
            {PRODUCT_PROTECTION_PITCH} {PRODUCT_ONE_LINER}
          </p>
          <p className="mx-auto max-w-2xl text-xs text-muted-foreground sm:hidden">
            {PRODUCT_HOOK_SHORT}
          </p>
          <p className="mx-auto hidden max-w-2xl text-sm text-muted-foreground sm:block md:hidden">
            {PRODUCT_MAIN_GOAL}
          </p>
        </div>

        <div className="grid gap-4 text-left sm:grid-cols-2">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#5B8DA8]" aria-hidden />
                <h3 className="text-sm font-semibold">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup">
            <Button className="bg-[#5B8DA8] text-white">Start free</Button>
          </Link>
          <Link href="/dashboard/hybrid-lab">
            <Button variant="outline">Hybrid² Lab</Button>
          </Link>
          <Link href="/dashboard/poor-man-protection">
            <Button variant="outline">Seal an idea</Button>
          </Link>
          <Link href="/clean-sneaks">
            <Button variant="outline">Play Klean Sneaks</Button>
          </Link>
          <Link href="/seeds" className="inline-flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              ZZAI Seeds <FeatureBetaBadge compact />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
