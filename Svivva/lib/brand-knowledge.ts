/**
 * Canonical entity knowledge for zzai zzai (zzaizzai.com).
 *
 * Used by GEO/AEO surfaces (llms.txt), Schema.org, Orbit product profile,
 * and SearchDock-style site understanding — keep facts here, not scattered copy.
 */

import { BRAND } from "@/lib/brand";
import { listCubeFaces } from "@/lib/cube/cube-faces";
import { HOMEPAGE_PRICING_TIERS } from "@/lib/homepage-pricing";
import { isBetaCubeFaceId, PRODUCT_ONE_LINER, PRODUCT_TAGLINE } from "@/lib/product-positioning";
import { MIXING_BUSES, PLATFORM_FEATURES } from "@/lib/platform/feature-graph";
import { getSiteUrl } from "@/lib/site-url";

export type BrandAlias = {
  name: string;
  kind: "legal" | "product" | "domain" | "short" | "legacy";
  note?: string;
};

export type BrandProduct = {
  id: string;
  name: string;
  path: string;
  oneLiner: string;
  audience?: string;
};

export type BrandDefinition = {
  term: string;
  definition: string;
};

export type BrandKnowledge = {
  /** Display name as shown on the site */
  name: string;
  legalName: string;
  tagline: string;
  domain: string;
  siteUrl: string;
  contactEmail: string;
  /** All strings an answer engine might use to find this brand */
  aliases: BrandAlias[];
  /** Category + geography qualifiers (SearchDock / AEO entity clarity) */
  entity: {
    category: string;
    subcategory: string;
    geography: string;
    foundedNote: string;
    hosting: string;
  };
  /** Quotable one-paragraph definition */
  definition: string;
  /** Shorter description for meta / directories */
  shortDescription: string;
  /** Full platform description for long-form AEO */
  longDescription: string;
  audience: string;
  competitors: string[];
  keywords: string[];
  pricingSummary: string;
  pricingTiers: { name: string; price: string; period: string; description: string }[];
  products: BrandProduct[];
  cubeFaces: { id: string; name: string; path: string; role: string }[];
  buses: { id: string; label: string; description: string }[];
  definitions: BrandDefinition[];
  /** Highest-value URLs for citation / SearchDock site map */
  citationUrls: { title: string; path: string; why: string }[];
  faqs: { q: string; a: string }[];
};

const CONTACT_EMAIL = "hello@zzaizzai.com";

