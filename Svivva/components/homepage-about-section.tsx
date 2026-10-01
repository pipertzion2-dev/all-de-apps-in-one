"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import {
  PRODUCT_HOOK_SHORT,
  PRODUCT_MAIN_GOAL,
  PRODUCT_PROTECTION_PITCH,
  PRODUCT_TAGLINE,
} from "@/lib/product-positioning";
import { HomepageMainGoal } from "@/components/homepage-main-goal";
import { FileCheck, Scale, Shield, Stamp } from "lucide-react";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: "Poor Man Protection",
    description:
      "Seal uploads with hashes and timestamps. Download a structured court pack — supporting evidence, not a government filing.",
  },
  {
    icon: FileCheck,
    title: "Public verify",
    description: "Anyone can check a seal at /protect/verify without signing in.",
  },
  {
    icon: Scale,
    title: "Anteriority record",
    description:
      "Custody logs and dual-axis metadata document possession and creation order when disputes arise.",
  },
  {
    icon: Stamp,
    title: "Free Sneaks demo",
    description:
      "Klean Sneaks illustrates the same “protect what you made” idea in a game — optional, not the core product.",
  },
] as const;

/** Brief product overview below the nav cube on the homepage. */
export function HomepageAboutSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-3 border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
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
            {PRODUCT_PROTECTION_PITCH}
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
          <Link href="/dashboard/poor-man-protection">
            <Button className="bg-[#5B8DA8] text-white">Poor Man Protection</Button>
          </Link>
          <Link href="/protect/verify">
            <Button variant="outline">Verify evidence</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">Create account</Button>
          </Link>
          <Link href="/clean-sneaks">
            <Button variant="ghost" className="text-muted-foreground">
              Klean Sneaks demo
            </Button>
          </Link>
          <Link href="/dashboard/hybrid-lab" className="inline-flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              Hybrid² Lab <FeatureBetaBadge compact />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
