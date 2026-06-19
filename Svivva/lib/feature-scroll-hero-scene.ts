import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { buildAdvancedHeroScene } from "@/lib/feature-advanced-hero-scene";

export type ScrollHeroScene = {
  root: import("three").Group;
  tick: (t: number, scroll: number, mouse: { x: number; y: number }) => void;
};

/** Hero scroll band — advanced glass/metal meshes + bloom petals (not wireframe lines). */
export function buildGraphicScrollHeroScene(
  variant: FeatureId,
  palette: GraphicPalette,
): ScrollHeroScene {
  const hero = buildAdvancedHeroScene(variant, palette);
  return { root: hero.root, tick: hero.tick };
}
