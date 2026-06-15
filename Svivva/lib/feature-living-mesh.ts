import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";

export type LivingMeshScene = {
  group: THREE.Group;
  tick: (t: number, scroll: number, mouse?: { x: number; y: number }) => void;
};

type BloomPod = {
  mesh: THREE.Mesh;
  baseScale: number;
  phase: number;
  ox: number;
  oy: number;
  oz: number;
  rotY: number;
};

function physical(
  color: number,
  palette: GraphicPalette,
  opts: { transmission?: number; emissive?: number; roughness?: number; metalness?: number } = {},
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: opts.emissive ?? color,
    emissiveIntensity: 0.08,
    metalness: opts.metalness ?? 0.15,
    roughness: opts.roughness ?? 0.35,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2,
    transmission: opts.transmission ?? 0,
    thickness: 0.4,
    transparent: true,
    opacity: 0.82 + palette.patternOpacity * 0.3,
    depthWrite: true,
  });
}

/** Petal bloom — flower-style opening cone (CRT flowers pattern). */
function addPetalBloom(
  parent: THREE.Group,
  pods: BloomPod[],
  color: number,
  palette: GraphicPalette,
  x: number,
  y: number,
  z: number,
  scale: number,
  phase: number,
  petals = 6,
) {
  const bloom = new THREE.Group();
  bloom.position.set(x, y, z);
  for (let p = 0; p < petals; p++) {
    const ang = (p / petals) * Math.PI * 2;
    const geo = new THREE.ConeGeometry(0.22 * scale, 0.55 * scale, 5, 1);
    geo.rotateX(Math.PI / 2);
    const mat = physical(
      p % 2 === 0 ? color : palette.highlight,
      palette,
      { emissive: p % 3 === 0 ? palette.tertiary : color },
    );
    const petal = new THREE.Mesh(geo, mat);
    petal.position.set(Math.cos(ang) * 0.12 * scale, Math.sin(ang) * 0.1 * scale, 0);
    petal.rotation.z = ang + Math.PI / 2;
    petal.rotation.x = 0.35;
    bloom.add(petal);
    pods.push({
      mesh: petal,
      baseScale: 1,
      phase: phase + p * 0.4,
      ox: 0,
      oy: 0,
      oz: 0,
      rotY: ang,
    });
  }
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.14 * scale, 12, 12),
    physical(palette.secondary, palette, { transmission: 0.25, roughness: 0.2 }),
  );
  bloom.add(core);
  pods.push({ mesh: core, baseScale: 1, phase, ox: 0, oy: 0, oz: 0, rotY: 0 });
  parent.add(bloom);
}

function addPanelPlaque(
  parent: THREE.Group,
  pods: BloomPod[],
  palette: GraphicPalette,
  colors: [number, number],
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  phase: number,
) {
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.08),
    physical(colors[0], palette, { roughness: 0.45 }),
  );
  plaque.position.set(x, y, z);
  parent.add(plaque);
  pods.push({ mesh: plaque, baseScale: 1, phase, ox: x, oy: y, oz: z, rotY: 0 });

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(Math.min(w, h) * 0.38, 0.03, 8, 24),
    physical(colors[1], palette, { metalness: 0.4 }),
  );
  rim.position.set(x, y, z + 0.06);
  parent.add(rim);
  pods.push({ mesh: rim, baseScale: 1, phase: phase + 0.5, ox: x, oy: y, oz: z + 0.06, rotY: 0 });
}

