import { FEATURE_PUBLIC_PATHS } from "@/lib/feature-routes";
import { MEDIA } from "@/lib/media-assets";
import { isBetaCubeFaceId } from "@/lib/product-positioning";

export type FeatureId = "play" | "seeds" | "orbit" | "security" | "api" | "hardware";

export type FeatureDef = {
  id: FeatureId;
  index: number;
  name: string;
  /** Short face label painted on the cube (Play, Seeds, …). */
  shortLabel: string;
  artworkTitle: string;
  artworkSrc: string;
  tagline: string;
  description: string;
  cta: { label: string; href: string };
  accentColor: string;
  motif: string;
  signatureMotion: string;
  beta?: boolean;
};

function withBeta(f: Omit<FeatureDef, "beta">): FeatureDef {
  return { ...f, beta: isBetaCubeFaceId(f.id) };
}

export const FEATURES: FeatureDef[] = [
  withBeta({
    id: "play",
    index: 0,
    name: "Game",
    shortLabel: "Game",
    artworkTitle: "BREATH AWAY",
    artworkSrc: MEDIA.artworks.play,
    tagline: "Car-sneaker runner — unlock color finishes",
    description:
      "Free game — keep a car-sneaker clean, unlock finishes, peek ahead for hazards, and use quick saves when dirt hits.",
    cta: { label: "Open Game", href: FEATURE_PUBLIC_PATHS.play },
    accentColor: "#90c4d8",
    motif: "waveform",
    signatureMotion: "scan-lines pulse with rhythm",
  }),
  withBeta({
    id: "seeds",
    index: 1,
    name: "Seeds — brief to apps",
    shortLabel: "Apps",
    artworkTitle: "SETTLE DOWN",
    artworkSrc: MEDIA.artworks.seeds,
    tagline: "PDF or YouTube → many apps",
    description: "Turn a PDF or YouTube transcript into a suite of apps you can launch.",
    cta: { label: "Turn a brief into apps", href: FEATURE_PUBLIC_PATHS.seeds },
    accentColor: "#5a8c7a",
    motif: "branching",
    signatureMotion: "nodes branch outward from centre",
  }),
  withBeta({
    id: "orbit",
    index: 2,
    name: "SEO & growth",
    shortLabel: "Growth",
    artworkTitle: "ORBIT / IMG 2007",
    artworkSrc: MEDIA.artworks.orbit,
    tagline: "Search traffic on autopilot",
    description: "SEO, indexing, and traffic helpers that keep working while you sleep.",
    cta: { label: "Open SEO & growth", href: FEATURE_PUBLIC_PATHS.orbit },
    accentColor: "#8ca840",
    motif: "web",
    signatureMotion: "web filaments pulse on scroll",
  }),
  withBeta({
    id: "security",
    index: 3,
    name: "Poor Man Protection",
    shortLabel: "Protect",
    artworkTitle: "FOREVER YOURS",
    artworkSrc: MEDIA.artworks.security,
    tagline: "Sketch-to-seal evidence packs",
    description:
      "Poor Man Protection — upload sketches, seal them, and download proof you can share.",
    cta: { label: "Open Poor Man Protection", href: FEATURE_PUBLIC_PATHS.security },
    accentColor: "#4a9cac",
    motif: "seal",
    signatureMotion: "ornamental border traces and locks",
  }),
  withBeta({
    id: "api",
    index: 4,
    name: "Production guardrails",
    shortLabel: "Digital",
    artworkTitle: "BANG ON ME",
    artworkSrc: MEDIA.artworks.api,
    tagline: "After you combine tools — check shape, catch risks, roll back",
    description:
      "Preview deploy risks, check every response against your schema, and roll back in one click.",
    cta: { label: "Open API Builder", href: FEATURE_PUBLIC_PATHS.api },
    accentColor: "#a87080",
    motif: "packaging",
    signatureMotion: "panels fold and assemble",
  }),
  withBeta({
    id: "hardware",
    index: 5,
    name: "Hardware",
    shortLabel: "Hardware",
    artworkTitle: "DIAMOND FISTS",
    artworkSrc: MEDIA.artworks.hardware,
    tagline: "Hardware path — drawings to parts list",
    description: "AI drawings, material sourcing, and manufacturing help from concept to part.",
    cta: { label: "Open Hardware Builder", href: FEATURE_PUBLIC_PATHS.hardware },
    accentColor: "#d070c0",
    motif: "crystal",
    signatureMotion: "diamonds rotate and refract light",
  }),
];
