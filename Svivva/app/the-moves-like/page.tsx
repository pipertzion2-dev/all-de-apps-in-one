import type { Metadata } from "next";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageSchema, softwareApplicationSchema } from "@/lib/seo/schema/builders";
import TheMovesLikeAppClient from "./app-client";

const FAQS = [
  {
    q: "What is THE MOVES LIKE?",
    a: "THE MOVES LIKE is a dance creation workspace for breakers and freestyle dancers — capture moves, build a personal library, assemble routines in Studio, and join Cypher challenges.",
  },
  {
    q: "Does it work offline in the browser?",
    a: "The MVP stores movement metadata locally and can keep video blobs in IndexedDB on your device. Cloud auth, shared Cypher, and production video hosting come next.",
  },
  {
    q: "Is AI analyzing my technique?",
    a: "Not yet. Pose estimation and movement comparison are architected for later — this MVP focuses on real capture, library, and choreography workflows without fabricated AI scores.",
  },
] as const;

export const metadata: Metadata = buildSeoMetadata({
  title: `${MOVES_LIKE.name} — dance creation workstation`,
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
          softwareApplicationSchema({
            name: MOVES_LIKE.name,
            description: MOVES_LIKE.tagline,
            path: MOVES_LIKE.path,
            category: "MultimediaApplication",
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
