/**
 * State-of-the-art customer acquisition playbooks for Admin Orbit.
 * Each playbook maps to real Orbit / Marketing Hub actions that drive traffic.
 */
import { getSiteUrl } from "@/lib/site-url";
import { HYBRID_GTM_STRATEGIES } from "@/lib/orbit/hybrid-gtm-strategies";

export const CUSTOMER_ACQUISITION_VERSION = "1.0.0";

export type AcquisitionChannel =
  | "organic_seo"
  | "aeo_geo"
  | "free_tools"
  | "plg"
  | "referral"
  | "community"
  | "content_amp"
  | "directories"
  | "paid"
  | "email";

export type AcquisitionAction =
  | "traffic_blast"
  | "weekly_growth"
  | "growth_intel"
  | "create_utm"
  | "create_referral"
  | "amplify"
  | "seed_campaign"
  | "open_hub"
  | "run_orbit_step"
  | "channel_intel";

export type AcquisitionPlaybook = {
  id: string;
  title: string;
  channel: AcquisitionChannel;
  /** Expected traffic impact for operators */
  impact: "critical" | "high" | "medium";
  /** Typical time-to-first-visit once executed */
  speed: "hours" | "days" | "weeks";
  summary: string;
  whyItWorks: string;
  actions: AcquisitionAction[];
  /** Deep links into the app */
  hrefs: { label: string; href: string }[];
  /** Optional Orbit step ids to highlight */
  orbitStepIds?: string[];
  metrics: string[];
};

