/** Safe filename for DAW drag-and-drop (e.g. `01_melody_counterpoint.mid`). */
export function stemMidiFilename(name: string, role?: string, index?: number): string {
  const slug =
    name
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase() || "stem";
  const roleSlug = role ? `${role.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase()}_` : "";
  const idx = index != null ? `${String(index + 1).padStart(2, "0")}_` : "";
  return `${idx}${roleSlug}${slug}.mid`;
}