function buildSeedsLiving(palette: GraphicPalette, mode: "hero" | "page"): LivingMeshScene {
  const group = new THREE.Group();
  const pods: BloomPod[] = [];
  const s = mode === "hero" ? 0.85 : 1;

  addPanelPlaque(group, pods, palette, [palette.tertiary, palette.primary], -2.4 * s, 1.6 * s, 0, 1.4, 1.1, 0);
  addPanelPlaque(group, pods, palette, [palette.highlight, palette.secondary], 2.4 * s, 1.6 * s, 0.05, 1.35, 1.05, 0.8);
  addPanelPlaque(group, pods, palette, [0x8b7355, palette.wire], -2.4 * s, -1.6 * s, 0.02, 1.4, 1.1, 1.6);
  addPanelPlaque(group, pods, palette, [palette.primary, palette.wire], 2.4 * s, -1.6 * s, 0.08, 1.35, 1.05, 2.4);

  const bloomPositions: [number, number, number, number, number][] = [
    [-1.2, 0.3, 0.3, palette.tertiary, 0],
    [1.1, 0.5, 0.2, palette.highlight, 1.2],
    [-0.8, -0.9, 0.25, palette.primary, 2.1],
    [0.9, -1.1, 0.15, palette.secondary, 3],
    [0, 1.8, 0.1, palette.tertiary, 4.2],
    [-2.8, 0, -0.2, palette.primary, 5],
    [2.8, 0.2, -0.15, palette.highlight, 5.8],
  ];
  bloomPositions.forEach(([x, y, z, col, ph]) => {
    addPetalBloom(group, pods, col, palette, x * s, y * s, z, 0.9, ph, 7);
  });

  const moteGeo = new THREE.BufferGeometry();
  const moteCount = mode === "hero" ? 48 : 72;
  const positions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  moteGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({
      color: palette.tertiary,
      size: mode === "hero" ? 0.06 : 0.045,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(motes);

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    const mx = mouse?.x ?? 0;
    const my = mouse?.y ?? 0;
    const bloom = 0.55 + Math.sin(t * 0.35) * 0.2 + scroll * 0.15;
    pods.forEach((pod) => {
      const open = bloom + Math.sin(t * 0.5 + pod.phase) * 0.12;
      pod.mesh.scale.setScalar(pod.baseScale * open);
      if (pod.ox !== 0 || pod.oy !== 0) {
        pod.mesh.position.x = pod.ox + mx * 0.15;
        pod.mesh.position.y = pod.oy + my * 0.12 + Math.sin(t * 0.4 + pod.phase) * 0.04;
      }
      pod.mesh.rotation.y = pod.rotY + t * 0.08 + scroll * 0.2;
      const mat = pod.mesh.material as THREE.MeshPhysicalMaterial;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.06 + Math.sin(t * 1.2 + pod.phase) * 0.05 + scroll * 0.04;
      }
    });
    motes.rotation.y = t * 0.03 + scroll * 0.15;
    const mPos = moteGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < moteCount; i++) {
      mPos.setY(i, positions[i * 3 + 1] + Math.sin(t * 0.6 + i * 0.3) * 0.08);
    }
    mPos.needsUpdate = true;
  };

  return { group, tick };
}

function buildPlayLiving(palette: GraphicPalette, mode: "hero" | "page"): LivingMeshScene {
  const group = new THREE.Group();
  const pods: BloomPod[] = [];
  for (let band = 0; band < 5; band++) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-5, band * 0.35 - 0.8, band * 0.05),
      new THREE.Vector3(0, Math.sin(band) * 0.6, band * 0.08),
      new THREE.Vector3(5, band * 0.25 - 0.5, band * 0.05),
    );
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.06 + band * 0.02, 8, false),
      physical(band % 2 ? palette.primary : palette.tertiary, palette, { transmission: 0.15 }),
    );
    group.add(tube);
    pods.push({ mesh: tube, baseScale: 1, phase: band, ox: 0, oy: 0, oz: 0, rotY: 0 });
  }
  [[-2, 0.5], [2, -0.3], [0, 1.2]].forEach(([x, y], i) => {
    addPetalBloom(group, pods, palette.primary, palette, x, y, 0.2, mode === "hero" ? 0.7 : 0.9, i * 1.5, 5);
  });
  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    pods.forEach((pod) => {
      const pulse = 1 + Math.sin(t * 1.4 + pod.phase + scroll * 3) * 0.08;
      pod.mesh.scale.setScalar(pod.baseScale * pulse);
      pod.mesh.rotation.z = Math.sin(t * 0.5 + pod.phase) * 0.06;
    });
    group.position.x = (mouse?.x ?? 0) * 0.2;
    group.position.y = (mouse?.y ?? 0) * 0.15;
  };
  return { group, tick };
}

function buildOrbitLiving(palette: GraphicPalette): LivingMeshScene {
  const group = new THREE.Group();
  const pods: BloomPod[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 2.2 + (i % 3) * 0.5;
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18 + (i % 2) * 0.06, 0),
      physical(i % 2 ? palette.secondary : palette.tertiary, palette, { metalness: 0.35 }),
    );
    gem.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.55, (i % 2) * 0.1);
    group.add(gem);
    pods.push({ mesh: gem, baseScale: 1, phase: i, ox: gem.position.x, oy: gem.position.y, oz: gem.position.z, rotY: a });
  }
  const tick = (t: number, scroll: number) => {
    pods.forEach((pod) => {
      pod.mesh.rotation.x = t * 0.4 + pod.phase;
      pod.mesh.rotation.y = t * 0.3;
      const s = 1 + Math.sin(t * 0.8 + pod.phase) * 0.15;
      pod.mesh.scale.setScalar(s);
    });
    group.rotation.z = scroll * 0.25;
  };
  return { group, tick };
}

