/** Offline sketch/photo concept hints — used when vision LLM is unavailable. */
export function localSketchConceptsFromFilename(fileName: string, mimeType: string): string[] {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const concepts = new Set<string>();
  if (mimeType.startsWith("image/")) concepts.add("2d visual disclosure sheet");
  for (const token of base.toLowerCase().split(/\s+/)) {
    if (token.length > 3) concepts.add(token);
  }
  concepts.add("user-uploaded sketch or photograph");
  return [...concepts].slice(0, 8);
}

export const SKETCH_VISION_SYSTEM = `You analyze invention sketches/photos for Cube Protect Prior-Art Radar and 3D Copilot.
Return JSON only: { "concepts": string[], "suggestedComponents": Array<{ "name": string, "shape": "box"|"cylinder"|"sphere", "material": string, "notes": string }>, "searchQueries": string[] }.
Never invent dimensions, materials, or test results not visible. Label uncertainty. Do not claim patentability.`;
