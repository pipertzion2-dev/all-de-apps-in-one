import Link from "next/link";

const LINKS = [
  {
    href: "/lp/ai-api-builder",
    title: "AI API builder",
    description: "Prompt to production endpoint with schema validation and rollback.",
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
    href: "/events",
    title: "ZZAI Show events",
    description: "Live and on-demand product drops, Play sessions, and showcases.",
  },
  {
    href: "/clean-sneaks",
    title: "Klean Sneaks game",
    description: "ZZAI Play endless runner — keep your kicks clean on the web.",
  },
  {
    href: "/tools",
    title: "Free AI & security tools",
    description: "Crawlable mini-apps and utilities — no signup required for basics.",
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
            Product, events, and Play on zzaizzai.com
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Indexable paths for the AI product workspace, ZZAI Show, and the Klean Sneaks
            entertainment experience.
          </p>
        </div>

        <ul className="grid gap-3 text-left sm:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block h-full rounded-xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-[#5B8DA8]/50"
              >
                <h3 className="text-sm font-semibold text-foreground">{link.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
