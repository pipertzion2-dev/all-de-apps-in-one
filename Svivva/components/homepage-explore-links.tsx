import Link from "next/link";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";
import { isBetaHref } from "@/lib/product-positioning";

const LINKS = [
  {
    href: "/dashboard/hybrid-lab",
    title: "Hybrid² Lab",
    description: "Fuse two ZZAI modules (H¹), then hybridize listed blends (H²) into one product.",
  },
  {
    href: "/lp/ai-api-builder",
    title: "Keep fusions Klean",
    description: "After Hybrid², guardrails enforce schema, preview hazards, and roll back fast.",
  },
  {
    href: "/clean-sneaks",
    title: "Klean Sneaks demo",
    description: "BALOON8 car×sneaker — one chassis, colorway unlocks, Sneak Vision hazards.",
  },
  {
    href: "/dashboard/pulse",
    title: "Pulse metrics",
    description: "Live latency, success rate, and spend across your guarded endpoints.",
  },
  {
    href: "/seeds",
    title: "ZZAI Seeds",
    description: "Turn a PDF or YouTube brief into deployable apps.",
  },
  {
    href: "/orbit",
    title: "Orbit SEO & AEO",
    description: "Growth and indexing autopilot for search and answer engines.",
  },
  {
    href: "/tools",
    title: "Free AI & security tools",
    description: "Crawlable mini-apps — beta funnel slices, no signup for basics.",
  },
] as const;

/** Internal-link hub so crawlers can reach product, events, and game surfaces. */
export function HomepageExploreLinks() {
  return (
    <section
      id="explore"
      className="relative border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
      aria-labelledby="homepage-explore-heading"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5B8DA8]">
            Explore
          </p>
          <h2 id="homepage-explore-heading" className="text-2xl font-bold sm:text-3xl">
            Hybrid², Klean guardrails &amp; beta modules
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Hybrid² Lab, guardrails, Pulse, and Klean Sneaks are GA; the full OaaS patch bay and
            other channels stay Beta.
          </p>
        </div>

        <ul className="grid gap-3 text-left sm:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block h-full rounded-xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-[#5B8DA8]/50"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {link.title}
                  {isBetaHref(link.href) ? <FeatureBetaBadge compact /> : null}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