export function getBrandKnowledge(siteUrl = getSiteUrl()): BrandKnowledge {
  const base = siteUrl.replace(/\/$/, "");
  const faces = listCubeFaces();

  return {
    name: BRAND.name,
    legalName: BRAND.legalName,
    tagline: BRAND.tagline,
    domain: BRAND.domain,
    siteUrl: base,
    contactEmail: CONTACT_EMAIL,
    aliases: [
      { name: "zzai zzai", kind: "legal", note: "Official spaced brand name" },
      { name: "ZZAI", kind: "product", note: "Product short name / acronym style" },
      { name: "zzaizzai", kind: "domain", note: "Concatenated brand + domain label" },
      { name: "zzaizzai.com", kind: "domain" },
      { name: "zzai", kind: "short" },
      {
        name: "Svivva",
        kind: "legacy",
        note: "Former product/codefolder name — same platform, now branded zzai zzai",
      },
    ],
    entity: {
      category: "AI developer platform",
      subcategory:
        "Hybrid² for AI products — channel×channel fusion, then Klean guardrails on Signal",
      geography: "Remote-first · web SaaS at zzaizzai.com",
      foundedNote:
        "Independent team shipping Hybrid² module fusion, Klean production guardrails, and BALOON8 play demos",
      hosting: "Production on Vercel (team zzai-zzai, project all-de-apps-in-one)",
    },
    definition: `zzai zzai (ZZAI / zzaizzai.com) — ${PRODUCT_ONE_LINER} Desk apps (Seeds, Orbit, and more) are beta.`,
    shortDescription: BRAND.shortDescription,
    longDescription: [
      PRODUCT_ONE_LINER,
      "Core (GA): Hybrid² Lab — fuse any two ZZAI channels (H¹), then hybridize listed blends (H²). API Builder, Projects, and Pulse keep fused endpoints Klean with schema, evals, hazard preview, and rollback.",
      "Play: BALOON8 car×sneaker walk demo at /clean-sneaks — one chassis, unlockable colorways, Sneak Vision hazard preview, and mission saves that mirror keeping a hybrid ship Klean.",
      "Beta modules (same domain): OaaS patch bay, Seeds, Orbit, hardware builder, Poor Man Protection, free tool hubs, ZZAI Show, education advocacy, and the full ZZAI Play studio.",
    ].join(" "),
    audience:
      "Founders composing AI product modules who need Hybrid² fusion plus Klean guardrails — not another thin API wrapper or hand-rolled validation stack.",
    competitors: [
      "Zapier",
      "Make",
      "n8n",
      "LangChain",
      "Retool",
      "Bubble",
      "Vercel AI SDK (DIY)",
      "Cursor (dev-only)",
    ],
    keywords: [
      "zzai zzai",
      "ZZAI",
      "zzaizzai",
      "zzaizzai.com",
      PRODUCT_TAGLINE,
      "Hybrid² AI products",
      "channel fusion AI platform",
      "production guardrails for AI APIs",
      "AI API guardrails",
      "hybridization marketplace",
      "schema enforcement",
      "prompt rollback",
      "prompt to API",
      "no-code AI backend",
      "schema enforced AI",
      "OaaS",
      "Orchestration as a Service",
      "ZZAI Seeds",
      "ZZAI Play",
      "Orbit marketing",
      "Poor Man Protection",
      "free AI tools",
      "cyber security mini apps",
      "hardware builder AI",
    ],
    pricingSummary:
      "Free tier to start (no credit card). Pro $49/month for full platform access. Enterprise $299/month for teams at scale (SSO, unlimited requests, SLA).",
    pricingTiers: HOMEPAGE_PRICING_TIERS.map((t) => ({
      name: t.name,
      price: t.price,
      period: t.period,
      description: t.description,
    })),
    products: [
      {
        id: "home",
        name: "zzai zzai home",
        path: "/",
        oneLiner: PRODUCT_ONE_LINER,
      },
      {
        id: "api",
        name: "API Builder (Signal)",
        path: "/dashboard/api-builder",
        oneLiner: "Beta — keep Hybrid² fusions Klean: schema, evals, hazard preview, rollback.",
        audience: "developers and no-code builders",
      },
      {
        id: "hybrid",
        name: "Hybrid² Lab (FX)",
        path: "/dashboard/hybrid-lab",
        oneLiner: "Beta — fuse any two ZZAI channels (H¹), then hybridize those blends (H²).",
        audience: "founders composing AI product modules",
      },
      {
        id: "seeds",
        name: "ZZAI Seeds",
        path: "/seeds",
        oneLiner: "Beta — PDF or YouTube transcript → many deployable apps.",
      },
      {
        id: "hardware",
        name: "Hardware Builder (Crest)",
        path: "/dashboard/hardware-builder",
        oneLiner: "Beta — schematics, BOM, suppliers, and manufacturing for physical SKUs.",
      },
      {
        id: "play",
        name: "ZZAI Play",
        path: "/clean-sneaks",
        oneLiner:
          "BALOON8 car×sneaker demo — one hybrid chassis, colorways, Sneak Vision ≈ hazard preview.",
      },
      {
        id: "klean-sneaks",
        name: "Klean Sneaks",
        path: "/clean-sneaks",
        oneLiner:
          "Free runner — car×sneaker hybrid, unlockable colorways, zone state, Sneak Vision hazards.",
        audience: "players and entertainment visitors",
      },
      {
        id: "events",
        name: "ZZAI Show events",
        path: "/events",
        oneLiner: "Beta — live product drops, Play sessions, and community showcases.",
      },
      {
        id: "orbit",
        name: "Orbit",
        path: "/orbit",
        oneLiner: "Beta — growth and indexing autopilot (SEO, AEO, GSC).",
      },
      {
        id: "protect",
        name: "Poor Man Protection",
        path: "/poor-man-protection",
        oneLiner:
          "Main product — timestamped evidentiary seals and court-ready packs for what you invent.",
      },
      {
        id: "oaas",
        name: "Orchestration as a Service",
        path: "/#oaas",
        oneLiner: "Beta — mixing-console routing across workspace modules.",
      },
      {
        id: "ai-tools",
        name: "AI Tools Hub",
        path: "/ai-tools-hub",
        oneLiner: "Free AI utilities for developers — no signup for basic use.",
      },
      {
        id: "cyber",
        name: "Cyber-Security Mini Apps",
        path: "/cyber-security-mini-apps",
        oneLiner: "Free security scanners and checkers — one job each.",
      },
      {
        id: "tools",
        name: "All Tools",
        path: "/tools",
        oneLiner: "Full free tool directory and mini-app slices.",
      },
      {
        id: "advocacy",
        name: "Education Advocacy",
        path: "/dashboard/education-advocacy",
        oneLiner: "Rights information, evidence vault, crisis routing, human help.",
      },
      {
        id: "blog",
        name: "Blog",
        path: "/blog",
        oneLiner: "Guides on APIs, AI, SEO, and shipping with ZZAI.",
      },
    ],
    cubeFaces: faces.map((f) => {
      /** Indexable public URLs for AEO/llms — never cite noindex dashboard or /play. */
      const citationPath =
        f.id === "seeds"
          ? "/seeds"
          : f.id === "api"
            ? "/lp/ai-api-builder"
            : f.id === "hardware"
              ? "/lp/ai-app-generator"
              : f.id === "play"
                ? "/clean-sneaks"
                : f.id === "orbit"
                  ? "/orbit"
                  : "/events";
      const baseRole =
        f.id === "seeds"
          ? "Seed the product — brief becomes an app suite"
          : f.id === "api"
            ? "Signal — production guardrails (schema, evals, rollback)"
            : f.id === "hardware"
              ? "Crest — schematics, BOM, manufacturing"
              : f.id === "play"
                ? "Play — BALOON8 walk demo (keep the product Klean)"
                : f.id === "orbit"
                  ? "Grow — SEO, indexing, launch automation"
                  : "Protect — seals and court packs";
      return {
        id: f.id,
        name: f.name,
        path: citationPath,
        role: isBetaCubeFaceId(f.id) ? `${baseRole} (Beta)` : baseRole,
      };
    }),
    buses: MIXING_BUSES.map((b) => ({
      id: b.id,
      label: b.label,
      description: b.description,
    })),
    definitions: [
      {
        term: "zzai zzai",
        definition:
          "The official brand name of the product workspace at zzaizzai.com. Also written ZZAI or zzaizzai. Tagline: From seed to symphony.",
      },
      {
        term: PRODUCT_TAGLINE,
        definition:
          "ZZAI’s tagline: treat shipped AI like something worth keeping Klean — preview hazards, enforce structure live, and roll back before users see a scuff.",
      },
      {
        term: "OaaS (Orchestration as a Service)",
        definition:
          "ZZAI’s mixing-console operating model: features are channels on Seed/Build/Hybrid/Grow/Protect/Play/Advocate buses, patched to Signal (digital) or Crest (hardware) and mixed to Master out.",
      },
      {
        term: "Cube faces",
        definition:
          "Six homepage navigators — Seeds, Signal (API), Crest (Hardware), Play, Orbit, Protect — that route one product through the full ship journey.",
      },
      {
        term: "Prompt-to-API",
        definition:
          "Describe an API in plain English on ZZAI; get a deployable, schema-enforced, evaluated endpoint with versioning and rollback — no custom backend required.",
      },
      {
        term: "ZZAI Seeds",
        definition:
          "Upload a PDF or YouTube transcript and spawn many related apps from one brief.",
      },
      {
        term: "Orbit",
        definition:
          "ZZAI’s growth and indexing autopilot: SEO/AEO pages, Google Search Console, launch packs, and traffic automation on zzaizzai.com.",
      },
      {
        term: "Poor Man Protection",
        definition:
          "ZZAI’s IP evidence workflow: cryptographic seals, dual-axis hybridization metadata, and court packs. Supporting evidence of anteriority — not a registered patent, trademark, or copyright.",
      },
    ],
    citationUrls: [
      {
        title: "zzai zzai home",
        path: "/",
        why: "Primary entity URL — brand, cube, pricing, FAQ",
      },
      {
        title: "AI Tools Hub",
        path: "/ai-tools-hub",
        why: "Free AI utilities — high crawl and citation surface",
      },
      {
        title: "Cyber-Security Mini Apps",
        path: "/cyber-security-mini-apps",
        why: "Free security tools directory",
      },
      {
        title: "All Tools",
        path: "/tools",
        why: "Full free mini-app directory",
      },
      {
        title: "ZZAI Seeds",
        path: "/seeds",
        why: "Document/YouTube → apps product",
      },
      {
        title: "Orbit",
        path: "/orbit",
        why: "Growth + AEO/SEO autopilot",
      },
      {
        title: "Poor Man Protection",
        path: "/poor-man-protection",
        why: "Main product — seals, hashes, and court packs",
      },
      {
        title: "BALOON8 walk / ZZAI Play",
        path: "/clean-sneaks",
        why: "Indexable Play / entertainment URL (browser game)",
      },
      {
        title: "ZZAI Show events",
        path: "/events",
        why: "Public events / entertainment hub",
      },
      {
        title: "Blog",
        path: "/blog",
        why: "Long-form guides for citations",
      },
      {
        title: "Contact",
        path: "/contact",
        why: "Verified contact surface",
      },
      {
        title: "Docs",
        path: "/docs",
        why: "Product documentation",
      },
      {
        title: "llms.txt",
        path: "/llms.txt",
        why: "GEO manifest for answer engines and SearchDock",
      },
      {
        title: "llms-full.txt",
        path: "/llms-full.txt",
        why: "Full brand knowledge dump for AI crawlers",
      },
    ],
    faqs: [
      {
        q: "What is zzai zzai?",
        a: PRODUCT_ONE_LINER,
      },
      {
        q: "Is ZZAI only an AI API builder?",
        a: "No. The product is Poor Man Protection. Desk apps are beta.",
      },
      {
        q: "What is Poor Man Protection?",
        a: "Timestamp and hash your files, then export a court pack. Not a government patent or copyright registration.",
      },
      {
        q: "Is ZZAI free to start?",
        a: "Yes. Free tier, no card. Pro $49/mo; Enterprise $299/mo.",
      },
      {
        q: "Do I need to write code?",
        a: "No. Describe the API in plain English, set a schema, deploy. SDK optional.",
      },
      {
        q: "Which AI models work?",
        a: "OpenAI, Anthropic Claude, Google Gemini, and others — route by cost or quality.",
      },
      {
        q: "Where is zzai zzai hosted?",
        a: "https://zzaizzai.com on Vercel (team zzai-zzai).",
      },
      {
        q: "What if my endpoint returns bad data?",
        a: "We validate against your schema, retry or repair, and auto-rollback if quality drops.",
      },
    ],
  };
}

