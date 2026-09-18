import * as THREE from "three";
import {
  DIRT_ZONES,
  SUBSTANCE_COLORS,
  zoneStainColor,
  type DirtZone,
  type ShoeCondition,
  type SubstanceKind,
  type ZoneDirt,
} from "./dirt-system";

/** Visible dirt steps — new splat every ~12% zone fill. */
export const DIRT_INCREMENT_STEP = 12;

export function dirtIncrementLevel(amount: number): number {
  if (amount < 3) return 0;
  return Math.min(8, Math.floor(amount / DIRT_INCREMENT_STEP) + 1);
}

/** Rear-view panel layout (normalized x/y on the heel-facing plane). */
const ZONE_REAR_LAYOUT: Record<
  DirtZone,
  { x: number; y: number; rx: number; ry: number; rot?: number }
> = {
  outsole: { x: 0, y: 0.08, rx: 0.92, ry: 0.11 },
  heel: { x: 0, y: 0.2, rx: 0.62, ry: 0.16 },
  midsole: { x: 0, y: 0.38, rx: 0.88, ry: 0.14 },
  leftSide: { x: -0.38, y: 0.52, rx: 0.22, ry: 0.38 },
  rightSide: { x: 0.38, y: 0.52, rx: 0.22, ry: 0.38 },
  laces: { x: 0, y: 0.58, rx: 0.34, ry: 0.12, rot: 0.08 },
  tongue: { x: 0, y: 0.7, rx: 0.4, ry: 0.14 },
  toeBox: { x: 0, y: 0.86, rx: 0.72, ry: 0.16 },
};

function dominantSubstance(zone: ZoneDirt): SubstanceKind | null {
  let best: SubstanceKind | null = null;
  let bestAmt = 0;
  for (const [k, v] of Object.entries(zone.substances) as [SubstanceKind, number][]) {
    if (v > bestAmt) {
      bestAmt = v;
      best = k;
    }
  }
  return best;
}

function patchColor(zone: ZoneDirt): THREE.Color {
  const hex = zoneStainColor(zone);
  if (hex) return new THREE.Color(hex);
  const sub = dominantSubstance(zone);
  if (sub) return new THREE.Color(SUBSTANCE_COLORS[sub]);
  return new THREE.Color(0x5c4033);
}

function splatGeometry(level: number, zoneSeed = 0): THREE.BufferGeometry {
  const segments = 6 + Math.min(level, 4);
  const geo = new THREE.CircleGeometry(0.5, segments);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (i === 0) continue;
    const t = Math.sin((i + 1) * 12.9898 + level * 7.1 + zoneSeed * 3.7) * 43758.5453;
    const r = 0.72 + (t - Math.floor(t)) * 0.35;
    pos.setX(i, pos.getX(i) * r);
    pos.setY(i, pos.getY(i) * r);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export type ShoeDirtOverlay = {
  group: THREE.Group;
  patches: Map<DirtZone, THREE.Mesh>;
  /** Per-zone last rendered level — avoids rebuilding every frame. */
  levels: Map<DirtZone, number>;
};

export function createShoeDirtOverlay(rearW: number, rearH: number): ShoeDirtOverlay {
  const group = new THREE.Group();
  group.name = "shoe-dirt-overlay";
  group.renderOrder = 12;
  const patches = new Map<DirtZone, THREE.Mesh>();
  const levels = new Map<DirtZone, number>();

  for (const zone of DIRT_ZONES) {
    const layout = ZONE_REAR_LAYOUT[zone];
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 8),
      new THREE.MeshBasicMaterial({
        color: 0x5c4033,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.position.set(layout.x * rearW, layout.y * rearH, 0.045);
    mesh.scale.set(layout.rx * rearW * 0.5, layout.ry * rearH * 0.5, 1);
    if (layout.rot) mesh.rotation.z = layout.rot;
    group.add(mesh);
    patches.set(zone, mesh);
    levels.set(zone, 0);
  }

  return { group, patches, levels };
}

export function updateShoeDirtOverlay(
  overlay: ShoeDirtOverlay,
  shoe: ShoeCondition,
  rearW: number,
  rearH: number,
): void {
  for (const zone of DIRT_ZONES) {
    const patch = overlay.patches.get(zone);
    if (!patch) continue;
    const zoneData = shoe.dirt[zone];
    const level = dirtIncrementLevel(zoneData.amount);
    const prev = overlay.levels.get(zone) ?? 0;

    if (level === 0) {
      patch.visible = false;
      overlay.levels.set(zone, 0);
      continue;
    }

    if (level !== prev) {
      patch.geometry.dispose();
      patch.geometry = splatGeometry(level, DIRT_ZONES.indexOf(zone));
      overlay.levels.set(zone, level);
    }

    const layout = ZONE_REAR_LAYOUT[zone];
    const mat = patch.material as THREE.MeshBasicMaterial;
    mat.color.copy(patchColor(zoneData));

    const wet = zoneData.wetness > 18;
    mat.opacity = Math.min(0.92, 0.14 + level * 0.09 + (wet ? 0.06 : 0));
    if (wet) mat.color.lerp(new THREE.Color(0x3a7ca5), 0.22);

    const grow = 0.88 + level * 0.07;
    patch.scale.set(layout.rx * rearW * 0.5 * grow, layout.ry * rearH * 0.5 * grow, 1);
    patch.visible = true;

    // Stack extra micro-splats for high levels (visual increments)
    patch.userData.extraCount = Math.max(0, level - 3);
  }
}

export function disposeShoeDirtOverlay(overlay: ShoeDirtOverlay): void {
  for (const mesh of overlay.patches.values()) {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }
  overlay.patches.clear();
  overlay.levels.clear();
}
