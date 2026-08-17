/** ZZAI platform feature catalog — HaaS (Hybridization as a Service) routing and AI suggestions. */

export type PlatformFeatureLayer = "seed" | "build" | "hybrid" | "grow" | "protect" | "play";

export type PlatformFeature = {
  id: string;
  title: string;
  shortTitle: string;
  href: string;
  description: string;
  layer: PlatformFeatureLayer;
  tags: string[];
  /** Feature ids that commonly follow this one in a workflow. */
  connectsTo: string[];
  adminOnly?: boolean;
};

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: "haas",
    title: "Hybridization as a Service",
    shortTitle: "HaaS",
    href: "/#haas",
    description:
      "AI-powered hybrid routing across ZZAI — fuse APIs, multi-app seeds, launch, intel, and IP in one technical environment.",
    layer: "hybrid",
    tags: ["haas", "hybridization", "hybrid", "platform", "connect", "fuse", "bridge", "mix"],
    connectsTo: ["seeds", "api-builder", "hybridization", "launch-studio", "channel-intel", "poor-man-protection"],
  },
  {
    id: "seeds",
    title: "ZZAI Seeds",
    shortTitle: "Seeds",
    href: "/seeds",
    description:
      "Multi-app factory: one structured document → many deployable apps with code, docs, and launch pages.",
    layer: "seed",
    tags: ["seed", "pdf", "multi-app", "portfolio", "factory", "suite", "document"],
    connectsTo: ["api-builder", "launch-studio", "orbit", "marketing", "channel-intel", "haas"],
  },
  {
    id: "api-builder",
    title: "API Builder",
    shortTitle: "APIaaS",
    href: "/dashboard/api-builder",
    description: "Plain-English prompts become production APIs with schema enforcement and deploy.",
    layer: "build",
    tags: ["api", "backend", "prompt", "endpoint", "deploy", "schema"],
    connectsTo: ["projects", "launch-studio", "pulse", "seeds"],
  },
  {
    id: "projects",
    title: "Projects",
    shortTitle: "Projects",
    href: "/dashboard/projects",
    description: "Versioned prompts, evals, rollback, and live endpoints for every API you ship.",
    layer: "build",
    tags: ["projects", "version", "eval", "rollback", "monitor"],
    connectsTo: ["pulse", "launch-studio", "orbit"],
  },
  {
    id: "hybridization",
    title: "Hybridization Engine",
    shortTitle: "Hybrid engine",
    href: "/dashboard/hypothesis",
    description: "Fuse two domains — specs, APIs, patents, or research — into emergent outputs.",
    layer: "hybrid",
    tags: ["hybrid", "mix", "fuse", "bridge", "crossover", "hypothesis"],
    connectsTo: ["poor-man-protection", "idea-engine", "seeds", "channel-intel"],
  },
  {
    id: "poor-man-protection",
    title: "Poor Man Protection",
    shortTitle: "ProtectaaS",
    href: "/dashboard/poor-man-protection",
    description: "Sketch-to-seal IP deposits, group patents, court packs, and hybrid claims.",
    layer: "protect",
    tags: ["patent", "ip", "sketch", "group", "court", "protection"],
    connectsTo: ["hybridization", "seeds", "launch-studio"],
  },
  {
    id: "idea-engine",
    title: "Idea Engine",
    shortTitle: "IdeaaS",
    href: "/dashboard/idea-engine",
    description: "Discover market gaps and product angles before you build.",
    layer: "build",
    tags: ["ideas", "market", "opportunity", "research"],
    connectsTo: ["seeds", "launch-studio", "channel-intel"],
  },
  {
    id: "launch-studio",
    title: "Launch Studio",
    shortTitle: "LaunchaaS",
    href: "/dashboard/launch-studio",
    description: "Landing pages, social copy, and launch assets for apps you are shipping.",
    layer: "grow",
    tags: ["launch", "landing", "social", "marketing", "traffic"],
    connectsTo: ["marketing", "orbit", "channel-intel", "seeds"],
  },
  {
    id: "marketing",
    title: "Marketing Console",
    shortTitle: "ConsoleaaS",
    href: "/dashboard/marketing",
    description: "Traffic AI chat, GoDaddy, GSC, mini-apps funnel, and growth automation.",
    layer: "grow",
    tags: ["marketing", "traffic", "seo", "godaddy", "gsc", "funnel"],
    connectsTo: ["channel-intel", "orbit", "launch-studio", "seeds"],
  },
  {
    id: "channel-intel",
    title: "Channel Intel",
    shortTitle: "IntelaaS",
    href: "/dashboard/marketing/channel-intel",
    description: "Ingest YouTube channels, auto-transcribe, and ask growth questions on a schedule.",
    layer: "grow",
    tags: ["youtube", "transcript", "starter story", "tactics", "watch", "intel"],
    connectsTo: ["launch-studio", "orbit", "seeds", "idea-engine"],
    adminOnly: true,
  },
  {
    id: "orbit",
    title: "Orbit",
    shortTitle: "OrbitaaS",
    href: "/dashboard/orbit",
    description: "SEO autopilot, content gaps, indexing, and full traffic automation.",
    layer: "grow",
    tags: ["orbit", "seo", "index", "autopilot", "content"],
    connectsTo: ["marketing", "launch-studio", "seeds"],
    adminOnly: true,
  },
  {
    id: "play",
    title: "ZZAI Play",
    shortTitle: "Play",
    href: "/play",
    description: "Hardware sampler UI — stems, patches, and neural audio workflows.",
    layer: "play",
    tags: ["play", "audio", "music", "hardware", "sampler"],
    connectsTo: ["seeds", "hardware-builder"],
  },
  {
    id: "hardware-builder",
    title: "Hardware Builder",
    shortTitle: "Hardware",
    href: "/dashboard/hardware-builder",
    description: "Physical prototypes — schematics, BOM, and manufacturing paths.",
    layer: "build",
    tags: ["hardware", "physical", "crest", "manufacture", "bom"],
    connectsTo: ["hypothesis-hardware", "play"],
  },
  {
    id: "hypothesis-hardware",
    title: "Hypothesis Lab (Hardware)",
    shortTitle: "HW Lab",
    href: "/dashboard/hypothesis-hardware",
    description: "Cross-ecosystem innovation across components, APIs, and seed apps.",
    layer: "hybrid",
    tags: ["hardware", "hypothesis", "components", "innovation"],
    connectsTo: ["hybridization", "seeds", "api-builder"],
  },
  {
    id: "security",
    title: "Security / Clutety",
    shortTitle: "Security",
    href: "/dashboard/security",
    description: "Threat simulation, PQC tools, and cyber mini-apps hub.",
    layer: "protect",
    tags: ["security", "cyber", "clutety", "pqc"],
    connectsTo: ["poor-man-protection", "orbit"],
  },
  {
    id: "pulse",
    title: "Pulse",
    shortTitle: "Pulse",
    href: "/dashboard/pulse",
    description: "Live analytics and intelligence across your APIs and launches.",
    layer: "grow",
    tags: ["analytics", "pulse", "metrics", "monitor"],
    connectsTo: ["projects", "marketing", "orbit"],
  },
];

export const FEATURE_BY_ID = new Map(PLATFORM_FEATURES.map((f) => [f.id, f]));

export function getFeature(id: string): PlatformFeature | undefined {
  return FEATURE_BY_ID.get(id);
}

export function getConnectedFeatures(id: string): PlatformFeature[] {
  const feature = getFeature(id);
  if (!feature) return [];
  return feature.connectsTo.map((cid) => getFeature(cid)).filter(Boolean) as PlatformFeature[];
}

export const HAAS_NAME = "HaaS";
export const HAAS_FULL_NAME = "Hybridization as a Service";
export const HAAS_TAGLINE =
  "One hybrid environment. APIs, seeds, launch automation, channel intel, and IP protection — fused by AI routing, not siloed tabs.";
export const HAAS_TECHNICAL_BLURB =
  "Cross-domain fusion engine: mix specs, transcripts, patents, and endpoints into emergent workflows with schema-safe outputs.";
