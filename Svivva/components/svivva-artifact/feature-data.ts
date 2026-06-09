export type FeatureId = "play" | "seeds" | "orbit" | "security" | "api" | "hardware";

export type ArtworkFeature = {
  id: FeatureId;
  artwork: string;
  artworkAlt: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  cta: string;
  accentColor: string;
  accentColorRgb: string;
  /** dominant visual elements extracted from artwork */
  motifs: string[];
  /** signature scroll interaction */
  signature: string;
};

export const ARTIFACT_FEATURES: ArtworkFeature[] = [
  {
    id: "play",
    artwork: "/artworks/play.png",
    artworkAlt: "BREATH_AWAY — Svivva Play",
    title: "Svivva Play",
    subtitle: "Takes your breath away",
    description:
      "AI music composition that writes, voices, and performs hocket arrangements — meend, sitar accents, full-ensemble intelligence.",
    href: "/play",
    cta: "Open Play",
    accentColor: "#7c3aed",
    accentColorRgb: "124,58,237",
    motifs: ["scan lines", "waveforms", "motion streaks", "neon grid"],
    signature: "Scan lines pulse on scroll like audio waveforms",
  },
  {
    id: "seeds",
    artwork: "/artworks/seeds.png",
    artworkAlt: "Settle Down — Svivva Seeds",
    title: "Svivva Seeds",
    subtitle: "Together we discover a path",
    description:
      "One structured spec generates an entire product suite — frontend, backend, database, auth, and deployment configs, all built in parallel.",
    href: "/seeds",
    cta: "Explore Seeds",
    accentColor: "#5BA8A0",
    accentColorRgb: "91,168,160",
    motifs: ["music staff", "four panels", "togetherness", "parallel structure"],
    signature: "Music staff lines expand into branching app nodes on scroll",
  },
  {
    id: "orbit",
    artwork: "/artworks/orbit.png",
    artworkAlt: "IMG_2007 — Seeds Marketing Engine",
    title: "Seeds Marketing Engine",
    subtitle: "Intelligent organic growth",
    description:
      "Orbit: 8-system growth intelligence — pain miner, competitor radar, AEO, indexing, social publishing — running while you sleep.",
    href: "/dashboard/launchpad",
    cta: "Open Orbit",
    accentColor: "#d97706",
    accentColorRgb: "217,119,6",
    motifs: ["fractured eyes", "botanical web", "copper network", "observation"],
    signature: "Web lines pulse outward from center on hover",
  },
  {
    id: "security",
    artwork: "/artworks/security.png",
    artworkAlt: "ROMEO_3 — Security",
    title: "Pyracrypt · Clutety",
    subtitle: "Für immer dein — forever yours",
    description:
      "Feed Shield blocks unwanted content in real-time. Threat Scanner detects and neutralizes risks. Your data, permanently protected.",
    href: "/dashboard/security",
    cta: "Open Security",
    accentColor: "#6B2C4A",
    accentColorRgb: "107,44,74",
    motifs: ["ornate border", "layered stripes", "crystal vessels", "lock"],
    signature: "Filigree border locks into place on scroll",
  },
  {
    id: "api",
    artwork: "/artworks/api-builder.png",
    artworkAlt: "Bang On Me — AI API Builder",
    title: "AI API Builder",
    subtitle: "Prompt → Production",
    description:
      "Write the prompt. Deploy the API. Schema enforcement, 200 auto-written evals, version control, and instant rollback — zero ops.",
    href: "/dashboard/api-builder",
    cta: "Start Building",
    accentColor: "#be185d",
    accentColorRgb: "190,24,93",
    motifs: ["jewel case panels", "shrink wrap", "fragmented structure", "packaging"],
    signature: "Packaging panels assemble on scroll like schema validation",
  },
  {
    id: "hardware",
    artwork: "/artworks/hardware.png",
    artworkAlt: "PETALS_3 — Hardware Mode",
    title: "Hardware Mode",
    subtitle: "Real things, real hands",
    description:
      "AI-powered schematics, material sourcing, supplier network, and dimensional previews for physical product manufacturing.",
    href: "/dashboard/hardware-builder",
    cta: "Start Manufacturing",
    accentColor: "#7c3aed",
    accentColorRgb: "124,58,237",
    motifs: ["diamond fists", "figurines", "gems", "weight", "physicality"],
    signature: "Diamonds refract and rotate as you scroll",
  },
];
