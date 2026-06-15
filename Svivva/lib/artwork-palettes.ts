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

export const GRAPHIC_PALETTES: Record<FeatureId, GraphicPalette> = {
  play: {
    primary: 0x7c5cbf,
    secondary: 0x5ba8a0,
    tertiary: 0xd782b2,
    highlight: 0xc48fd4,
    wire: 0x9b7fd4,
    lineOpacity: 0.48,
    patternOpacity: 0.22,
  },
  seeds: {
    primary: 0x5ba8a0,
    secondary: 0x6b2c4a,
    tertiary: 0xd4a85a,
    highlight: 0x9b7fd4,
    wire: 0x5a9e6a,
    lineOpacity: 0.46,
    patternOpacity: 0.2,
  },
  orbit: {
    primary: 0x3d8a82,
    secondary: 0xc06010,
    tertiary: 0xe8a040,
    highlight: 0x5b8fd4,
    wire: 0x5ba8a0,
    lineOpacity: 0.44,
    patternOpacity: 0.18,
  },
  security: {
    primary: 0x6b2c4a,
    secondary: 0x8a5a9e,
    tertiary: 0x7b4d9a,
    highlight: 0x9b3a5e,
    wire: 0x5ba8a0,
    lineOpacity: 0.5,
    patternOpacity: 0.2,
  },
  api: {
    primary: 0x9b4d6e,
    secondary: 0xd782b2,
    tertiary: 0xbe185d,
    highlight: 0xc48fd4,
    wire: 0x9b4d6e,
    lineOpacity: 0.35,
    patternOpacity: 0.2,
  },
  hardware: {
    primary: 0xb5547a,
    secondary: 0x5a9e6a,
    tertiary: 0xc04040,
    highlight: 0xd4a85a,
    wire: 0x8a5a9e,
    lineOpacity: 0.36,
    patternOpacity: 0.2,
  },
};

export function getGraphicPalette(variant: FeatureId): GraphicPalette {
  return GRAPHIC_PALETTES[variant];
}