function buildSecurityLiving(palette: GraphicPalette): LivingMeshScene {
  const group = new THREE.Group();
  const pods: BloomPod[] = [];
  for (let r = 0; r < 3; r++) {
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.2 + r * 0.55, 0.04, 8, 48),
      physical(r === 1 ? palette.secondary : palette.primary, palette, { transmission: r === 0 ? 0.2 : 0 }),
    );
    torus.position.z = r * 0.12;
    group.add(torus);
    pods.push({ mesh: torus, baseScale: 1, phase: r, ox: 0, oy: 0, oz: r * 0.12, rotY: 0 });
  }
  const vessel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 1.1, 12, 1, true),
    physical(palette.tertiary, palette, { transmission: 0.45, roughness: 0.15 }),
  );
  group.add(vessel);
  pods.push({ mesh: vessel, baseScale: 1, phase: 0, ox: 0, oy: 0, oz: 0, rotY: 0 });
  const tick = (t: number, scroll: number) => {
    pods.forEach((pod, i) => {
      if (i < 3) pod.mesh.rotation.z = (i % 2 === 0 ? 1 : -1) * (t * 0.12 + scroll * 0.3);
      else pod.mesh.rotation.y = t * 0.15;
      const mat = pod.mesh.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 0.05 + Math.sin(t + pod.phase) * 0.04;
    });
  };
  return { group, tick };
}

function buildApiLiving(palette: GraphicPalette): LivingMeshScene {
  const group = new THREE.Group();
  const pods: BloomPod[] = [];
  addPetalBloom(group, pods, palette.primary, palette, -1.5, 0.8, 0, 1, 0, 8);
  addPetalBloom(group, pods, palette.secondary, palette, 1.8, -0.6, 0.1, 0.85, 1.5, 6);
  for (let p = 0; p < 3; p++) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.1, 0.06),
      physical(p % 2 ? palette.highlight : palette.primary, palette),
    );
    panel.position.set((p - 1) * 2, -1.5, p * 0.05);
    panel.rotation.y = (p - 1) * 0.3;
    group.add(panel);
    pods.push({ mesh: panel, baseScale: 1, phase: p, ox: panel.position.x, oy: panel.position.y, oz: panel.position.z, rotY: panel.rotation.y });
  }
  const tick = (t: number, scroll: number) => {
    pods.forEach((pod) => {
      const breathe = 1 + Math.sin(t * 0.45 + pod.phase) * 0.06;
      pod.mesh.scale.setScalar(breathe);
      if (pod.mesh.geometry.type === "BoxGeometry") {
        pod.mesh.rotation.x = -scroll * 0.4 - 0.15 + Math.sin(t * 0.2) * 0.03;
      }
    });
  };
  return { group, tick };
}

function buildHardwareLiving(palette: GraphicPalette): LivingMeshScene {
  const group = new THREE.Group();
  const pods: BloomPod[] = [];
  const colors = [palette.tertiary, palette.secondary, palette.primary];
  [[-2, 1.2], [2.2, 1.5], [2, -1]].forEach(([x, y], i) => {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      physical(colors[i], palette, { metalness: 0.25 }),
    );
    cube.position.set(x, y, 0);
    group.add(cube);
    pods.push({ mesh: cube, baseScale: 1, phase: i, ox: x, oy: y, oz: 0, rotY: 0 });
  });
  for (let i = 0; i < 6; i++) {
    const dia = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      physical(i % 2 ? palette.highlight : palette.wire, palette, { metalness: 0.5 }),
    );
    const a = (i / 6) * Math.PI * 2;
    dia.position.set(Math.cos(a) * 1.8, Math.sin(a) * 1.2 - 0.5, 0);
    group.add(dia);
    pods.push({ mesh: dia, baseScale: 1, phase: i + 3, ox: dia.position.x, oy: dia.position.y, oz: 0, rotY: a });
  }
  const tick = (t: number, scroll: number) => {
    pods.forEach((pod) => {
      pod.mesh.rotation.x = t * 0.2 + scroll * 0.5 + pod.phase * 0.1;
      pod.mesh.rotation.y = t * 0.15;
    });
  };
  return { group, tick };
}

export function buildLivingMeshLayer(
  variant: FeatureId,
  palette: GraphicPalette,
  mode: "hero" | "page" = "page",
): LivingMeshScene {
  switch (variant) {
    case "seeds":
      return buildSeedsLiving(palette, mode);
    case "play":
      return buildPlayLiving(palette, mode);
    case "orbit":
      return buildOrbitLiving(palette);
    case "security":
      return buildSecurityLiving(palette);
    case "api":
      return buildApiLiving(palette);
    case "hardware":
      return buildHardwareLiving(palette);
  }
}
