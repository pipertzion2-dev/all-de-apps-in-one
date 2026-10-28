import Link from "next/link";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";
import { isBetaHref, PRODUCT_PROTECTION_PATH } from "@/lib/product-positioning";

const LINKS = [
  {
    href: PRODUCT_PROTECTION_PATH,
    title: "Poor Man Protection",
    description: "Main focus — seal uploads with hashes and timestamps; court-ready packs.",
  },
  {
    href: "/dashboard/hybrid-lab",
    title: "Hybrid² Lab",
    description: "Fuse two ZZAI modules (H¹), then hybridize listed blends (H²) into one product.",
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D91B3]">
            Also on zzai zzai
          </p>
          <h2 id="homepage-explore-heading" className="text-2xl font-bold sm:text-3xl">
            Poor Man Protection &amp; the desk
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Poor Man Protection is the center of the site. The cube holds beta apps.
          </p>
        </div>

        <ul className="grid gap-3 text-left sm:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block h-full rounded-xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-[#6D91B3]/50"
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
