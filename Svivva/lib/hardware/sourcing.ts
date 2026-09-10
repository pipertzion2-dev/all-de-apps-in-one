import { z } from "zod";

export const manufacturerSchema = z.object({
  name: z.string().min(1),
  website: z.string().optional().default(""),
  specialty: z.string().optional().default(""),
  fit: z.string().optional().default(""),
  estimatedCost: z.string().optional().default(""),
  moq: z.string().optional().default(""),
  location: z.string().optional().default(""),
  leadTime: z.string().optional().default(""),
});

export const materialSupplierSchema = z.object({
  material: z.string().min(1),
  supplier: z.string().min(1),
  website: z.string().optional().default(""),
  priceRange: z.string().optional().default(""),
});

export const platformSchema = z.object({
  name: z.string().min(1),
  website: z.string().optional().default(""),
  type: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export const sourcingResultSchema = z.object({
  manufacturers: z.array(manufacturerSchema).default([]),
  materialSuppliers: z.array(materialSupplierSchema).default([]),
  platforms: z.array(platformSchema).default([]),
  recommendation: z.string().optional().default(""),
});

export type SourcingResult = z.infer<typeof sourcingResultSchema>;

export function buildSourcingPrompt(data: {
  productName: string;
  productDescription: string;
  category: string;
  materials: string[];
  manufacturingMethod: string;
  budgetRange: number;
  requirements: string[];
  sketchNotes: string;
  hasSketch: boolean;
}): string {
  return `Product: "${data.productName}"
Description: ${data.productDescription || "N/A"}
Category: ${data.category || "General"}
Materials: ${data.materials.join(", ") || "Not specified"}
Manufacturing Method: ${data.manufacturingMethod || "Not specified"}
Budget: $${data.budgetRange.toLocaleString()}
Requirements: ${data.requirements.join(", ") || "None"}
${data.sketchNotes ? `Sketch observations: ${data.sketchNotes}` : ""}

Return a JSON object with this exact structure:
{
  "manufacturers": [
    {
      "name": "Company Name",
      "website": "https://...",
      "specialty": "What they're best at",
      "fit": "Why they fit this product",
      "estimatedCost": "$X,XXX - $X,XXX",
      "moq": "Minimum order quantity",
      "location": "Country/Region",
      "leadTime": "X-X weeks"
    }
  ],
  "materialSuppliers": [
    {
      "material": "Material name",
      "supplier": "Supplier name",
      "website": "https://...",
      "priceRange": "$X per unit/kg"
    }
  ],
  "platforms": [
    {
      "name": "Platform name",
      "website": "https://...",
      "type": "Marketplace/Service",
      "description": "What it offers"
    }
  ],
  "recommendation": "A brief overall recommendation for the best manufacturing approach"
}

Include at least 3 manufacturers, 2 material suppliers, and 2 platforms when possible.${data.hasSketch ? " Reference the attached product sketch when recommending suppliers." : ""}`;
}

export function parseSourcingResult(raw: string): SourcingResult {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const json = JSON.parse(cleaned);
  const parsed = sourcingResultSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Could not parse supplier recommendations.");
  }
  if (
    parsed.data.manufacturers.length === 0 &&
    parsed.data.materialSuppliers.length === 0 &&
    parsed.data.platforms.length === 0
  ) {
    throw new Error("No suppliers were returned — try again with more product detail.");
  }
  return parsed.data;
}
