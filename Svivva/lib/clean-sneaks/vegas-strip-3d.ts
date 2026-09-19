import * as THREE from "three";

export const VEGAS_NEON_PALETTE = [
  "#ff2d8a",
  "#ffb347",
  "#4de8ff",
  "#ff5ec8",
  "#ffd166",
  "#c77dff",
] as const;

export type VegasNeonColor = (typeof VEGAS_NEON_PALETTE)[number];

export function vegasSeed(segment: number, salt: number): number {
  return ((segment * 997 + salt * 131) % 1000) / 1000;
}

export function pickNeon(segment: number, salt: number): VegasNeonColor {
  return VEGAS_NEON_PALETTE[Math.floor(vegasSeed(segment, salt) * VEGAS_NEON_PALETTE.length)]!;
}

/** Emissive marquee strip material */
export function neonBasicMaterial(color: string, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    toneMapped: false,
    transparent: opacity < 1,
    opacity,
  });
}

/** Dark resort shell with emissive window map */
export function resortShellMaterial(
  facade: THREE.Texture,
  neon: string,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: facade,
    color: new THREE.Color("#0a0610"),
    roughness: 0.9,
    metalness: 0.1,
    emissive: new THREE.Color(neon),
    emissiveMap: facade,
    emissiveIntensity: 0.72,
  });
}

export type VegasSegmentLayout = {
  z: number;
  landmark: "eiffel" | "wheel" | "pyramid" | "arch" | "tower";
  neon: VegasNeonColor;
  neon2: VegasNeonColor;
  sideOffset: number;
};

export function layoutVegasSegments(count: number, mobile: boolean): VegasSegmentLayout[] {
  const landmarks: VegasSegmentLayout["landmark"][] = [
    "eiffel",
    "wheel",
    "tower",
    "pyramid",
    "arch",
    "tower",
  ];
  const step = mobile ? 22 : 26;
  return Array.from({ length: count }, (_, i) => ({
    z: -32 - i * step - (i % 2) * 4,
    landmark: landmarks[i % landmarks.length]!,
    neon: pickNeon(i, 1),
    neon2: pickNeon(i, 9),
    sideOffset: 11 + (i % 3) * 2.5,
  }));
}
