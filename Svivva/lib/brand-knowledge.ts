/**
 * Canonical entity knowledge for zzai zzai (zzaizzai.com).
 *
 * Used by GEO/AEO surfaces (llms.txt), Schema.org, Orbit product profile,
 * and SearchDock-style site understanding — keep facts here, not scattered copy.
 */

import { BRAND } from "@/lib/brand";
import { listCubeFaces } from "@/lib/cube/cube-faces";
import { HOMEPAGE_PRICING_TIERS } from "@/lib/homepage-pricing";
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
      category: "AI developer platform / product workspace",
      subcategory:
        "Prompt-to-API builder, hardware builder, growth automation, IP protection, free AI & security tools",
      geography: "Remote-first · web SaaS at zzaizzai.com",
      foundedNote: "Independent product workspace shipping software and hardware from one desk",
      hosting: "Production on Vercel (team zzai-zzai, project all-de-apps-in-one)",
    },
    definition:
      "zzai zzai (ZZAI / zzaizzai.com) is a product workspace with the tagline “From seed to symphony.” It turns plain-language intent into shipped product — software APIs, hardware prototypes, audio branding, go-to-market, and IP protection — through a six-face cube navigator and an Orchestration-as-a-Service (OaaS) mixing-console OS. Free AI tools and cyber-security mini-apps are top-of-funnel; the paid platform is the full seed→build→hybrid→grow→protect desk.",
    shortDescription: BRAND.shortDescription,
    longDescription: [
      "zzai zzai is one workspace to describe what you want, ship it with guardrails, and grow it without babysitting infrastructure.",
      "The homepage cube routes work across six faces: Seeds (document/YouTube → apps), Signal/API (prompt-to-API with schema, evals, versioning, rollback), Crest/Hardware (schematics, BOM, manufacturing), Play (sonic branding), Orbit (SEO, indexing, launch, traffic automation), and Protect (Poor Man Protection — timestamped seals and court packs).",
      "OaaS treats features as mixing-console channels on Seed, Build, Hybrid, Grow, Protect, Play, and Advocate buses — patch any channel into Signal (digital) or Crest (hardware) and out the Master bus.",
      "Free surfaces include AI Tools Hub, Cyber-Security Mini Apps, and single-job /tools/* mini-apps (no signup). Paid Pro and Enterprise unlock unlimited endpoints, hardware projects, Seeds, Play, and OaaS routing.",
      "Also ships Education Advocacy (rights info, vault, crisis routing) and ZZAI ZZAI Show inside the same domain.",
    ].join(" "),
    audience:
      "Indie hackers, developers, founders, and small teams who want to ship AI features, hardware SKUs, and growth systems from one workspace — without assembling a backend team, agency stack, and IP workflow separately.",
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
      "From seed to symphony",
      "AI API builder",
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
        oneLiner: "Six-face cube navigator — From seed to symphony workspace.",
      },
      {
        id: "api",
        name: "API Builder (Signal)",
        path: "/dashboard/api-builder",
        oneLiner: "Plain English → production AI API with schema, evals, versioning, rollback.",
        audience: "developers and no-code builders",
      },
      {
        id: "seeds",
        name: "ZZAI Seeds",
        path: "/seeds",
        oneLiner: "PDF or YouTube transcript → many deployable apps.",
      },
      {
        id: "hardware",
        name: "Hardware Builder (Crest)",
        path: "/dashboard/hardware-builder",
        oneLiner: "Schematics, BOM, suppliers, and manufacturing for physical SKUs.",
      },
      {
        id: "play",
        name: "ZZAI Play",
        path: "/clean-sneaks",
        oneLiner: "Klean Sneaks endless runner + sonic branding on the Play face.",
      },
      {
        id: "klean-sneaks",
        name: "Klean Sneaks",
        path: "/clean-sneaks",
        oneLiner: "Free ZZAI Play endless runner — keep your kicks clean in the browser.",
        audience: "players and entertainment visitors",
      },
      {
        id: "events",
        name: "ZZAI Show events",
        path: "/events",
        oneLiner: "Live and on-demand product drops, Play sessions, and community showcases.",
      },
      {
        id: "orbit",
        name: "Orbit",
        path: "/orbit",
        oneLiner: "Growth + indexing autopilot — SEO, AEO, GSC, launch copy.",
      },
      {
        id: "protect",
        name: "Poor Man Protection",
        path: "/dashboard/poor-man-protection",
        oneLiner: "Timestamped evidentiary seals and court-ready packs (not a registered patent).",
      },
      {
        id: "oaas",
        name: "Orchestration as a Service",
        path: "/#oaas",
        oneLiner: "Mixing-console OS — 16 channels, buses, patch bay, Master out.",
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
        id: "hybrid",
        name: "Hybrid² Lab",
        path: "/dashboard/hybrid-lab",
        oneLiner: "Channel×channel fusion and hybrid marketplace.",
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
      return {
        id: f.id,
        name: f.name,
        path: citationPath,
        role:
          f.id === "seeds"
            ? "Seed the product — brief becomes an app suite"
            : f.id === "api"
              ? "Signal — production API with schema and evals"
              : f.id === "hardware"
                ? "Crest — schematics, BOM, manufacturing"
                : f.id === "play"
                  ? "Aux — Play entertainment (Klean Sneaks) + sonic branding"
                  : f.id === "orbit"
                    ? "Grow — SEO, indexing, launch automation"
                    : "Protect — seals and court packs",
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
        term: "From seed to symphony",
        definition:
          "ZZAI’s tagline: start from a seed (idea, PDF, or YouTube brief) and route it through build, hybrid, grow, and protect until it ships as a finished product.",
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
        title: "Klean Sneaks / ZZAI Play",
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
        q: "What is zzai zzai / ZZAI / zzaizzai?",
        a: "zzai zzai (also ZZAI, zzaizzai.com) is a product workspace: From seed to symphony. It turns plain-language intent into shipped product — software, hardware, audio, growth, and IP protection — with validation, evaluations, versioning, and rollback.",
      },
      {
        q: "Is ZZAI only an AI API builder?",
        a: "No. Prompt-to-API (Signal) is one cube face. ZZAI also includes Seeds, Hardware (Crest), Play, Orbit growth automation, Poor Man Protection, Hybrid², free AI/security tools, and Education Advocacy — one domain, one desk.",
      },
      {
        q: "What does From seed to symphony mean?",
        a: "Start from a seed (idea, PDF, or YouTube brief), route it through build/hybrid/grow/protect faces, and ship a finished product — the “symphony” — without babysitting infrastructure.",
      },
      {
        q: "How long does it take to ship with ZZAI?",
        a: "Most teams get a working, tested endpoint live quickly. Describe what you need, define the output schema, deploy — ZZAI handles validation, rollback, and ops.",
      },
      {
        q: "Does ZZAI work with OpenAI and other AI models?",
        a: "Yes. ZZAI supports OpenAI (GPT-4o, GPT-4, GPT-3.5), Anthropic Claude, Google Gemini, and other LLMs. You can route between models based on cost or quality thresholds.",
      },
      {
        q: "Do I need to write code to use ZZAI?",
        a: "No. The core workflow is no-code — describe your API in plain English, set the output schema, and deploy. A TypeScript SDK is available for programmatic access.",
      },
      {
        q: "Is ZZAI free to start?",
        a: "Yes. Free tier with no credit card required. Pro is $49/month; Enterprise is $299/month for teams at scale.",
      },
      {
        q: "What is Poor Man Protection?",
        a: "A ZZAI workflow that creates timestamped, cryptographically sealed evidentiary packages and court packs. It is not a registered patent, trademark, or copyright with any government office.",
      },
      {
        q: "Where is zzai zzai hosted?",
        a: "The live site is https://zzaizzai.com on Vercel (team zzai-zzai).",
      },
      {
        q: "What happens if my endpoint returns bad data?",
        a: "ZZAI validates every response against your JSON schema and automatically retries or repairs malformed outputs. If quality drops below your threshold, auto-rollback reverts to the last good version.",
      },
      {
        q: "What is Klean Sneaks?",
        a: "Klean Sneaks is a free browser endless runner from ZZAI Play at /clean-sneaks on zzaizzai.com — the entertainment face of the same zzai zzai workspace as the AI API builder and Orbit SEO.",
      },
      {
        q: "What is ZZAI Show / events?",
        a: "ZZAI Show is the public events hub at /events — live and on-demand product drops, Play sessions, and community showcases. Creators can open the Show console after signing in.",
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