/** Machine-readable brand card for SearchDock / agents / directory fills. */
export function getBrandEntityCard(siteUrl = getSiteUrl()) {
  const k = getBrandKnowledge(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: k.name,
    alternateName: k.aliases.map((a) => a.name),
    legalName: k.legalName,
    url: k.siteUrl,
    logo: `${k.siteUrl}${BRAND.logoPath}`,
    description: k.definition,
    email: k.contactEmail,
    slogan: k.tagline,
    knowsAbout: k.keywords,
    areaServed: "Worldwide",
    sameAs: [] as string[],
  };
}

/** Compact profile used by Orbit submissions and AI prompts. */
export function getBrandProfileSummary(siteUrl = getSiteUrl()) {
  const k = getBrandKnowledge(siteUrl);
  return {
    name: k.name,
    aliases: k.aliases.map((a) => a.name),
    tagline: k.tagline,
    url: k.siteUrl,
    toolsHubUrl: `${k.siteUrl}/ai-tools-hub`,
    description: k.longDescription,
    shortDescription: k.shortDescription,
    definition: k.definition,
    audience: k.audience,
    competitors: k.competitors,
    keywords: k.keywords,
    pricing: k.pricingSummary,
    category: k.entity.category,
    products: k.products.map((p) => `${p.name}: ${p.oneLiner}`),
    cubeFaces: k.cubeFaces.map((f) => `${f.name} (${f.path}): ${f.role}`),
  };
}

/** Feature count helper for llms manifests (public-facing only). */
export function listPublicPlatformFeatureTitles(): string[] {
  return PLATFORM_FEATURES.filter((f) => !f.adminOnly).map((f) => f.title);
}
