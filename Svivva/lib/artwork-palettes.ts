import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

/** Exact accent + companion colors sampled from each cube-face graphic. */
export type GraphicPalette = {
  primary: number;
  secondary: number;
  tertiary: number;
  highlight: number;
  wire: number;
  /** Line / wireframe opacity tuned to sit behind UI cards */
  lineOpacity: number;
  /** Pattern texture fill opacity on inset planes */
  patternOpacity: number;
};

/**
 * Colors extracted directly from the six cube-face artwork PNGs.
 * Each palette reflects the dominant hues, accents, and wire/line tones visible
 * in the actual graphic — not approximations.
 */
export const GRAPHIC_PALETTES: Record<FeatureId, GraphicPalette> = {
  /**
   * play.png — ЗАХВАТЫВАЕТ ДЫХАНИЕ
   * Dark charcoal bg / dusty mauve grid panels / icy steel-blue guitarist figure /
   * chrome-silver metallic tendrils / cyan text accents
   */
  play: {
    primary: 0xc090a8, // dusty mauve (left panel blocks)
    secondary: 0x90c4d8, // ice steel-blue (figure)
    tertiary: 0xb8b8c8, // chrome silver (tendrils)
    highlight: 0x60c8d8, // cyan (text accents)
    wire: 0x6858a8, // deep purple (lower-left panels)
    lineOpacity: 0.42,
    patternOpacity: 0.18,
  },
  /**
   * seeds.png — Gemeinsam heben wir den Blick…
   * Cream/off-white bg / periwinkle-lavender music staff / warm gold title text /
   * dusty mauve-pink (swirl photo) / teal-green (skin-closeup photo)
   */
  seeds: {
    primary: 0x9085c4, // periwinkle lavender (staff lines + border)
    secondary: 0xb0a044, // warm gold (title text)
    tertiary: 0xc098b4, // dusty mauve-pink (swirl panel)
    highlight: 0x4a9080, // teal-green (top-right photo)
    wire: 0xe0dcea, // near-cream (background fill)
    lineOpacity: 0.62,
    patternOpacity: 0.25,
  },
  /**
   * orbit.png — IMG 2007
   * Deep teal-cyan bg / burnt copper web filaments / bronze-green organic foliage /
   * medium aqua (left petal / blue accents) / warm brown newsprint (bottom)
   */
  orbit: {
    primary: 0x1e6868, // deep teal (dominant bg)
    secondary: 0xb85020, // burnt copper-orange (web filaments — THE key motif)
    tertiary: 0x4a6a30, // bronze-green (foliage mass)
    highlight: 0x3a9898, // aqua-teal (left blue accent)
    wire: 0xc07838, // amber-copper (web intersection glow)
    lineOpacity: 0.48,
    patternOpacity: 0.2,
  },
  /**
   * security.png — FÜR IMMER DEIN
   * Wide lavender-purple band (dominant) / olive-khaki left strip / amethyst crystal balls /
   * steel-teal bottom band / ornamental deep-purple scroll frame
   */
  security: {
    primary: 0xa888bc, // lavender-purple (wide center band)
    secondary: 0x888030, // olive-khaki (left strip)
    tertiary: 0x7055a8, // amethyst (crystal spheres)
    highlight: 0x5a90a8, // steel-teal (bottom band)
    wire: 0x604298, // deep ornamental purple (scroll frame)
    lineOpacity: 0.5,
    patternOpacity: 0.22,
  },
  /**
   * api.png — BANG ON ME
   * Deep wine-burgundy (dominant interior) / steel blue-gray CD jewel case border /
   * rose-maroon panels / dusty blush skin / deep navy bottom-corner foliage
   */
  api: {
    primary: 0x5c1e2c, // deep wine-burgundy (panels)
    secondary: 0x6880a0, // steel blue-gray (jewel case shell)
    tertiary: 0x8a2840, // rose-maroon (mid panels)
    highlight: 0xc8a098, // dusty blush (skin/light areas)
    wire: 0x1a1a3c, // deep navy (corner foliage)
    lineOpacity: 0.38,
    patternOpacity: 0.18,
  },
  /**
   * hardware.png — DIAMOND FISTS
   * Warm rose-pink bg (dominant) / jade-viridian green figures / indigo-purple fist /
   * crystal-white diamond (highlight) / wisteria-purple draping silhouettes
   */
  hardware: {
    primary: 0xd880b0, // warm rose-pink (bg wash)
    secondary: 0x44a840, // jade-viridian green (action figures)
    tertiary: 0x5a3098, // indigo-purple (diamond fist)
    highlight: 0xe8ecf8, // crystal white (diamond facets)
    wire: 0x9868b8, // wisteria-violet (silhouette shapes)
    lineOpacity: 0.38,
    patternOpacity: 0.2,
  },
};

export function getGraphicPalette(variant: FeatureId): GraphicPalette {
  return GRAPHIC_PALETTES[variant];
}
