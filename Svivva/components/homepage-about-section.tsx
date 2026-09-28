"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { PRODUCT_MAIN_GOAL, PRODUCT_ONE_LINER, PRODUCT_TAGLINE } from "@/lib/product-positioning";
import { BarChart3, Eye, GitBranch, Shield } from "lucide-react";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";

const HIGHLIGHTS = [
  {
    icon: Eye,
    title: "Hazard preview",
    description:
      "See where deploys will fail before traffic hits — like Sneak Vision in Klean Sneaks.",
  },
  {
    icon: Shield,
    title: "Live schema enforcement",
    description: "Every response validated and repaired — bad shapes never reach users.",
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
          <h1 className="text-2xl font-bold sm:text-3xl">{PRODUCT_TAGLINE}</h1>
          <p className="mx-auto max-w-2xl text-base font-medium text-foreground/90 sm:text-lg">
            {PRODUCT_MAIN_GOAL}
          </p>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">{PRODUCT_ONE_LINER}</p>
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
          <Link href="/dashboard/api-builder">
            <Button variant="outline">API Builder</Button>
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
