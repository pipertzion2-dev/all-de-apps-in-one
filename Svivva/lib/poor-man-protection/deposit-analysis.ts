import { z } from "zod";

export const depositAnalysisSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(20).max(4000),
  chronology: z.object({
    medium: z.string().min(2).max(200),
    iterationNotes: z.string().min(8).max(2000),
    priorDisclosure: z.string().max(1000).optional(),
  }),
  formInterrogation: z.object({
    silhouette: z.string().min(8).max(2000),
    hierarchy: z.string().min(8).max(2000),
    negativeSpace: z.string().min(8).max(2000),
    distinctiveMarks: z.string().min(8).max(2000),
  }),
  paletteInterrogation: z.object({
    emotionalIntent: z.string().min(8).max(2000),
    contrastStrategy: z.string().min(8).max(2000),
    forbiddenColors: z.string().max(1000),
    lightingContext: z.string().max(1000),
  }),
  suggestedHybridMode: z
    .enum(["complementary", "antagonistic", "emergent", "biomimetic"])
    .optional(),
});

export type DepositAnalysis = z.infer<typeof depositAnalysisSchema>;

export const DEPOSIT_ANALYSIS_SYSTEM = `You are an IP evidence specialist reading a deposited creative work (sketch, product drawing, artwork, hardware concept, or patent figure).
Extract everything visible for an evidentiary prior-art package — form, color intent, and descriptive specificity courts expect.
Return JSON only — no markdown fences.`;

export function buildDepositAnalysisPrompt(paletteHint?: string, notes?: string): string {
  return `Analyze the uploaded work and return a JSON object with this exact structure:
{
  "title": "Short descriptive title for the work",
  "description": "2-5 sentences: subject matter, style, purpose, and what makes this work distinctive as prior art",
  "chronology": {
    "medium": "e.g. Digital sketch, ink on paper scan, CAD render, napkin drawing photo",
    "iterationNotes": "What the image shows about design decisions, views, labels, or iteration state",
    "priorDisclosure": "none — or describe if anything suggests prior public exposure"
  },
  "formInterrogation": {
    "silhouette": "Primary shape language and silhouette — be specific and measurable",
    "hierarchy": "Visual hierarchy: what the eye hits first, second, third",
    "negativeSpace": "How negative space participates in the composition",
    "distinctiveMarks": "Marks, proportions, or details a copyist would need to recreate"
  },
  "paletteInterrogation": {
    "emotionalIntent": "Emotional or brand intent read from colors and tone",
    "contrastStrategy": "Contrast and color relationships (light/dark, warm/cool, accent usage)",
    "forbiddenColors": "Colors deliberately absent or excluded from the palette",
    "lightingContext": "Lighting or viewing context implied by the image"
  },
  "suggestedHybridMode": "emergent | complementary | antagonistic | biomimetic — best fit for coupling form + spectral axes"
}
Be specific and evidentiary. If ambiguous, state reasonable assumptions.${paletteHint ? `\n\nExtracted palette fingerprint: ${paletteHint}` : ""}${
    notes?.trim() ? `\n\nCreator notes: ${notes.trim()}` : ""
  }`;
}
