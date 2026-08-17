/** ZZAI platform catalog — OaaS mixing-console OS: channels, subgroups, master bus, patch bay. */

export type MixingBusId = "seed" | "build" | "hybrid" | "grow" | "protect" | "play";

/** @deprecated Use MixingBusId — kept for internal grouping keyed to bus sends. */
export type PlatformFeatureLayer = MixingBusId;

export type MixingBus = {
  id: MixingBusId;
  /** Subgroup name on the desk (e.g. Seed Bus). */
  label: string;
  consoleName: string;
  description: string;
  /** Typical send target before master. */
  sendsTo: "signal" | "crest" | "master" | "aux" | "both";
};

export type PlatformFeature = {
  id: string;
  title: string;
  shortTitle: string;
  href: string;
  description: string;
  /** Which subgroup bus this channel sends to. */
  bus: MixingBusId;
  /** @deprecated Alias for bus — used by legacy filters. */
  layer: MixingBusId;
  /** Channel strip number on the desk (01–16). */
  channel: number;
  channelLabel: string;
  tags: string[];
  /** Patch outputs — other channels this strip commonly routes into. */
  connectsTo: string[];
  /** Signal (digital/API) or Crest (hardware/manufacturing) main bus. */
  mainBus: "signal" | "crest" | "both";
  adminOnly?: boolean;
};

export const MIXING_BUSES: MixingBus[] = [
  {
    id: "seed",
    label: "Seed Bus",
    consoleName: "Bus A · Seed",
    description: "Input stage — one document seeds many app channels.",
    sendsTo: "signal",
  },
  {
    id: "build",
    label: "Build Bus",
    consoleName: "Bus B · Build",
    description: "Construction stage — APIs, projects, and hardware prototypes.",
    sendsTo: "signal",
  },
  {
    id: "hybrid",
    label: "FX / Hybrid Bus",
    consoleName: "Bus C · FX",
    description: "Insert & fusion — cross-domain hybridization and patch matrix.",
    sendsTo: "both",
  },
  {
    id: "grow",
    label: "Grow Bus",
    consoleName: "Bus D · Grow",
    description: "Send effects — launch, marketing, intel, and traffic automation.",
    sendsTo: "signal",
  },
  {
    id: "protect",
    label: "Protect Bus",
    consoleName: "Bus E · Protect",
    description: "Limiter chain — IP deposits, security, and court-ready packs.",
    sendsTo: "master",
  },
  {
    id: "play",
    label: "Aux Bus",
    consoleName: "Bus F · Aux",
    description: "Cue & monitor — Play sampler and creative side-chain.",
    sendsTo: "crest",
  },
];

export const SIGNAL_BUS = {
  id: "signal" as const,
  label: "Signal Bus",
  consoleName: "Main L · Signal",
  description: "Digital/API path — prompts, endpoints, evals, and rollback.",
  mode: "digital" as const,
};

export const CREST_BUS = {
  id: "crest" as const,
  label: "Crest Bus",
  consoleName: "Main R · Crest",
  description: "Hardware/manufacturing path — schematics, BOM, and physical prototypes.",
  mode: "physical" as const,
};

export const MASTER_BUS = {
  label: "Master Bus",
  consoleName: "Master L/R",
  description: "Final mix — deploy, launch, live endpoints, and shipped product.",
  outputs: ["Deploy", "Launch", "Live API", "Court pack"],
};

export const PATCH_BAY = {
  label: "Patch Bay",
  consoleName: "OaaS Router",
  description: "AI patch routing — connect any channel to the right bus and master out.",
  href: "/#oaas",
};

function feature(
  base: Omit<PlatformFeature, "layer" | "channelLabel"> & { channel: number },
): PlatformFeature {
  const channelLabel = `CH ${String(base.channel).padStart(2, "0")}`;
  return { ...base, layer: base.bus, channelLabel };
}

