import type { ColorSwatch, ProtectRequest, ScientificAxes, DigitalDisclosure } from "./types";

export const DIGITAL_FILE_ACCEPT =
  ".txt,.md,.json,.js,.ts,.tsx,.py,.java,.go,.rs,.zip,.pdf,.html,.css,.xml,.yaml,.yml";

const ROLES: ColorSwatch["role"][] = [
  "dominant",
  "secondary",
  "accent",
  "shadow",
  "highlight",
];

/** Derive a visual palette from a content hash (for seal chamber + coin traits). */
export function paletteFromContentHash(contentHash: string): ColorSwatch[] {
  const bytes = contentHash.match(/.{2}/g)?.slice(0, 15) || [];
  const swatches: ColorSwatch[] = [];
  for (let i = 0; i < 5; i++) {
    const r = parseInt(bytes[i * 3] || "5b", 16);
    const g = parseInt(bytes[i * 3 + 1] || "8d", 16);
    const b = parseInt(bytes[i * 3 + 2] || "a8", 16);
    swatches.push({
      hex: `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`,
      role: ROLES[i] || "accent",
      weight: Number((0.35 - i * 0.05).toFixed(3)),
    });
  }
  const total = swatches.reduce((s, c) => s + c.weight, 0) || 1;
  return swatches.map((c) => ({ ...c, weight: Number((c.weight / total).toFixed(3)) }));
}

export function buildDigitalCanonicalPayload(input: {
  title: string;
  description: string;
  disclosure: DigitalDisclosure;
}): string {
  return JSON.stringify({
    title: input.title.trim(),
    description: input.description.trim(),
    disclosure: input.disclosure,
    artifacts: (input.disclosure.artifacts || []).map((a) => ({
      fileName: a.fileName,
      contentHash: a.contentHash.toLowerCase(),
    })),
  });
}

export function buildDigitalScientificAxes(
  input: ProtectRequest,
  disclosure: DigitalDisclosure,
): ScientificAxes {
  const logicSummary = [
    `Problem: ${disclosure.problemStatement}`,
    `Novel steps: ${disclosure.novelSteps}`,
    `Technical effect: ${disclosure.technicalEffect}`,
    input.formVariable,
  ]
    .filter(Boolean)
    .join(" · ");

  const interfaceSummary = [
    `Data structures: ${disclosure.dataStructures}`,
    `API / surface: ${disclosure.apiSurface}`,
    `User flow: ${disclosure.userFlow}`,
    input.paletteVariable,
  ]
    .filter(Boolean)
    .join(" · ");

  const artifactNote =
    disclosure.artifacts?.length ?
      `Attached artifacts (${disclosure.artifacts.length}): ${disclosure.artifacts.map((a) => `${a.fileName}@${a.contentHash.slice(0, 8)}`).join(", ")}`
    : "Text-only digital disclosure (no separate artifact files)";

  return {
    axisA: {
      name: "logic_algorithm",
      label: "Logic / algorithm axis",
      domain: "information",
      summary: logicSummary.slice(0, 1200),
    },
    axisB: {
      name: "data_interface",
      label: "Data / interface axis",
      domain: "information",
      summary: interfaceSummary.slice(0, 1200),
      palette: input.palette,
    },
    couplingPrinciple:
      "Two-variable digital hybridization: executable logic (axis A) couples with data structures and interface contracts (axis B) to define a non-separable software invention fingerprint for evidentiary disclosure.",
    measurableClaims: [
      `Logic axis locked: ${disclosure.problemStatement.slice(0, 180)}`,
      `Interface axis locked: ${disclosure.apiSurface.slice(0, 180)}`,
      `Invention class: ${disclosure.inventionType}`,
      artifactNote,
      `Content hash (SHA-256): ${input.contentHash}`,
    ],
  };
}

export const INVENTION_TYPE_LABELS: Record<DigitalDisclosure["inventionType"], string> = {
  software: "Software / application",
  algorithm: "Algorithm / method",
  saas_ui: "SaaS / web UI",
  mobile_app: "Mobile app",
  api: "API / integration",
  hardware_firmware: "Hardware + firmware",
  other: "Other digital invention",
};
