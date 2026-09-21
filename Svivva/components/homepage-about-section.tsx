"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
      className="relative border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <div className="space-y-3">
          <Badge variant="secondary" className="px-4 py-1.5">
            What is {BRAND.name}?
          </Badge>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {BRAND.name} — one workspace to <span className="solid-accent">ship AI products</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            {BRAND.shortDescription}
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
          <Link href="/dashboard">
            <Button variant="outline">Open dashboard</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
