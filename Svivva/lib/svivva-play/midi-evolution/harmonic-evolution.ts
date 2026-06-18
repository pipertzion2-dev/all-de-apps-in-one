/** Emotional distant-equivalent reharm map (not mere transposition). */
export const EMOTIONAL_HARMONIC_MAP: Record<string, string> = {
  Cm9: "AbMaj9(#11)",
  "Cm11": "AbMaj9(#11)",
  BbMaj7: "DbMaj9(#11)",
  "Bbmaj7": "DbMaj9(#11)",
  Gm11: "BMaj9(#11)",
  EbMaj7: "F#m11",
  "Ebmaj7": "F#m11",
  AbMaj7: "Emaj13",
  "Abmaj7": "Emaj13",
  Fmaj9: "Am11",
  Dm9: "BbMaj13",
  Am7: "F#m11",
  C9: "EbMaj13",
  G7: "DbMaj9(#11)",
  Ebm7: "BMaj9(#11)",
  DbMaj7: "F#m11",
};

export function emotionalReharmSymbol(symbol: string): string {
  const direct = EMOTIONAL_HARMONIC_MAP[symbol];
  if (direct) return direct;
  const normalized = symbol.replace(/\s+/g, "");
  for (const [from, to] of Object.entries(EMOTIONAL_HARMONIC_MAP)) {
    if (from.replace(/\s+/g, "") === normalized) return to;
  }
  return symbol;
}

export function buildEmotionalChordTimeline(
  sourceSymbols: string[],
  sectionPalette: string[],
  bars: number,
): string[] {
  const out: string[] = [];
  for (let b = 0; b < bars; b++) {
    const src = sourceSymbols[b % Math.max(1, sourceSymbols.length)];
    const emotional = src ? emotionalReharmSymbol(src) : sectionPalette[b % sectionPalette.length]!;
    out.push(sectionPalette[b % sectionPalette.length] ?? emotional);
  }
  return out;
}