export const ACQUISITION_PLAYBOOKS: AcquisitionPlaybook[] = [
  {
    id: "organic-compound",
    title: "Organic compound engine",
    channel: "organic_seo",
    impact: "critical",
    speed: "days",
    summary:
      "Publish answer-shaped SEO + tool pages, then blast IndexNow / Google / Bing so crawlers discover them this week — not next quarter.",
    whyItWorks:
      "Utility + comparison pages compound; every indexed URL is a free acquisition surface with product CTAs baked in.",
    actions: ["traffic_blast", "weekly_growth", "run_orbit_step"],
    hrefs: [
      { label: "SEO Health", href: "/dashboard/seo-health" },
      { label: "Growth directories", href: "/dashboard/growth" },
    ],
    orbitStepIds: ["svivva-seo-pages", "svivva-comparisons", "svivva-blog", "svivva-indexnow"],
    metrics: ["Indexed pages", "Non-brand clicks", "Tool→signup %"],
  },
  {
    id: "aeo-citations",
    title: "AEO / GEO citation capture",
    channel: "aeo_geo",
    impact: "high",
    speed: "weeks",
    summary:
      "Ship FAQ/PAA pages structured for ChatGPT, Perplexity, and Google AI Overviews to quote ZZAI on builder queries.",
    whyItWorks:
      "Buyers research in AI search first; citable answers compress CAC and win zero-click brand mentions.",
    actions: ["traffic_blast", "growth_intel", "run_orbit_step"],
    hrefs: [
      { label: "Growth Intel", href: "/dashboard/orbit?tab=growth" },
      { label: "AEO content", href: "/dashboard/growth" },
    ],
    orbitStepIds: ["svivva-aeo", "svivva-paa"],
    metrics: ["AI overview citations", "AEO page views", "Branded search lift"],
  },
  {
    id: "free-tools-funnel",
    title: "Free tools → product funnel",
    channel: "free_tools",
    impact: "critical",
    speed: "days",
    summary:
      "Index cyber mini-apps and AI Tools Hub as lead magnets; every tool page CTA routes into Seeds / Security Center.",
    whyItWorks:
      "Utility SEO is the #1 PLG acquisition channel for developer tools — demo is the landing page.",
    actions: ["traffic_blast", "create_utm", "run_orbit_step"],
    hrefs: [
      { label: "AI Tools Hub", href: "/ai-tools-hub" },
      { label: "Security tools", href: "/cyber-security-mini-apps" },
      { label: "Traffic dashboard", href: "/dashboard/traffic" },
    ],
    orbitStepIds: ["svivva-seo-pages", "svivva-integrations"],
    metrics: ["Tool page sessions", "Hub→signup %", "Security activations"],
  },
  {
    id: "plg-activation",
    title: "PLG first-session activation",
    channel: "plg",
    impact: "high",
    speed: "hours",
    summary:
      "Shorten time-to-value: YouTube → Seeds or paste URL → Security scan, then nudge PQLs into Stripe checkout.",
    whyItWorks:
      "Hybrid PLG + product-led sales converts 25–35% of high-intent PQLs vs cold outbound.",
    actions: ["channel_intel", "create_utm", "seed_campaign"],
    hrefs: [
      { label: "Seeds", href: "/dashboard/seeds" },
      { label: "Channel Intel", href: "/dashboard/marketing/channel-intel" },
      { label: "Billing", href: "/dashboard/billing" },
    ],
    metrics: ["First-session seeds", "PQL count", "Trial→paid %"],
  },
  {
    id: "viral-referrals",
    title: "Referral / viral loop",
    channel: "referral",
    impact: "high",
    speed: "hours",
    summary:
      "Issue tracked referral links with rewards; every Seeds/Security share becomes an attributed acquisition channel.",
    whyItWorks:
      "Peer invites beat ads for builder tools; tracked codes give clean CAC and viral coefficient signals.",
    actions: ["create_referral", "create_utm", "open_hub"],
    hrefs: [
      { label: "Referrals hub", href: "/marketing-hub/referrals" },
      { label: "Public referrals", href: "/referrals" },
    ],
    metrics: ["Referral clicks", "Invite→signup %", "K-factor"],
  },
  {
    id: "community-distribution",
    title: "Community + parasite distribution",
    channel: "community",
    impact: "high",
    speed: "hours",
    summary:
      "Ship ready-to-paste packs for Product Hunt, Reddit, Dev.to, Hashnode, and Indie Hackers from Autopilot.",
    whyItWorks:
      "Community-led posts on high-DA platforms create backlinks and ready-to-buy traffic in hours.",
    actions: ["amplify", "weekly_growth", "open_hub"],
    hrefs: [
      { label: "Marketing Autopilot", href: "/dashboard/orbit?tab=autopilot" },
      { label: "Amplify", href: "/marketing-hub/amplify" },
      { label: "Growth content", href: "/dashboard/growth" },
    ],
    orbitStepIds: ["svivva-directories", "svivva-parasite", "svivva-social"],
    metrics: ["Directory listings live", "Community CTR", "Referral signups"],
  },
  {
    id: "content-amplifier",
    title: "Multi-channel content amplifier",
    channel: "content_amp",
    impact: "medium",
    speed: "hours",
    summary:
      "One pillar asset → Twitter thread, LinkedIn, email, Instagram, Facebook — tracked with UTMs per channel.",
    whyItWorks:
      "Repurposing multiplies distribution without rewriting; UTMs prove which channel pays back.",
    actions: ["amplify", "create_utm", "open_hub"],
    hrefs: [
      { label: "Amplify", href: "/marketing-hub/amplify" },
      { label: "UTM builder", href: "/marketing-hub/utm" },
      { label: "A/B tests", href: "/marketing-hub/ab-tests" },
    ],
    metrics: ["Amplify jobs", "UTM clicks by channel", "CTA CTR"],
  },
  {
    id: "directory-blitz",
    title: "Directory + launch-site blitz",
    channel: "directories",
    impact: "high",
    speed: "days",
    summary:
      "Generate 100+ directory listings and weekly sitemap pings; prioritize Product Hunt → G2 → Futurepedia.",
    whyItWorks:
      "AI/SaaS directories still send high-intent clicks; listing velocity builds a backlink moat.",
    actions: ["weekly_growth", "run_orbit_step", "open_hub"],
    hrefs: [
      { label: "Directories", href: "/dashboard/growth" },
      { label: "Checklist", href: "/dashboard/orbit?tab=checklist" },
    ],
    orbitStepIds: ["svivva-directories"],
    metrics: ["Listings submitted", "Live listings", "Referral traffic"],
  },
  {
    id: "paid-with-attribution",
    title: "Paid acquisition with attribution",
    channel: "paid",
    impact: "medium",
    speed: "hours",
    summary:
      "Create campaigns + UTM links before spend; retarget SEO visitors and measure CAC against Stripe revenue.",
    whyItWorks:
      "Paid without UTMs wastes budget; attributed retargeting of content visitors pays back in 1–3 months.",
    actions: ["seed_campaign", "create_utm", "open_hub"],
    hrefs: [
      { label: "Campaigns", href: "/marketing-hub/campaigns" },
      { label: "Leads", href: "/marketing-hub/leads" },
      { label: "Causal attribution", href: "/dashboard/orbit?tab=causal" },
    ],
    metrics: ["CAC", "ROAS", "Paid→lead %"],
  },
  {
    id: "email-compound",
    title: "Email / newsletter compound",
    channel: "email",
    impact: "medium",
    speed: "weeks",
    summary:
      "Weekly newsletter drafts + lead capture; owned list compounds and feeds product launches.",
    whyItWorks:
      "Owned audience survives algorithm changes; newsletter aggregators add secondary discovery.",
    actions: ["amplify", "seed_campaign", "open_hub"],
    hrefs: [
      { label: "Leads", href: "/marketing-hub/leads" },
      { label: "Growth newsletter", href: "/dashboard/growth" },
    ],
    metrics: ["List size", "Open rate", "Email→signup %"],
  },
];

