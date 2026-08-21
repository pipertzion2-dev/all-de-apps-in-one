import { publicAppUrl } from "./slug";

export type MiniAppSeed = {
  name: string;
  description: string;
  category?: string;
  toolPath?: string | null;
  slug: string;
};

export function defaultSeoMetadata(seed: MiniAppSeed, origin: string) {
  const title = `${seed.name} — free online tool | ZZAI`;
  const description =
    seed.description?.trim().slice(0, 155) ||
    `Use ${seed.name} online. Fast, free mini-app on ZZAI Orbit.`;
  const canonical = publicAppUrl(origin, seed.slug);
  const features = [
    `Run ${seed.name} in your browser`,
    "No install required",
    "Built for creators and teams on ZZAI",
  ];
  const whoItsFor = `Anyone who needs ${seed.name.toLowerCase()} without switching tools — students, builders, marketers, and operators.`;
  const howToUse = `Open ${seed.name}, follow the on-page steps, and use the interactive tool on this same page. Results stay in your session unless you choose to save or share them.`;
  const crawlableBody = [
    `${seed.name} is a public ZZAI mini-app.`,
    seed.description,
    `Category: ${seed.category || "general"}.`,
    "This page includes both a clear explanation and the live interactive tool so search engines and humans can understand what the app does.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const faq = [
    {
      q: `What is ${seed.name}?`,
      a: seed.description || `${seed.name} is a free ZZAI mini-app.`,
    },
    {
      q: "Is this tool free?",
      a: "The public mini-app page is free to use. ZZAI platform features may require an account.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. The interactive tool runs in your browser on this URL.",
    },
  ];

  return {
    seoTitle: title,
    metaDescription: description,
    canonicalUrl: canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: `${origin.replace(/\/$/, "")}/zzai-logo.png`,
    robotsDirective: "index,follow",
    whoItsFor,
    howToUse,
    keyFeatures: features,
    crawlableBody,
    faqJson: faq,
    structuredDataJson: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: seed.name,
      description,
      applicationCategory: seed.category || "UtilitiesApplication",
      url: canonical,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    } as Record<string, unknown>,
  };
}
