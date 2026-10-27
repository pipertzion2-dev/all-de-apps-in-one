import { MEDIA } from "@/lib/media-assets";
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
    artwork: MEDIA.artworks.play,
    artworkAlt: "BREATH_AWAY — ZZAI Play",
    title: "ZZAI Play",
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
    artwork: MEDIA.artworks.seeds,
    artworkAlt: "Settle Down — ZZAI Seeds",
    title: "ZZAI Seeds",
    subtitle: "Together we discover a path",
    description:
      "One structured spec generates an entire product suite — frontend, backend, database, auth, and deployment configs, all built in parallel.",
    href: "/seeds",
    cta: "Explore Seeds",
    accentColor: "#5a8c7a",
    accentColorRgb: "90,140,122",
    motifs: ["music staff", "four panels", "togetherness", "parallel structure"],
    signature: "Music staff lines expand into branching app nodes on scroll",
  },
  {
    id: "orbit",
    artwork: MEDIA.artworks.orbit,
    artworkAlt: "IMG_2007 — Seeds Marketing Engine",
    title: "Marketing Orbit",
    subtitle: "Intelligent organic growth",
    description:
      "Orbit: 8-system growth intelligence — pain miner, competitor radar, AEO, indexing, social publishing — running while you sleep.",
    href: "/dashboard/launchpad",
    cta: "Open Orbit",
    accentColor: "#8ca840",
    accentColorRgb: "140,168,64",
    motifs: ["fractured eyes", "botanical web", "copper network", "observation"],
    signature: "Web lines pulse outward from center on hover",
  },
  {
    id: "security",
    artwork: MEDIA.artworks.security,
    artworkAlt: "ROMEO_3 — Security",
    title: "Poor Man Protection",
    subtitle: "Sketch-to-seal group patents",
    description:
      "Deposit sketches, mint a protection coin, and build a court-ready pack for group patents.",
    href: "/poor-man-protection",
    cta: "Open Protect",
    accentColor: "#4a9cac",
    accentColorRgb: "74,156,172",
    motifs: ["ornate border", "layered stripes", "crystal vessels", "lock"],
    signature: "Filigree border locks into place on scroll",
  },
  {
    id: "api",
    artwork: MEDIA.artworks.apiBuilder,
    artworkAlt: "Bang On Me — AI API Builder",
    title: "Digital",
    subtitle: "Signal bus — prompt to API",
    description:
      "Write the prompt. Deploy the API. Schema enforcement, 200 auto-written evals, version control, and instant rollback — zero ops.",
    href: "/dashboard/api-builder",
    cta: "Start Building",
    accentColor: "#a87080",
    accentColorRgb: "168,112,128",
    motifs: ["jewel case panels", "shrink wrap", "fragmented structure", "packaging"],
    signature: "Packaging panels assemble on scroll like schema validation",
  },
  {
    id: "hardware",
    artwork: MEDIA.artworks.hardware,
    artworkAlt: "PETALS_3 — Hardware Mode",
    title: "Hardware",
    subtitle: "Real things, real hands",
    description:
      "AI-powered schematics, material sourcing, supplier network, and dimensional previews for physical product manufacturing.",
    href: "/dashboard/hardware-builder",
    cta: "Start Manufacturing",
    accentColor: "#d070c0",
    accentColorRgb: "208,112,192",
    motifs: ["diamond fists", "figurines", "gems", "weight", "physicality"],
    signature: "Diamonds refract and rotate as you scroll",
  },
];
