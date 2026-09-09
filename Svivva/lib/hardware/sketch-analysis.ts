import { z } from "zod";

export const sketchAnalysisSchema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(2000),
  productCategory: z.string().max(200),
  targetUsers: z.string().max(1000),
  useCases: z.string().max(1000),
  requirements: z.array(z.string()).max(12),
  materials: z.array(z.string()).max(12),
  manufacturingMethod: z.string().max(200),
  estimatedBudget: z.number().min(500).max(500000),
  sketchNotes: z.string().max(2000),
});

export type SketchAnalysis = z.infer<typeof sketchAnalysisSchema>;

export const SKETCH_ANALYSIS_SYSTEM = `You are a hardware product engineer reading a user's sketch (photo, scan, or napkin drawing).
Extract everything visible or reasonably inferable for manufacturing planning.
Return JSON only — no markdown fences.`;

export function buildSketchAnalysisPrompt(): string {
  return `Analyze the uploaded hardware sketch and return a JSON object with this exact structure:
{
  "productName": "Short working name for the product",
  "productDescription": "2-4 sentences describing what the sketch shows, form factor, and purpose",
  "productCategory": "e.g. Consumer Electronics, Home Goods, Wearable, Industrial Tool",
  "targetUsers": "Who would use this",
  "useCases": "Primary scenarios / jobs-to-be-done",
  "requirements": ["Durability", "Lightweight", etc. — pick from common hardware requirements you can infer],
  "materials": ["Aluminum", "Plastic (ABS)", etc. — infer likely materials from the sketch],
  "manufacturingMethod": "Best-fit method e.g. 3D Printing, CNC Machining, Injection Molding",
  "estimatedBudget": 5000,
  "sketchNotes": "Technical observations: dimensions if labeled, components, connectors, assembly hints, open questions"
}
Be practical. If the sketch is ambiguous, state assumptions in sketchNotes. estimatedBudget is USD prototype-to-small-batch range.`;
}

export function normalizeToOptions(
  extracted: string[],
  options: string[],
): string[] {
  const lowerOptions = options.map((o) => o.toLowerCase());
  const matched = new Set<string>();
  for (const item of extracted) {
    const lower = item.toLowerCase();
    const idx = lowerOptions.findIndex(
      (o) => o === lower || o.includes(lower) || lower.includes(o),
    );
    if (idx >= 0) matched.add(options[idx]!);
    else matched.add(item.slice(0, 80));
  }
  return [...matched].slice(0, 8);
}

export function matchManufacturingMethod(
  extracted: string,
  methods: string[],
): string {
  const lower = extracted.toLowerCase();
  const hit = methods.find(
    (m) =>
      m.toLowerCase() === lower ||
      lower.includes(m.toLowerCase()) ||
      m.toLowerCase().includes(lower),
  );
  return hit || extracted.slice(0, 80) || methods[0] || "3D Printing";
}
