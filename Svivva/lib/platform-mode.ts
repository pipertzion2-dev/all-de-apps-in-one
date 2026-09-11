import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

export type PlatformMode = "digital" | "physical";

const PHYSICAL_PATH_PREFIXES = ["/dashboard/hardware-builder", "/dashboard/hypothesis-hardware"];
const DIGITAL_PATH_PREFIXES = ["/dashboard/api-builder", "/dashboard/hypothesis"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Infer Signal/Crest from the URL — null on shared routes (Play, Seeds, Orbit, …). */
export function platformModeFromPath(pathname: string): PlatformMode | null {
  if (PHYSICAL_PATH_PREFIXES.some((p) => matchesPrefix(pathname, p))) return "physical";
  if (DIGITAL_PATH_PREFIXES.some((p) => matchesPrefix(pathname, p))) return "digital";
  return null;
}

/** Cube faces on the Crest or Signal bus flip platform mode; others leave it unchanged. */
export function platformModeForCubeFace(id: FeatureId): PlatformMode | null {
  if (id === "hardware") return "physical";
  if (id === "api") return "digital";
  return null;
}

/** UI labels for the ZZAI crest/glitch duality (maps onto digital/physical product modes). */
export const PLATFORM_MODE_LABELS = {
  digital: {
    short: "Signal",
    long: "Signal — Prompt to API",
    subtitle: "Prompt to API",
  },
  physical: {
    short: "Crest",
    long: "Crest — Manufacturing",
    subtitle: "Manufacturing",
  },
} as const;
