import type { Metadata } from "next";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageSchema, videoGameSchema } from "@/lib/seo/schema/builders";
import CleanSneaksGameClient from "./game-client";

const GAME_FAQS = [
  {
    q: "What is Klean Sneaks?",
    a: "Klean Sneaks is a free browser endless runner from ZZAI Play on zzaizzai.com. Keep your kicks clean, chase the old man’s bundle, and unlock Steal Bundle casino mode.",
  },
  {
    q: "Is Klean Sneaks part of zzai zzai?",
    a: "Yes. It is the entertainment / Play face of the zzai zzai workspace — the same brand as the AI API builder, Seeds, Orbit SEO, and ZZAI Show events.",
  },
  {
    q: "Do I need an account to play?",
    a: "You can start the runner in the browser without a paid plan. Some shop and casino unlocks may require progress or a free zzai zzai account.",
  },
  {
    q: "Can I win a free year of ZZAI Pro?",
    a: "Yes. Solo wins in Steal Bundle casino have about a 5% chance to win 1 year of ZZAI Pro. Sign in to claim — the prize attaches to your account for 365 days.",
  },
] as const;

export const metadata: Metadata = buildSeoMetadata({
  title: `${KLEAN_SNEAKS.title} — free ZZAI Play endless runner game`,
  description:
    "Play Klean Sneaks (KLEAN SNEAKS) free in your browser — ZZAI Play endless runner on zzaizzai.com. Keep your kicks clean, steal the old man’s bundle, and unlock Steal Bundle casino mode.",
  path: "/clean-sneaks",
  imagePath: "/assets/clean-sneaks/baloon8-sneaker-thumbnail.png",
});

/** AdSense script loads sitewide from root layout when NEXT_PUBLIC_ADSENSE_CLIENT is set. */
export default function CleanSneaksPage() {
  const faq = faqPageSchema([...GAME_FAQS]);

  return (
    <>
      <JsonLd data={[videoGameSchema(), ...(faq ? [faq] : [])]} />
      {/* Crawlable product copy for indexing — game UI mounts above as a fixed shell. */}
      <article className="mx-auto max-w-3xl px-4 py-10 text-foreground">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5B8DA8]">
          ZZAI Play · Entertainment
        </p>
        <h1 className="mt-2 text-3xl font-bold">{KLEAN_SNEAKS.title} — free endless runner</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {KLEAN_SNEAKS.display} is the browser game from zzai zzai’s Play face: run the streets,
          keep your sneakers clean, and chase the old man’s bundle. Part of the same product
          workspace as the AI API builder, Seeds, Orbit SEO, and{" "}
          <a href="/events" className="text-[#5B8DA8] underline-offset-2 hover:underline">
            ZZAI Show events
          </a>
          .
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <a href="/" className="text-[#5B8DA8] hover:underline">
              zzai zzai home
            </a>
          </li>
          <li>
            <a href="/events" className="text-[#5B8DA8] hover:underline">
              ZZAI Show events
            </a>
          </li>
          <li>
            <a href="/tools" className="text-[#5B8DA8] hover:underline">
              Free tools directory
            </a>
          </li>
        </ul>
        <section className="mt-8 space-y-3" aria-labelledby="klean-faq">
          <h2 id="klean-faq" className="text-xl font-semibold">
            Klean Sneaks FAQ
          </h2>
          {GAME_FAQS.map((item) => (
            <details key={item.q} className="rounded-lg border border-border/50 p-3">
              <summary className="cursor-pointer text-sm font-medium">{item.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </section>
      </article>
      <CleanSneaksGameClient />
    </>
  );
}
