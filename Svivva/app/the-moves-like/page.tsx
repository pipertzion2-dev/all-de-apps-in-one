import type { Metadata } from "next";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageSchema, videoGameSchema } from "@/lib/seo/schema/builders";
import TheMovesLikeAppClient from "./app-client";

const FAQS = [
  {
    q: "What is THE MOVES LIKE?",
    a: "THE MOVES LIKE is ZZAI’s interactive social dance game — Motion DNA, Ghost Mode practice, Move Reactor choreography, Rhythm Portal, and Style Clash challenges in the browser.",
  },
  {
    q: "Do I need special hardware?",
    a: "A phone, tablet, or desktop browser works. Camera access unlocks Ghost Mode and Create recording. WebGL powers the 3D stages when available.",
  },
  {
    q: "Is Motion DNA measured from my body?",
    a: "Only when MediaPipe pose tracking is active. Otherwise sculptures are clearly labeled illustrative fingerprints from the movement library — never fabricated accuracy scores.",
  },
] as const;

export const metadata: Metadata = buildSeoMetadata({
  title: `${MOVES_LIKE.name} — interactive Three.js dance game`,
  description: MOVES_LIKE.tagline,
  path: MOVES_LIKE.path,
  imagePath: MOVES_LIKE.logoPath,
});

export default function TheMovesLikePage() {
  const faq = faqPageSchema([...FAQS]);

  return (
    <>
      <JsonLd
        data={[
          videoGameSchema({
            name: MOVES_LIKE.name,
            description: MOVES_LIKE.tagline,
            path: MOVES_LIKE.path,
            imagePath: MOVES_LIKE.logoPath,
          }),
          ...(faq ? [faq] : []),
        ]}
      />
      <TheMovesLikeAppClient />
      <article className="sr-only">
        <h1>{MOVES_LIKE.name}</h1>
        <p>{MOVES_LIKE.tagline}</p>
        <ul>
          {FAQS.map((f) => (
            <li key={f.q}>
              <h2>{f.q}</h2>
              <p>{f.a}</p>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
