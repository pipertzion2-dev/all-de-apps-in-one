"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { BarChart3, GitBranch, Shield, Zap } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: "Schema validation & repair",
    description: "Catch hallucinated fields before they reach production.",
  },
  {
    icon: GitBranch,
    title: "Versioning & rollback",
    description: "Every prompt edit is immutable — roll back in one click.",
  },
  {
    icon: BarChart3,
    title: "Live metrics & alerts",
    description: "Latency, success rates, and spend — before users complain.",
  },
  {
    icon: Zap,
    title: "Prompt to API in minutes",
    description: "Describe it, deploy it, scale it — no YAML required.",
  },
] as const;

/** Brief product overview below the nav cube on the homepage. */
export function HomepageAboutSection() {
  return (
    <section
      id="about"
      className="relative border-t border-border/30 bg-gradient-to-b from-background via-background to-background/95 px-4 py-14 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-3xl space-y-10 text-center">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold lowercase tracking-[0.14em] sm:text-5xl">
            {BRAND.name}
          </h2>
          <p className="text-lg font-medium tracking-tight text-foreground/90 sm:text-xl">
            One workspace to <span className="solid-accent">ship AI products</span>
          </p>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {BRAND.shortDescription}
          </p>
        </div>

        <ul className="grid gap-x-8 gap-y-7 text-left sm:grid-cols-2">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="space-y-2 border-t border-border/40 pt-5">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-[#5B8DA8]" aria-hidden />
                <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/signup">
            <Button className="bg-[#5B8DA8] text-white">Start free</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Open dashboard</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
