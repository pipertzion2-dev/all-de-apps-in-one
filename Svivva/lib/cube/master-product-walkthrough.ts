/**
 * Master product walkthrough — one product through all six cube faces.
 *
 * Import this file when you need the canonical six-face journey, JSON export,
 * or a printable checklist. Example:
 *
 *   import { DEFAULT_MASTER_PRODUCT_JOURNEY, exportWalkthroughJson } from "@/lib/cube";
 *   console.log(exportWalkthroughJson(DEFAULT_MASTER_PRODUCT_JOURNEY));
 */

import { buildMasterProductJourney, type MasterProductJourney } from "./cube-faces";

/** Example product used in docs, QA, and the cube walkthrough tool. */
export const DEFAULT_PRODUCT_NAME = "Smart Soil Monitor";

export const DEFAULT_PRODUCT_BRIEF =
  "IoT soil sensor with API dashboard, sealed enclosure, launch SEO, brand audio sting, and sketch-to-seal IP before manufacture.";

/** Ready-made journey — all six cube faces for one product. */
export const DEFAULT_MASTER_PRODUCT_JOURNEY: MasterProductJourney = buildMasterProductJourney({
  productName: DEFAULT_PRODUCT_NAME,
  productBrief: DEFAULT_PRODUCT_BRIEF,
});

export function exportWalkthroughJson(
  journey: MasterProductJourney = DEFAULT_MASTER_PRODUCT_JOURNEY,
): string {
  return JSON.stringify(journey, null, 2);
}

export function exportWalkthroughMarkdown(
  journey: MasterProductJourney = DEFAULT_MASTER_PRODUCT_JOURNEY,
): string {
  const lines = [
    `# ${journey.productName} — six-face cube walkthrough`,
    "",
    journey.productBrief,
    "",
    `**Master bus out:** ${journey.masterBusOut}`,
    "",
    "## Steps",
    "",
  ];

  for (const s of journey.steps) {
    lines.push(
      `### ${s.step}. ${s.shortLabel} — ${s.name}`,
      "",
      `- **Route:** [\`${s.href}\`](${s.href})`,
      `- **Role:** ${s.role}`,
      `- **Action:** ${s.action}`,
      s.platformMode
        ? `- **Platform mode:** ${s.platformMode === "physical" ? "Crest" : "Signal"}`
        : "",
      "",
    );
  }

  return lines.filter(Boolean).join("\n");
}

/** Run a callback for each step (sync). Handy for tests and scripts. */
export function walkAllCubeFacesForProduct(
  fn: (step: MasterProductJourney["steps"][number], journey: MasterProductJourney) => void,
  journey: MasterProductJourney = DEFAULT_MASTER_PRODUCT_JOURNEY,
): void {
  for (const step of journey.steps) {
    fn(step, journey);
  }
}