export type AcquisitionQuickAction = {
  id: AcquisitionAction;
  label: string;
  description: string;
  /** Whether the Orbit API can execute this without leaving the panel */
  runnable: boolean;
};

export const ACQUISITION_QUICK_ACTIONS: AcquisitionQuickAction[] = [
  {
    id: "traffic_blast",
    label: "Traffic blast",
    description: "Publish on-site SEO + IndexNow / Google / Bing in one pass",
    runnable: true,
  },
  {
    id: "weekly_growth",
    label: "Weekly growth tasks",
    description: "Sitemap pings + IndexNow batch for all products",
    runnable: true,
  },
  {
    id: "growth_intel",
    label: "Demand scan",
    description: "Refresh Growth Intelligence opportunities ≥80",
    runnable: true,
  },
  {
    id: "create_utm",
    label: "Build UTM link",
    description: "Create a tracked campaign URL for any channel",
    runnable: true,
  },
  {
    id: "create_referral",
    label: "Mint referral link",
    description: "Issue a viral invite code with click/signup tracking",
    runnable: true,
  },
  {
    id: "amplify",
    label: "Amplify content",
    description: "Repurpose one asset across social + email channels",
    runnable: true,
  },
  {
    id: "seed_campaign",
    label: "Seed campaign",
    description: "Create a multi-channel campaign record with goals",
    runnable: true,
  },
  {
    id: "channel_intel",
    label: "Channel intel tick",
    description: "Pull due YouTube watches into growth briefings",
    runnable: true,
  },
];

export function getAcquisitionPlaybook(id: string): AcquisitionPlaybook | undefined {
  return ACQUISITION_PLAYBOOKS.find((p) => p.id === id);
}

export function playbooksByImpact(impact: AcquisitionPlaybook["impact"]): AcquisitionPlaybook[] {
  return ACQUISITION_PLAYBOOKS.filter((p) => p.impact === impact);
}

/** Default UTM presets operators can one-click from Orbit */
export function defaultAcquisitionUtmPresets(siteUrl = getSiteUrl()) {
  return [
    {
      name: "Product Hunt launch",
      destinationUrl: siteUrl,
      utmSource: "producthunt",
      utmMedium: "referral",
      utmCampaign: "ph-launch",
    },
    {
      name: "Reddit r/SideProject",
      destinationUrl: siteUrl,
      utmSource: "reddit",
      utmMedium: "community",
      utmCampaign: "sideproject",
    },
    {
      name: "Free tools hub CTA",
      destinationUrl: `${siteUrl}/ai-tools-hub`,
      utmSource: "tools",
      utmMedium: "organic",
      utmCampaign: "lead-magnet",
    },
    {
      name: "Referral program share",
      destinationUrl: `${siteUrl}/referrals`,
      utmSource: "referral",
      utmMedium: "share",
      utmCampaign: "invite-loop",
    },
    {
      name: "LinkedIn founder post",
      destinationUrl: siteUrl,
      utmSource: "linkedin",
      utmMedium: "social",
      utmCampaign: "founder-post",
    },
  ] as const;
}

export function formatAcquisitionPlaybookMarkdown(): string {
  return ACQUISITION_PLAYBOOKS.map(
    (p) =>
      `## ${p.title} (${p.impact} · ${p.speed})\n${p.summary}\n\n**Why:** ${p.whyItWorks}\n\n**Actions:** ${p.actions.join(", ")}\n`,
  ).join("\n");
}

/** Hybrid GTM strategies folded into acquisition for Orbit operators */
export function hybridStrategiesForAcquisition() {
  return HYBRID_GTM_STRATEGIES.map((s) => ({
    id: s.id,
    title: s.title,
    motion: s.motion,
    summary: s.summary,
    metrics: s.metrics,
  }));
}

export function acquisitionChannelLabel(channel: AcquisitionChannel): string {
  const labels: Record<AcquisitionChannel, string> = {
    organic_seo: "Organic SEO",
    aeo_geo: "AEO / GEO",
    free_tools: "Free tools",
    plg: "PLG",
    referral: "Referral",
    community: "Community",
    content_amp: "Content amp",
    directories: "Directories",
    paid: "Paid",
    email: "Email",
  };
  return labels[channel];
}
