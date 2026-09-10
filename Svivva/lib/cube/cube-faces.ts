import { FEATURES, type FeatureDef, type FeatureId } from "@/components/svivva-artifact/feature-defs";
import { FEATURE_PUBLIC_PATHS } from "@/lib/feature-routes";
import type { PlatformMode } from "@/lib/platform-context";
import { platformModeForCubeFace } from "@/lib/platform-context";

/** BoxGeometry material order: +x, -x, +y, -y, +z, -z */
export const CUBE_GEOMETRY_FACE_ORDER: readonly FeatureId[] = [
  "api",
  "security",
  "play",
  "hardware",
  "seeds",
  "orbit",
] as const;

/**
 * Recommended master-bus order for shipping **one product** through all six cube faces.
 * Seeds → Signal → Crest → Aux → Grow → Protect → Master out.
 */
export const MASTER_BUS_JOURNEY_ORDER: readonly FeatureId[] = [
  "seeds",
  "api",
  "hardware",
  "play",
  "orbit",
  "security",
] as const;

export type CubeFace = FeatureDef & {
  geometryIndex: number;
  href: string;
  platformMode: PlatformMode | null;
};

export type CubeFaceStep = {
  /** 1-based step in the master-bus walkthrough */
  step: number;
  faceId: FeatureId;
  geometryIndex: number;
  shortLabel: string;
  name: string;
  href: string;
  platformMode: PlatformMode | null;
  /** What this face contributes when building the one product */
  role: string;
  /** Concrete action on this face for the product */
  action: string;
};

export type MasterProductJourney = {
  productName: string;
  productBrief: string;
  steps: CubeFaceStep[];
  masterBusOut: string;
};

const FACE_ROLES: Record<FeatureId, string> = {
  seeds: "Seed the product — PDF or YouTube brief becomes a deployable app suite.",
  api: "Signal path — turn the product logic into a production API with schema and evals.",
  hardware: "Crest path — schematics, BOM, suppliers, and manufacturing for the physical SKU.",
  play: "Aux path — brand audio, stems, and sonic identity for the product.",
  orbit: "Grow path — SEO, indexing, launch copy, and traffic automation.",
  security: "Protect path — sketch deposit, group patent seal, and court-ready pack.",
};

function featureById(id: FeatureId): FeatureDef {
  const f = FEATURES.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown cube face: ${id}`);
  return f;
}

/** All six cube faces with geometry index and routes. */
export function listCubeFaces(): CubeFace[] {
  return CUBE_GEOMETRY_FACE_ORDER.map((id, geometryIndex) => {
    const f = featureById(id);
    return {
      ...f,
      geometryIndex,
      href: FEATURE_PUBLIC_PATHS[id],
      platformMode: platformModeForCubeFace(id),
    };
  });
}

/** Iterate every cube face (geometry order). */
export function forEachCubeFace(fn: (face: CubeFace, index: number) => void): void {
  listCubeFaces().forEach(fn);
}

/** Face at a BoxGeometry material index (0–5). */
export function cubeFaceAtGeometryIndex(index: number): CubeFace | null {
  const id = CUBE_GEOMETRY_FACE_ORDER[index];
  if (!id) return null;
  return listCubeFaces().find((f) => f.id === id) ?? null;
}

function actionForFace(id: FeatureId, productName: string): string {
  switch (id) {
    case "seeds":
      return `Upload a brief for “${productName}” and spawn the app suite.`;
    case "api":
      return `Define and ship the “${productName}” API — prompt, schema, evals, deploy.`;
    case "hardware":
      return `Sketch “${productName}”, run BUILD, source BOM, and hybridize schematics.`;
    case "play":
      return `Compose stems / sonic branding that matches “${productName}”.`;
    case "orbit":
      return `Launch “${productName}” — SEO pages, indexing, and growth automation.`;
    case "security":
      return `Seal “${productName}” sketches and mint the protection / court pack.`;
  }
}

/**
 * Build a six-step walkthrough that takes **one product** through every cube face.
 * Use for guided tours, QA checklists, onboarding, and deep-link scripts.
 */
export function buildMasterProductJourney(input: {
  productName: string;
  productBrief?: string;
  /** Override step order (default: MASTER_BUS_JOURNEY_ORDER) */
  faceOrder?: readonly FeatureId[];
}): MasterProductJourney {
  const productName = input.productName.trim();
  if (!productName) throw new Error("productName is required");

  const order = input.faceOrder ?? MASTER_BUS_JOURNEY_ORDER;
  if (order.length !== 6 || new Set(order).size !== 6) {
    throw new Error("faceOrder must contain exactly six unique cube faces");
  }

  const faces = listCubeFaces();
  const byId = new Map(faces.map((f) => [f.id, f]));

  const steps: CubeFaceStep[] = order.map((faceId, i) => {
    const face = byId.get(faceId);
    if (!face) throw new Error(`Unknown face in journey: ${faceId}`);
    return {
      step: i + 1,
      faceId,
      geometryIndex: face.geometryIndex,
      shortLabel: face.shortLabel,
      name: face.name,
      href: face.href,
      platformMode: face.platformMode,
      role: FACE_ROLES[faceId],
      action: actionForFace(faceId, productName),
    };
  });

  return {
    productName,
    productBrief:
      input.productBrief?.trim() ||
      `One product routed through all six ZZAI cube faces — Seeds, Signal, Crest, Play, Orbit, Protect — to Master bus out.`,
    steps,
    masterBusOut: `Deploy / launch “${productName}” with API live, hardware sourced, audio branded, traffic running, and IP sealed.`,
  };
}

/** Flat list of hrefs in master-bus order for smoke tests and crawlers. */
export function masterProductWalkthroughHrefs(journey: MasterProductJourney): string[] {
  return journey.steps.map((s) => s.href);
}
