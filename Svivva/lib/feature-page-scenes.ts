import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";
import {
  CORRIDOR,
  TILE_BUILDERS,
  floatGeo,
  lineMat,
} from "@/lib/feature-scene-primitives";

export type SceneTick = (t: number) => void;

function scrollNorm(): number {
  const max = document.body.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, window.scrollY / max) : 0;
}

function animateSeedsTile(tile: THREE.Group, t: number, scroll: number) {
  tile.children.forEach((child) => {
    if (!(child instanceof THREE.Line) || child.userData.angle == null) return;
    const { angle, spread, phase } = child.userData as { angle: number; spread: number; phase: number };
    const pos = child.geometry.attributes.position as THREE.BufferAttribute;
    const grow = 10 + scroll * 18;
    const ang = angle + Math.sin(t * 0.3 + phase) * 0.15;
    for (let s = 0; s < pos.count; s++) {
      const f = s / (pos.count - 1);
      const wobble = Math.sin(f * 6 + t + phase) * spread * f;
      const rad = f * grow;
      pos.setX(s, Math.cos(ang) * rad - Math.sin(ang) * wobble);
      pos.setY(s, Math.sin(ang) * rad + Math.cos(ang) * wobble);
      pos.setZ(s, -14 + f * 8 + Math.sin(f * 4 + t) * 0.4);
    }
    pos.needsUpdate = true;
  });
}

function animatePlayTile(tile: THREE.Group, t: number) {
  tile.children.forEach((child) => {
    if (child instanceof THREE.Line && child.userData.band != null) {
      const { band, wall, y } = child.userData as { band: number; wall: number; y: number };
      const pos = child.geometry.attributes.position as THREE.BufferAttribute;
      for (let s = 0; s < pos.count; s++) {
        const f = s / (pos.count - 1);
        const x = -8 + f * 16;
        pos.setX(s, wall);
        pos.setY(s, y + Math.sin(x * 0.6 + t * 2.2 + band * 0.4) * 0.8);
        pos.setZ(s, -f * CORRIDOR.TILE_LEN);
      }
      pos.needsUpdate = true;
    }
    if (child instanceof THREE.Group && child.userData.phase != null) {
      child.rotation.y = t * 0.5 + child.userData.phase;
      child.position.y += Math.sin(t * 1.2 + child.userData.phase) * 0.004;
    }
  });
}

function animateOrbitTile(tile: THREE.Group, t: number, scroll: number) {
  const nodes: THREE.Mesh[] = [];
  let web: THREE.LineSegments | undefined;

  tile.children.forEach((child) => {
    if (child instanceof THREE.Mesh && child.userData.ring != null) {
      const { ring, a, i } = child.userData as { ring: number; a: number; i: number };
      const speed = 0.15 + (i % 4) * 0.04 + scroll * 0.3;
      const ang = a + t * speed;
      child.position.x = Math.cos(ang) * ring;
      child.position.y = Math.sin(ang) * ring * 0.5;
      nodes.push(child);
    }
    if (child instanceof THREE.LineSegments && child.userData.isWeb) {
      web = child;
    }
  });

  if (web && nodes.length > 1) {
    const positions: number[] = [];
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        if ((a + b) % 2 !== 0) continue;
        positions.push(
          nodes[a].position.x, nodes[a].position.y, nodes[a].position.z,
          nodes[b].position.x, nodes[b].position.y, nodes[b].position.z,
        );
      }
    }
    web.geometry.dispose();
    web.geometry = floatGeo(positions);
  }
}

function animateApiTile(tile: THREE.Group, t: number, scroll: number) {
  tile.children.forEach((child) => {
    if (!(child instanceof THREE.Group) || child.userData.index == null) return;
    const i = child.userData.index as number;
    child.rotation.y = t * 0.2 * (i % 2 ? 1 : -1) + scroll * 0.8;
    child.children.forEach((part) => {
      if (part instanceof THREE.LineSegments && part.userData.isLid) {
        part.rotation.x = -scroll * Math.PI * 0.5;
      }
    });
  });
}

function animateHardwareTile(tile: THREE.Group, t: number, scroll: number) {
  tile.children.forEach((child) => {
    if (child instanceof THREE.Mesh && child.userData.i != null) {
      const i = child.userData.i as number;
      child.rotation.x = t * (0.4 + i * 0.1) + scroll * 2;
      child.rotation.y = t * (0.55 + i * 0.08);
    }
  });
}

const TILE_ANIMATORS: Partial<Record<FeatureId, (tile: THREE.Group, t: number, scroll: number) => void>> = {
  seeds: animateSeedsTile,
  play: (tile, t) => animatePlayTile(tile, t),
  orbit: animateOrbitTile,
  api: animateApiTile,
  hardware: animateHardwareTile,
};

export function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Scene,
  _mouse: { x: number; y: number },
): Promise<SceneTick> {
  const manifest = ARTWORK_MANIFESTS[variant];
  const accentHex = new THREE.Color(manifest.accentColor).getHex();
  const secondary =
    variant === "seeds" ? 0x6b2c4a : variant === "orbit" ? 0xe8a040 : accentHex;

  scene.fog = new THREE.Fog(0x04060f, 45, 150);

  const builder = TILE_BUILDERS[variant];
  const tiles: THREE.Group[] = [];

  for (let i = 0; i < CORRIDOR.TILES_N; i++) {
    const tile = builder(accentHex, secondary);
    tile.position.z = -i * CORRIDOR.TILE_LEN;
    scene.add(tile);
    tiles.push(tile);
  }

  const animateTile = TILE_ANIMATORS[variant];

  return Promise.resolve((t: number) => {
    const scroll = scrollNorm();
    const speed = CORRIDOR.BASE_SPEED + scroll * 0.1;

    for (const tile of tiles) {
      tile.position.z += speed;
      if (tile.position.z > 14) {
        tile.position.z -= CORRIDOR.TILES_N * CORRIDOR.TILE_LEN;
      }
      animateTile?.(tile, t, scroll);
    }
  });
}
