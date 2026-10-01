import { getSiteUrl } from "@/lib/site-url";
import type { IfmPairing } from "./ifm-types";

export type IfmBridgePageDraft = {
  slug: string;
  keyword: string;
  title: string;
  headline: string;
  subheadline: string;
  content: string;
  howItWorks: string;
  whoItsFor: string;
  benefits: string[];
  relatedSlugs: string[];
  metaTitle: string;
  metaDescription: string;
  category: string;
  toolUrl: string;
};

function siteBase(): string {
  return getSiteUrl().replace(/\/$/, "");
}

function faqJsonLd(faq: IfmPairing["faq"]): string {
  const entities = faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entities,
  });
}

/** Build indexable bridge page content for an IFM pairing. */
export function buildIfmBridgePageDraft(pairing: IfmPairing): IfmBridgePageDraft {
  const slug = pairing.slug.replace(/^ifm-/, "ifm/").replace(/\/+/g, "/");
  const cleanSlug = slug.startsWith("ifm/") ? slug : `ifm/${pairing.slug}`;
  const keyword = `${pairing.toolA.name} ${pairing.toolB.name}`.toLowerCase();
  const title = pairing.fusionTitle;
  const base = siteBase();

  const content = `<h1>${title}</h1>
<p>${pairing.bridgePrinciple}</p>

<h2>Fused utilities</h2>
<ul>
  <li><a href="${pairing.toolA.url}">${pairing.toolA.name}</a> — ${pairing.toolA.description}</li>
  <li><a href="${pairing.toolB.url}">${pairing.toolB.name}</a> — ${pairing.toolB.description}</li>
</ul>

<h2>Micro-tool concept</h2>
<p>${pairing.microToolIdea}</p>

<h2>FAQ</h2>
${pairing.faq.map((f) => `<h3>${f.question}</h3><p>${f.answer}</p>`).join("\n")}

<script type="application/ld+json">${faqJsonLd(pairing.faq)}</script>

<p><a href="${pairing.ctaPrimary.href}">${pairing.ctaPrimary.label} →</a> · <a href="${pairing.ctaSecondary.href}">${pairing.ctaSecondary.label} →</a></p>

<h2>Why intent fusion matters</h2>
<p>Users rarely search for a single isolated tool. They combine adjacent jobs — validating JSON while checking security posture, or estimating API cost while drafting prompts. This bridge page targets queries that span both "${pairing.toolA.name}" and "${pairing.toolB.name}" so search engines and AI overviews can cite a single authoritative answer.</p>

<h2>Next steps on ZZAI</h2>
<p>When you outgrow browser utilities, deploy the same workflows as production APIs with schema enforcement, monitoring, and rollback on <a href="${base}">zzaizzai.com</a>. Orbit autopilot keeps indexing these fusion surfaces and feeds winning pairs back into the product roadmap.</p>

<h2>Workflow walkthrough</h2>
<p>Start with ${pairing.toolA.name} to produce structured output you can trust, then pipe results into ${pairing.toolB.name} for the adjacent check your users actually need. Document the hand-off in your README, embed both tools on a landing page, and let Orbit submit canonical URLs to IndexNow and your sitemap. This pattern compounds: each fusion bridge captures long-tail queries competitors miss because they only ship single-purpose pages.</p>

<p>Teams shipping AI features use this loop to validate contracts before launch, while security-minded founders use it to prove diligence without a heavyweight enterprise suite. Either way, the bridge keeps users on your domain longer and gives Google a reason to index deeper than a thin doorway page.</p>`;

  const metaDescription = `Free bridge page combining ${pairing.toolA.name} and ${pairing.toolB.name} — intent fusion for cross-hub SEO on ZZAI.`.slice(
    0,
    155,
  );

  return {
    slug: cleanSlug.replace(/\//g, "-"),
    keyword,
    title,
    headline: title,
    subheadline: pairing.bridgePrinciple.slice(0, 200),
    content,
    howItWorks: pairing.microToolIdea,
    whoItsFor: "Builders searching across adjacent tool intents — developers, founders, and security-minded teams.",
    benefits: [
      `Combines ${pairing.toolA.name} and ${pairing.toolB.name} in one indexable surface`,
      "FAQ schema for AI overview citations",
      "Bi-directional CTAs to source tools and ZZAI platform",
    ],
    relatedSlugs: [
      pairing.toolA.path.replace(/^\//, ""),
      pairing.toolB.path.replace(/^\//, ""),
    ].filter(Boolean),
    metaTitle: `${title} | ZZAI IFM`.slice(0, 60),
    metaDescription,
    category: "ifm-bridge",
    toolUrl: `${base}/${cleanSlug.replace(/\//g, "-")}`,
  };
}
