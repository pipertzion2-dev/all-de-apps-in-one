import Link from "next/link";
import { FeatureBetaBadge } from "@/components/feature-beta-badge";
import { isBetaHref, PRODUCT_PROTECTION_PATH } from "@/lib/product-positioning";

const LINKS = [
  {
    href: PRODUCT_PROTECTION_PATH,
    title: "Poor Man Protection",
    description: "Seal uploads. Export a court pack.",
  },
  {
    href: "/dashboard/hybrid-lab",
    title: "Hybrid² Lab",
    description: "Fuse modules into one product.",
  },
  {
    href: "/seeds",
    title: "ZZAI Seeds",
    description: "Brief → deployable apps.",
  },
  {
    href: "/orbit",
    title: "Orbit",
    description: "Search and answer-engine growth.",
  },
  {
    href: "/tools",
    title: "Free tools",
    description: "AI and security mini-apps. No signup for basics.",
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
            Explore
          </p>
          <h2 id="homepage-explore-heading" className="text-2xl font-bold sm:text-3xl">
            Jump in
          </h2>
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
