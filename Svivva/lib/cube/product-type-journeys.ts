import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildCubeFaceCombo, type MasterProductJourney } from "./cube-faces";

export type ProductTypeOptionalStep = {
  faceId: FeatureId;
  /** Shown as a toggle label, e.g. "Lights up or has an app?" */
  when: string;
};

export type ProductTypeTemplate = {
  id: string;
  label: string;
  emoji: string;
  tagline: string;
  exampleProduct: string;
  /** Core cube faces for this product category, in recommended order. */
  faceOrder: readonly FeatureId[];
  optionalSteps?: readonly ProductTypeOptionalStep[];
};

export const PRODUCT_TYPE_TEMPLATES: readonly ProductTypeTemplate[] = [
  {
    id: "fashion",
    label: "Fashion & apparel",
    emoji: "👗",
    tagline: "Patent the design, manufacture the run, add firmware if it glows.",
    exampleProduct: "Light-up runway jacket",
    faceOrder: ["security", "hardware"],
    optionalSteps: [
      {
        faceId: "api",
        when: "Lights up, connects to an app, or has smart fabric",
      },
    ],
  },
  {
    id: "iot",
    label: "IoT & sensors",
    emoji: "📡",
    tagline: "Brief → API → enclosure → launch → seal IP.",
    exampleProduct: "Smart soil monitor",
    faceOrder: ["seeds", "api", "hardware", "orbit", "security"],
  },
  {
    id: "saas",
    label: "SaaS & digital",
    emoji: "💻",
    tagline: "Spawn apps from a brief, ship the API, grow traffic.",
    exampleProduct: "AI compliance copilot",
    faceOrder: ["seeds", "api", "orbit"],
  },
  {
    id: "music",
    label: "Music & audio brand",
    emoji: "🎵",
    tagline: "Stems and sonic identity, then launch and protect the brand.",
    exampleProduct: "Artist sample pack",
    faceOrder: ["play", "orbit", "security"],
  },
  {
    id: "hardware",
    label: "Physical product",
    emoji: "🔧",
    tagline: "Schematics, BOM, suppliers — then protect and launch.",
    exampleProduct: "Portable espresso maker",
    faceOrder: ["hardware", "security", "orbit"],
    optionalSteps: [
      {
        faceId: "api",
        when: "Needs companion app or cloud dashboard",
      },
    ],
  },
  {
    id: "full-stack",
    label: "Full six-face ship",
    emoji: "🎛️",
    tagline: "Every cube face — Seeds through Protect to Master bus out.",
    exampleProduct: "Connected wellness device",
    faceOrder: ["seeds", "api", "hardware", "play", "orbit", "security"],
  },
] as const;

export function getProductTypeTemplate(id: string): ProductTypeTemplate | undefined {
  return PRODUCT_TYPE_TEMPLATES.find((t) => t.id === id);
}

/** Resolve face order for a template, optionally including toggled optional steps. */
export function resolveProductTypeFaceOrder(
  template: ProductTypeTemplate,
  enabledOptionalFaceIds: Iterable<FeatureId> = [],
): FeatureId[] {
  const enabled = new Set(enabledOptionalFaceIds);
  const order: FeatureId[] = [...template.faceOrder];
  for (const opt of template.optionalSteps ?? []) {
    if (enabled.has(opt.faceId) && !order.includes(opt.faceId)) {
      order.push(opt.faceId);
    }
  }
  return order;
}

export function buildProductTypeJourney(
  template: ProductTypeTemplate,
  options: {
    productName?: string;
    enabledOptionalFaceIds?: Iterable<FeatureId>;
  } = {},
): MasterProductJourney {
  const productName = options.productName?.trim() || template.exampleProduct;
  const faceOrder = resolveProductTypeFaceOrder(template, options.enabledOptionalFaceIds);

  return buildCubeFaceCombo({
    productName,
    productBrief: template.tagline,
    faceOrder,
    masterBusOut: `${template.label}: ${faceOrder.length} cube face${faceOrder.length === 1 ? "" : "s"} — ${template.tagline}`,
  });
}
