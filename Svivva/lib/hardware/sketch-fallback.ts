import type { SketchAnalysis } from "./sketch-analysis";

/** Keyword → product category for heuristic sketch analysis when AI is unavailable. */
const CATEGORY_HINTS: { pattern: RegExp; category: string }[] = [
  { pattern: /watch|wearable|bracelet|smartwatch|wrist/i, category: "Wearable / Consumer Electronics" },
  { pattern: /jewel|ring|necklace|diamond|gold|silver/i, category: "Jewelry / Luxury Goods" },
  { pattern: /tool|drill|wrench|hardware kit/i, category: "Industrial Tool" },
  { pattern: /sensor|iot|device|pcb|circuit/i, category: "Consumer Electronics" },
  { pattern: /furniture|chair|table|lamp|light/i, category: "Home Goods" },
  { pattern: /toy|game|play/i, category: "Consumer Product" },
];

const DEFAULT_REQUIREMENTS = ["Durability", "Ergonomic design", "Manufacturability"];
const DEFAULT_MATERIALS = ["Aluminum", "Plastic (ABS)", "Stainless steel"];

function inferCategory(text: string): string {
  for (const { pattern, category } of CATEGORY_HINTS) {
    if (pattern.test(text)) return category;
  }
  return "Consumer Electronics";
}

function inferManufacturingMethod(category: string, text: string): string {
  const lower = `${category} ${text}`.toLowerCase();
  if (/jewel|watch|luxury|diamond/.test(lower)) return "CNC Machining + Assembly";
  if (/pcb|circuit|sensor|iot/.test(lower)) return "PCB Assembly + Injection Molding";
  if (/prototype|one-off|custom/.test(lower)) return "3D Printing";
  if (/furniture|large|enclosure/.test(lower)) return "CNC Machining";
  return "3D Printing (prototype) → Injection Molding (scale)";
}

function inferBudget(category: string): number {
  const lower = category.toLowerCase();
  if (/jewel|luxury/.test(lower)) return 25000;
  if (/wearable|consumer/.test(lower)) return 8000;
  if (/industrial|tool/.test(lower)) return 12000;
  return 5000;
}

function inferTargetUsers(category: string): string {
  const lower = category.toLowerCase();
  if (/jewel|luxury|watch|wearable/.test(lower)) {
    return "Style-conscious consumers and early adopters seeking premium physical products";
  }
  if (/industrial|tool/.test(lower)) return "Professionals and tradespeople";
  return "Everyday consumers and enthusiasts";
}

/**
 * Build a starter brief from user notes when vision AI is unavailable (quota, no keys, etc.).
 * The uploaded sketch image is still kept in the UI — user refines fields in BUILD steps.
 */
export function buildSketchAnalysisFallback(notes: string): SketchAnalysis {
  const cleaned = notes.trim().replace(/\s+/g, " ");
  const hintText = cleaned || "uploaded hardware sketch";
  const category = inferCategory(hintText);
  const productName =
    cleaned.slice(0, 80) ||
    (category.includes("Wearable") ? "Wearable Concept" : "Hardware Concept");

  const isLuxury = /jewel|diamond|luxury|watch/i.test(hintText);
  const materials = isLuxury
    ? ["Sapphire crystal", "Stainless steel", "Precious metal accents", "Premium leather or silicone band"]
    : [...DEFAULT_MATERIALS];

  const requirements = isLuxury
    ? ["Premium finish", "Water resistance", "Comfortable wear", "Reliable assembly"]
    : [...DEFAULT_REQUIREMENTS];

  return {
    productName,
    productDescription: cleaned
      ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)} — physical product concept from your uploaded sketch. We pre-filled this starter brief; refine each BUILD step for accuracy.`
      : "Physical product concept from your uploaded sketch. We pre-filled a starter brief — refine each BUILD step with dimensions, materials, and goals.",
    productCategory: category,
    targetUsers: inferTargetUsers(category),
    useCases: cleaned
      ? `Primary use cases inferred from your notes: ${cleaned}. Add specific scenarios in the BUILD steps.`
      : "Define primary jobs-to-be-done in the BUILD steps (daily use, professional tasks, gifting, etc.).",
    requirements,
    materials,
    manufacturingMethod: inferManufacturingMethod(category, hintText),
    estimatedBudget: inferBudget(category),
    sketchNotes: cleaned
      ? `Heuristic pre-fill from your notes (AI quota unavailable): ${cleaned}. Review dimensions, connectors, and assembly details against your sketch.`
      : "Heuristic pre-fill — AI vision was unavailable. Review your sketch and add labeled dimensions, components, and assembly hints in the BUILD steps.",
  };
}