export const PLATFORM_FEATURES: PlatformFeature[] = [
  feature({
    id: "orchestration",
    title: "Orchestration as a Service",
    shortTitle: "OaaS",
    href: "/#oaas",
    description:
      "Patch bay & routing matrix — AI assigns channel order and bus sends across the desk.",
    bus: "hybrid",
    channel: 16,
    tags: ["oaas", "orchestration", "patch", "route", "console", "matrix", "scene"],
    connectsTo: [
      "seeds",
      "api-builder",
      "hybridization",
      "launch-studio",
      "channel-intel",
      "poor-man-protection",
    ],
    mainBus: "both",
  }),
  feature({
    id: "seeds",
    title: "ZZAI Seeds",
    shortTitle: "Seeds",
    href: "/seeds",
    description: "Channel 01 — multi-app factory: one structured document → many deployable apps.",
    bus: "seed",
    channel: 1,
    tags: ["seed", "pdf", "multi-app", "portfolio", "factory", "suite", "document", "channel"],
    connectsTo: [
      "api-builder",
      "launch-studio",
      "orbit",
      "marketing",
      "channel-intel",
      "orchestration",
    ],
    mainBus: "signal",
  }),
  feature({
    id: "api-builder",
    title: "API Builder",
    shortTitle: "APIaaS",
    href: "/dashboard/api-builder",
    description: "Channel 02 — plain-English prompts become production APIs on the Signal bus.",
    bus: "build",
    channel: 2,
    tags: ["api", "backend", "prompt", "endpoint", "deploy", "schema", "channel"],
    connectsTo: ["projects", "launch-studio", "pulse", "seeds"],
    mainBus: "signal",
  }),
  feature({
    id: "projects",
    title: "Projects",
    shortTitle: "Projects",
    href: "/dashboard/projects",
    description: "Channel 03 — versioned prompts, evals, rollback; monitor levels before master.",
    bus: "build",
    channel: 3,
    tags: ["projects", "version", "eval", "rollback", "monitor", "channel"],
    connectsTo: ["pulse", "launch-studio", "orbit"],
    mainBus: "signal",
  }),
  feature({
    id: "hybridization",
    title: "Hybridization Engine",
    shortTitle: "Hybrid FX",
    href: "/dashboard/hypothesis",
    description: "Channel 06 — FX insert: fuse two domains into emergent outputs.",
    bus: "hybrid",
    channel: 6,
    tags: ["hybrid", "mix", "fuse", "fx", "insert", "hypothesis", "channel"],
    connectsTo: ["poor-man-protection", "idea-engine", "seeds", "channel-intel"],
    mainBus: "both",
  }),
  feature({
    id: "poor-man-protection",
    title: "Poor Man Protection",
    shortTitle: "ProtectaaS",
    href: "/dashboard/poor-man-protection",
    description: "Channel 13 — limiter on the Protect bus: sketch-to-seal IP and court packs.",
    bus: "protect",
    channel: 13,
    tags: ["patent", "ip", "sketch", "group", "court", "protection", "channel"],
    connectsTo: ["hybridization", "seeds", "launch-studio"],
    mainBus: "signal",
  }),
  feature({
    id: "idea-engine",
    title: "Idea Engine",
    shortTitle: "IdeaaS",
    href: "/dashboard/idea-engine",
    description: "Channel 04 — pre-fade listen: market gaps before you unmute the build bus.",
    bus: "build",
    channel: 4,
    tags: ["ideas", "market", "opportunity", "research", "channel"],
    connectsTo: ["seeds", "launch-studio", "channel-intel"],
    mainBus: "signal",
  }),
  feature({
    id: "launch-studio",
    title: "Launch Studio",
    shortTitle: "LaunchaaS",
    href: "/dashboard/launch-studio",
    description: "Channel 08 — master send: landing pages and launch assets to the Grow bus.",
    bus: "grow",
    channel: 8,
    tags: ["launch", "landing", "social", "marketing", "traffic", "master", "channel"],
    connectsTo: ["marketing", "orbit", "channel-intel", "seeds"],
    mainBus: "signal",
  }),
  feature({
    id: "marketing",
    title: "Marketing Console",
    shortTitle: "ConsoleaaS",
    href: "/dashboard/marketing",
    description: "Channel 09 — EQ & compression on traffic: SEO, GSC, and growth automation.",
    bus: "grow",
    channel: 9,
    tags: ["marketing", "traffic", "seo", "godaddy", "gsc", "funnel", "channel"],
    connectsTo: ["channel-intel", "orbit", "launch-studio", "seeds"],
    mainBus: "signal",
  }),
  feature({
    id: "channel-intel",
    title: "Channel Intel",
    shortTitle: "IntelaaS",
    href: "/dashboard/marketing/channel-intel",
    description: "Channel 11 — side-chain input: YouTube transcripts feed the Grow bus.",
    bus: "grow",
    channel: 11,
    tags: ["youtube", "transcript", "starter story", "tactics", "watch", "intel", "channel"],
    connectsTo: ["launch-studio", "orbit", "seeds", "idea-engine"],
    mainBus: "signal",
    adminOnly: true,
  }),
  feature({
    id: "orbit",
    title: "Orbit",
    shortTitle: "OrbitaaS",
    href: "/dashboard/orbit",
    description: "Channel 12 — autopilot send: SEO indexing and full traffic automation.",
    bus: "grow",
    channel: 12,
    tags: ["orbit", "seo", "index", "autopilot", "content", "channel"],
    connectsTo: ["marketing", "launch-studio", "seeds"],
    mainBus: "signal",
    adminOnly: true,
  }),
  feature({
    id: "play",
    title: "ZZAI Play",
    shortTitle: "Play",
    href: "/play",
    description: "Channel 15 — Aux return: stems, patches, and neural audio on the Crest bus.",
    bus: "play",
    channel: 15,
    tags: ["play", "audio", "music", "hardware", "sampler", "aux", "channel"],
    connectsTo: ["seeds", "hardware-builder"],
    mainBus: "crest",
  }),
  feature({
    id: "hardware-builder",
    title: "Hardware Builder",
    shortTitle: "Hardware",
    href: "/dashboard/hardware-builder",
    description: "Channel 05 — Crest path: schematics, BOM, and manufacturing prototypes.",
    bus: "build",
    channel: 5,
    tags: ["hardware", "physical", "crest", "manufacture", "bom", "channel"],
    connectsTo: ["hypothesis-hardware", "play"],
    mainBus: "crest",
  }),
  feature({
    id: "hypothesis-hardware",
    title: "Hypothesis Lab (Hardware)",
    shortTitle: "HW Lab",
    href: "/dashboard/hypothesis-hardware",
    description: "Channel 07 — Crest FX: cross-ecosystem innovation across components.",
    bus: "hybrid",
    channel: 7,
    tags: ["hardware", "hypothesis", "components", "innovation", "channel"],
    connectsTo: ["hybridization", "seeds", "api-builder"],
    mainBus: "crest",
  }),
  feature({
    id: "security",
    title: "Security / Clutety",
    shortTitle: "Security",
    href: "/dashboard/security",
    description: "Channel 14 — Protect bus gate: threat sim, PQC, and cyber mini-apps.",
    bus: "protect",
    channel: 14,
    tags: ["security", "cyber", "clutety", "pqc", "channel"],
    connectsTo: ["poor-man-protection", "orbit"],
    mainBus: "signal",
  }),
  feature({
    id: "pulse",
    title: "Pulse",
    shortTitle: "Pulse",
    href: "/dashboard/pulse",
    description: "Channel 10 — VU meter: live analytics across APIs and launch sends.",
    bus: "grow",
    channel: 10,
    tags: ["analytics", "pulse", "metrics", "monitor", "vu", "channel"],
    connectsTo: ["projects", "marketing", "orbit"],
    mainBus: "signal",
  }),
];

