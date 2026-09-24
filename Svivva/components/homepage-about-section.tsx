"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { CUBE_SUITE } from "@/lib/cube/mini-app-suite";
import { CubeSuiteMiniAppsGrid } from "@/components/cube-suite-mini-apps-grid";
import { CubeSuiteSharedBrainCallout } from "@/components/cube-suite-shared-brain-callout";

/** Brief suite overview below the nav cube on the homepage. */
export function HomepageAboutSection() {
  return (
    <section
      id="about"
      className="relative border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <div className="space-y-3">
          <Badge variant="secondary" className="px-4 py-1.5">
            {CUBE_SUITE.name}
          </Badge>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Not one messy app — a <span className="solid-accent">launcher suite</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            {BRAND.name} is organized like the cube: six focused mini apps you open when you need
            them. {CUBE_SUITE.unifiedValueHeadline}
          </p>
        </div>

        <CubeSuiteSharedBrainCallout className="mx-auto max-w-2xl text-left" />

        <CubeSuiteMiniAppsGrid />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup">
            <Button className="bg-[#5B8DA8] text-white">Start free</Button>
          </Link>
          <a href="#pricing">
            <Button variant="outline" className="border-[#5B8DA8]/40">
              See Suite Pass pricing
            </Button>
          </a>
          <a href="#oaas">
            <Button variant="outline">Open mixing console</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
