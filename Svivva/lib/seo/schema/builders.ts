import { absoluteUrl } from "@/lib/seo/metadata";
import { getBrandKnowledge, getBrandEntityCard } from "@/lib/brand-knowledge";
import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";

const ORG_ID = () => `${getSiteUrl().replace(/\/$/, "")}/#organization`;

export function organizationSchema() {
  const k = getBrandKnowledge();
  const card = getBrandEntityCard();
  return {
    ...card,
    "@id": ORG_ID(),
    name: k.name,
    alternateName: k.aliases.map((a) => a.name),
    url: getSiteUrl(),
    logo: absoluteUrl(BRAND.logoPath),
    description: k.definition,
    email: k.contactEmail,
    slogan: k.tagline,
    knowsAbout: k.keywords.slice(0, 24),
    sameAs: card.sameAs,
  };
}

export function websiteSchema() {
  const k = getBrandKnowledge();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: k.name,
    alternateName: k.aliases.map((a) => a.name),
    url: getSiteUrl(),
    description: k.shortDescription,
    publisher: { "@id": ORG_ID() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl().replace(/\/$/, "")}/tools?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  author: string;
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    author: { "@type": "Person", name: input.author },
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime || input.publishedTime,
    image: input.image ? absoluteUrl(input.image) : absoluteUrl(BRAND.logoPath),
    mainEntityOfPage: absoluteUrl(input.path),
    publisher: { "@id": ORG_ID() },
  };
}

export function softwareApplicationSchema(input: {
  name: string;
  description: string;
  path: string;
  category?: string;
}) {
  const k = getBrandKnowledge();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    alternateName: input.name === k.name ? k.aliases.map((a) => a.name) : undefined,
    description: input.description,
    url: absoluteUrl(input.path),
    applicationCategory: input.category || "DeveloperApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
      {
        "@type": "Offer",
        price: "49",
        priceCurrency: "USD",
        name: "Pro",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "49",
          priceCurrency: "USD",
          billingDuration: "P1M",
        },
      },
    ],
    publisher: { "@id": ORG_ID() },
  };
}

export function faqPageSchema(items: { q: string; a: string }[]) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function howToSchema(input: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function webPageSchema(input: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: { "@type": "WebSite", url: getSiteUrl() },
  };
}

/** Klean Sneaks / ZZAI Play entertainment surface. */
export function videoGameSchema(input?: {
  name?: string;
  description?: string;
  path?: string;
  imagePath?: string;
}) {
  const name = input?.name ?? "Klean Sneaks";
  const path = input?.path ?? "/clean-sneaks";
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name,
    alternateName: ["KLEAN SNEAKS", "Clean Sneaks"],
    description:
      input?.description ??
      "ZZAI Play endless runner — keep your kicks clean, steal the old man's bundle, and unlock Steal Bundle casino mode.",
    url: absoluteUrl(path),
    image: absoluteUrl(input?.imagePath ?? "/assets/clean-sneaks/baloon8-sneaker-thumbnail.png"),
    applicationCategory: "GameApplication",
    genre: ["Endless runner", "Arcade", "Casual"],
    gamePlatform: "Web browser",
    operatingSystem: "Web",
    playMode: "SinglePlayer",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": ORG_ID() },
    isPartOf: { "@type": "WebSite", url: getSiteUrl(), name: "zzai zzai" },
  };
}

/** Public ZZAI Show / events entertainment page. */
export function eventSeriesSchema(input?: { name?: string; description?: string; path?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "EventSeries",
    name: input?.name ?? "ZZAI Show",
    description:
      input?.description ??
      "Live and on-demand zzai zzai events — product drops, Play sessions, and community showcases on zzaizzai.com.",
    url: absoluteUrl(input?.path ?? "/events"),
    organizer: { "@id": ORG_ID() },
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: absoluteUrl(input?.path ?? "/events"),
    },
  };
}

/** Shared HowTo steps — keep in sync with homepage HowTo HTML. */
export const HOMEPAGE_HOWTO_STEPS = [
  {
    name: "Describe your API",
    text: "Write what you want your API to do in plain English — no code required.",
  },
  {
    name: "Define your output schema",
    text: "Set the JSON structure you expect back. ZZAI will enforce and validate it on every call.",
  },
  {
    name: "Auto-generate evaluations",
    text: "ZZAI writes up to 200 test cases automatically — edge cases, adversarial inputs, and boundary conditions.",
  },
  {
    name: "Deploy your endpoint",
    text: "One click publishes a live, auto-scaling API endpoint with full OpenAPI documentation.",
  },
  {
    name: "Monitor and rollback",
    text: "Watch latency, success rate, and token costs in real time. Enable auto-rollback for hands-free quality control.",
  },
] as const;

/**
 * Site-wide graph for the root layout — Organization + WebSite only.
 * FAQ / HowTo / SoftwareApplication belong on `/` so they match visible content.
 */
export function siteWideJsonLdGraph() {
  return [organizationSchema(), websiteSchema()];
}

/** Full homepage JSON-LD graph — Organization + WebSite + SoftwareApplication + FAQ + HowTo. */
export function homepageJsonLdGraph() {
  const k = getBrandKnowledge();
  const faq = faqPageSchema(k.faqs);
  return [
    organizationSchema(),
    websiteSchema(),
    softwareApplicationSchema({
      name: k.name,
      description: k.definition,
      path: "/",
      category: "DeveloperApplication",
    }),
    ...(faq ? [faq] : []),
    howToSchema({
      name: "How to ship with ZZAI",
      description:
        "Build a production-ready endpoint from a plain-language prompt with ZZAI — schema validation, evaluations, and rollback included.",
      steps: [...HOMEPAGE_HOWTO_STEPS],
    }),
  ];
}