export const FEATURE_BY_ID = new Map(PLATFORM_FEATURES.map((f) => [f.id, f]));

export const MIXING_BUS_BY_ID = new Map(MIXING_BUSES.map((b) => [b.id, b]));

export function getFeature(id: string): PlatformFeature | undefined {
  return FEATURE_BY_ID.get(id);
}

export function getBus(id: MixingBusId): MixingBus | undefined {
  return MIXING_BUS_BY_ID.get(id);
}

export function getFeaturesByBus(busId: MixingBusId, includeAdmin = false): PlatformFeature[] {
  return PLATFORM_FEATURES.filter((f) => f.bus === busId && (includeAdmin || !f.adminOnly)).sort(
    (a, b) => a.channel - b.channel,
  );
}

export function getConnectedFeatures(id: string): PlatformFeature[] {
  const feature = getFeature(id);
  if (!feature) return [];
  return feature.connectsTo.map((cid) => getFeature(cid)).filter(Boolean) as PlatformFeature[];
}

export function formatPatchRoute(titles: string[]): string {
  if (titles.length === 0) return "No patch";
  return titles.join(" → ");
}

export const OAAS_NAME = "OaaS";
export const OAAS_FULL_NAME = "Orchestration as a Service";
export const OAAS_TAGLINE =
  "A mixing-console OS for builders. Every ZZAI module is a channel strip; OaaS is the patch bay that routes your signal to the master bus.";
export const OAAS_TECHNICAL_BLURB =
  "Channels patch into subgroup buses (Seed, Build, FX, Grow, Protect, Aux), sum through Signal or Crest mains, and print to Master — deploy, launch, and ship.";
