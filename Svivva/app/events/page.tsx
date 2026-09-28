import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { JsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  eventSeriesSchema,
  faqPageSchema,
  webPageSchema,
} from "@/lib/seo/schema/builders";

export const metadata: Metadata = buildSeoMetadata({
  title: "ZZAI Show events — live product drops & Play sessions",
  description:
    "ZZAI Show on zzaizzai.com: live and on-demand events for zzai zzai product drops, AI API demos, Orbit SEO launches, and Klean Sneaks Play sessions. Join the entertainment and community showcase.",
  path: "/events",
});

const EVENT_FAQS = [
  {
    q: "What is ZZAI Show?",
    a: "ZZAI Show is zzai zzai’s events and entertainment surface — live and on-demand sessions covering product drops, Play experiences like Klean Sneaks, and community showcases on zzaizzai.com.",
  },
  {
    q: "Where do events happen?",
    a: "Events are online on zzaizzai.com. This page is the public hub; signed-in creators can open the ZZAI Show console to run or invite to a session.",
  },
  {
    q: "How does ZZAI Show relate to the product?",
    a: "Show sessions highlight the same workspace Google should understand: prompt-to-API shipping, Seeds, Orbit SEO/AEO, Poor Man Protection, and ZZAI Play games.",
  },
  {
    q: "Is there a game or entertainment experience?",
    a: "Yes — Klean Sneaks on ZZAI Play is a free browser endless runner at /clean-sneaks, often featured in Show and Play sessions.",
  },
] as const;

export default function EventsPage() {
  const faq = faqPageSchema([...EVENT_FAQS]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={[
          webPageSchema({
            name: "ZZAI Show events",
            description:
              "Live and on-demand zzai zzai events — product drops, Play sessions, and community showcases.",
            path: "/events",
          }),
          eventSeriesSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
          ]),
          ...(faq ? [faq] : []),
        ]}
      />

      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandMark size="md" />
          <div className="flex items-center gap-3 text-sm">
            <Link href="/clean-sneaks" className="text-muted-foreground hover:text-foreground">
              Klean Sneaks
            </Link>
            <Link
              href="/dashboard/zzai-show"
              className="rounded-md bg-[#5B8DA8] px-3 py-1.5 font-medium text-white"
            >
              Open Show console
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5B8DA8]">
          Events · Entertainment
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
          ZZAI Show events on zzaizzai.com
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Live and on-demand sessions for the zzai zzai product workspace — AI API builder demos,
          Seeds launches, Orbit SEO drops, and ZZAI Play entertainment including{" "}
          <Link href="/clean-sneaks" className="text-[#5B8DA8] underline-offset-2 hover:underline">
            Klean Sneaks
          </Link>
          .
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/zzai-show"
            className="rounded-md bg-[#5B8DA8] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Join or host a show
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold"
          >
            Start free on ZZAI
          </Link>
          <Link
            href="/lp/ai-api-builder"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold"
          >
            AI API builder
          </Link>
        </div>

        <section className="mt-16 space-y-6" aria-labelledby="what-youll-see">
          <h2 id="what-youll-see" className="text-2xl font-bold">
            What you’ll see at ZZAI Show
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Product drops",
                body: "Walkthroughs of prompt-to-API shipping, schema validation, evaluations, and rollback.",
              },
              {
                title: "Orbit SEO & AEO",
                body: "Indexing, sitemap, and answer-engine workflows that help zzaizzai.com get discovered.",
              },
              {
                title: "Play & entertainment",
                body: "Klean Sneaks sessions and sonic branding from ZZAI Play — the game side of the cube.",
              },
              {
                title: "Community showcase",
                body: "Builders sharing Seeds apps, hybrid builds, and Poor Man Protection workflows.",
              },
            ].map((item) => (
              <li key={item.title} className="rounded-xl border border-border/50 bg-card/60 p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 space-y-4" aria-labelledby="events-explore">
          <h2 id="events-explore" className="text-2xl font-bold">
            Explore related zzai zzai surfaces
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="text-[#5B8DA8] hover:underline">
                zzai zzai home
              </Link>{" "}
              — cube navigator, mixing console, pricing, FAQ
            </li>
            <li>
              <Link href="/orbit" className="text-[#5B8DA8] hover:underline">
                Orbit
              </Link>{" "}
              — SEO / AEO growth autopilot
            </li>
            <li>
              <Link href="/seeds" className="text-[#5B8DA8] hover:underline">
                ZZAI Seeds
              </Link>{" "}
              — document or YouTube → apps
            </li>
            <li>
              <Link href="/clean-sneaks" className="text-[#5B8DA8] hover:underline">
                Klean Sneaks
              </Link>{" "}
              — free browser endless runner
            </li>
            <li>
              <Link href="/blog" className="text-[#5B8DA8] hover:underline">
                Blog
              </Link>{" "}
              — guides on APIs, AI, and shipping with ZZAI
            </li>
          </ul>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="events-faq">
          <h2 id="events-faq" className="text-2xl font-bold">
            Events FAQ
          </h2>
          <div className="space-y-3">
            {EVENT_FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border/50 bg-card/60 open:bg-card"
              >
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="border-t border-border/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
