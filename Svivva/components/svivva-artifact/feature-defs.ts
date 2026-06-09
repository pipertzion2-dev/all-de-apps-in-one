export type FeatureId = "play" | "seeds" | "orbit" | "security" | "api" | "hardware";

export type FeatureDef = {
  id: FeatureId;
  index: number;
  name: string;
  artworkTitle: string;
  artworkSrc: string;
  tagline: string;
  description: string;
  cta: { label: string; href: string };
  accentColor: string;
  motif: string;
  signatureMotion: string;
};

export const FEATURES: FeatureDef[] = [
  {
    id: "play",
    index: 0,
    name: "Svivva Play",
    artworkTitle: "BREATH AWAY",
    artworkSrc: "/artworks/play.png",
    tagline: "Захватывает дыхание",
    description:
      "AI music composition that breathes. Hocket voices, Meend expression, real-time sitar and vibraphone — the interface hears you.",
    cta: { label: "Open Svivva Play", href: "/play" },
    accentColor: "#7c5cbf",
    motif: "waveform",
    signatureMotion: "scan-lines pulse with rhythm",
  },
  {
    id: "seeds",
    index: 1,
    name: "Svivva Seeds",
    artworkTitle: "SETTLE DOWN",
    artworkSrc: "/artworks/seeds.png",
    tagline: "Gemeinsam — together, we build",
    description:
      "One structured spec in. Full-stack app suites out — frontend, backend, database, auth, and deploys built side by side in parallel.",
    cta: { label: "Explore Seeds", href: "/seeds" },
    accentColor: "#5BA8A0",
    motif: "branching",
    signatureMotion: "nodes branch outward from centre",
  },
  {
    id: "orbit",
    index: 2,
    name: "Seeds Marketing Engine",
    artworkTitle: "ORBIT / IMG 2007",
    artworkSrc: "/artworks/orbit.png",
    tagline: "Watching every market, always",
    description:
      "8-system growth intelligence. Pain miner, competitor radar, content engine, and 50+ mini apps compounding organic traffic while you sleep.",
    cta: { label: "Open Orbit", href: "/dashboard/launchpad" },
    accentColor: "#3d8a82",
    motif: "web",
    signatureMotion: "web filaments pulse on scroll",
  },
  {
    id: "security",
    index: 3,
    name: "Security — Pyracrypt / Clutety",
    artworkTitle: "FOREVER YOURS",
    artworkSrc: "/artworks/security.png",
    tagline: "Für immer dein — forever yours",
    description:
      "Feed Shield blocks harmful content. Threat Scanner analyzes files. Your data stays sealed inside an ornate, unbreakable vault.",
    cta: { label: "Security Center", href: "/dashboard/security" },
    accentColor: "#6B2C4A",
    motif: "seal",
    signatureMotion: "ornamental border traces and locks",
  },
  {
    id: "api",
    index: 4,
    name: "AI API Builder",
    artworkTitle: "BANG ON ME",
    artworkSrc: "/artworks/api.png",
    tagline: "Prompt → packaged endpoint",
    description:
      "Write the prompt. Get a production API with schema enforcement, 200 auto-generated evals, versioning, and rollback. Zero YAML.",
    cta: { label: "Start Building", href: "/dashboard/api-builder" },
    accentColor: "#9b4d6e",
    motif: "packaging",
    signatureMotion: "panels fold and assemble",
  },
  {
    id: "hardware",
    index: 5,
    name: "Hardware Mode",
    artworkTitle: "DIAMOND FISTS",
    artworkSrc: "/artworks/hardware.png",
    tagline: "Physical. Real. Tangible.",
    description:
      "From concept to manufactured product. AI-powered schematics, material sourcing, supplier network, real-time cost tracking.",
    cta: { label: "Hardware Builder", href: "/dashboard/hardware-builder" },
    accentColor: "#b5547a",
    motif: "crystal",
    signatureMotion: "diamonds rotate and refract light",
  },
];
