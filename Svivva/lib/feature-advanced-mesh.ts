import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";

export type AdvancedMeshScene = {
  group: THREE.Group;
  tick: (t: number, scroll: number, mouse?: { x: number; y: number }) => void;
};

function glass(color: number, opts?: { transmission?: number; metalness?: number; emissive?: number }) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: opts?.metalness ?? 0.48,
    roughness: 0.12,
    transmission: opts?.transmission ?? 0.58,
    thickness: 1.4,
    transparent: true,
    opacity: 0.95,
    clearcoat: 0.85,
    clearcoatRoughness: 0.06,
    emissive: new THREE.Color(color).multiplyScalar(opts?.emissive ?? 0.28),
    emissiveIntensity: 1.2,
  });
}

function metal(color: number, roughness = 0.22) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.78,
    roughness,
    emissive: new THREE.Color(color).multiplyScalar(0.1),
  });
}

function tubeAlong(curve: THREE.Curve<THREE.Vector3>, color: number, radius = 0.06, segments = 64) {
  const geo = new THREE.TubeGeometry(curve, segments, radius, 12, false);
  return new THREE.Mesh(geo, glass(color, { transmission: 0.35, metalness: 0.55 }));
}

function buildSeedsCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();
  const meshes: THREE.Mesh[] = [];

  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 2), glass(p.tertiary, { emissive: 0.35 }));
  group.add(core);
  meshes.push(core);

  const positions = [
    [-2.4, 1.6, -0.5],
    [2.2, 1.4, -0.8],
    [-2.1, -1.5, -0.3],
    [2.4, -1.3, -0.6],
  ];
  const colors = [p.primary, p.highlight, p.secondary, p.wire];

  positions.forEach(([x, y, z], i) => {
    const pod = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 2), glass(colors[i], { transmission: 0.52 }));
    pod.position.set(x, y, z);
    group.add(pod);
    meshes.push(pod);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0.2),
      new THREE.Vector3(x * 0.35, y * 0.35, 0.1),
      new THREE.Vector3(x * 0.75, y * 0.75, -0.1),
      new THREE.Vector3(x, y, z),
    ]);
    const stem = tubeAlong(curve, p.primary, 0.045, 48);
    group.add(stem);
    meshes.push(stem);
  });

  const particleGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const particleMat = glass(p.secondary, { transmission: 0.65, emissive: 0.18 });
  const count = 36;
  const inst = new THREE.InstancedMesh(particleGeo, particleMat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 1.2 + (i % 5) * 0.35;
    dummy.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.7, (i % 3) * 0.2 - 0.2);
    dummy.scale.setScalar(0.6 + (i % 4) * 0.15);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  group.add(inst);

  const tick = (t: number, scroll: number) => {
    core.rotation.y = t * 0.35 + scroll * 1.2;
    core.rotation.x = Math.sin(t * 0.4) * 0.15;
    meshes.forEach((m, i) => {
      if (i === 0) return;
      m.rotation.y = t * 0.25 + i * 0.4 + scroll * 0.8;
      m.position.z += Math.sin(t * 0.8 + i) * 0.0008;
    });
    inst.rotation.z = t * 0.08 + scroll * 0.4;
  };

  return { group, tick };
}

function buildPlayCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();
  const notes: THREE.Group[] = [];

  for (let i = 0; i < 5; i++) {
    const note = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 16), glass(p.primary));
    head.scale.set(1.2, 0.85, 0.65);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 10), metal(p.secondary));
    stem.position.y = 0.75;
    note.add(head, stem);
    note.position.set((i - 2) * 1.6, Math.sin(i) * 0.4, -i * 0.15);
    note.rotation.z = (i - 2) * 0.18;
    group.add(note);
    notes.push(note);
  }

  const wavePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80 - 0.5) * 12;
    wavePts.push(new THREE.Vector3(x, Math.sin(x * 0.8) * 0.5, -1.5));
  }
  group.add(tubeAlong(new THREE.CatmullRomCurve3(wavePts), p.tertiary, 0.07));

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.08, 12, 64), metal(p.highlight, 0.15));
  ring.rotation.x = Math.PI / 2.5;
  group.add(ring);

  const tick = (t: number, scroll: number) => {
    notes.forEach((n, i) => {
      n.rotation.y = Math.sin(t * 0.6 + i) * 0.25 + scroll * 0.5;
      n.position.y = Math.sin(i) * 0.4 + Math.sin(t * 1.2 + i) * 0.12;
    });
    ring.rotation.z = t * 0.2 + scroll * 0.6;
  };

  return { group, tick };
}

function buildSecurityCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();
  const crystals: THREE.Mesh[] = [];

  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.85 - i * 0.15, 0), glass(p.primary, { transmission: 0.62 }));
    c.position.set((i - 1) * 1.8, i * 0.3, -i * 0.4);
    c.scale.y = 1.4;
    group.add(c);
    crystals.push(c);
  }

  for (let r = 0; r < 4; r++) {
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.6 + r * 0.45, 0.05, 10, 48),
      metal(r % 2 ? p.secondary : p.tertiary, 0.18),
    );
    torus.rotation.x = Math.PI / 2 + r * 0.15;
    group.add(torus);
    crystals.push(torus);
  }

  const tick = (t: number, scroll: number) => {
    crystals.forEach((m, i) => {
      m.rotation.y = (i % 2 ? 1 : -1) * (t * 0.15 + scroll * 0.5);
      m.rotation.z = Math.sin(t * 0.5 + i) * 0.08;
    });
  };

  return { group, tick };
}

function buildOrbitCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();
  const nodes: THREE.Mesh[] = [];
  const nodeCount = 10;

  for (let i = 0; i < nodeCount; i++) {
    const a = (i / nodeCount) * Math.PI * 2;
    const r = 2.4 + (i % 3) * 0.4;
    const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), glass(i % 2 ? p.secondary : p.tertiary));
    node.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.55, (i % 2) * 0.3);
    group.add(node);
    nodes.push(node);

    for (let j = i + 1; j < nodeCount; j++) {
      if ((i * 7 + j * 13) % 5 > 1) continue;
      const a2 = (j / nodeCount) * Math.PI * 2;
      const r2 = 2.4 + (j % 3) * 0.4;
      const start = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.55, (i % 2) * 0.3);
      const end = new THREE.Vector3(Math.cos(a2) * r2, Math.sin(a2) * r2 * 0.55, (j % 2) * 0.3);
      const mid = start.clone().lerp(end, 0.5);
      mid.z += 0.6;
      group.add(tubeAlong(new THREE.QuadraticBezierCurve3(start, mid, end), p.wire, 0.025, 24));
    }
  }

  const tick = (t: number, scroll: number) => {
    nodes.forEach((n, i) => {
      n.rotation.x = t * 0.4 + i;
      n.rotation.y = scroll * 0.8 + i * 0.2;
    });
    group.rotation.y = t * 0.06 + scroll * 0.35;
  };

  return { group, tick };
}

function buildApiCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();
  const lids: THREE.Mesh[] = [];

  for (let i = 0; i < 4; i++) {
    const caseGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.35), glass(p.primary, { transmission: 0.4 }));
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 0.38), metal(p.secondary));
    lid.position.y = 0.66;
    lid.userData.isLid = true;
    caseGroup.add(body, lid);
    caseGroup.position.set((i - 1.5) * 2.4, 0, i * 0.12);
    caseGroup.rotation.y = (i - 1.5) * 0.3;
    group.add(caseGroup);
    lids.push(lid);
  }

  const flower = new THREE.Mesh(new THREE.LatheGeometry(
    Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return new THREE.Vector2(0.35 + Math.sin(a * 5) * 0.12, i * 0.08);
    }),
    24,
  ), glass(p.highlight, { transmission: 0.55 }));
  flower.position.set(0, -1.8, 0.5);
  group.add(flower);

  const tick = (t: number, scroll: number) => {
    lids.forEach((lid, i) => {
      lid.rotation.x = -scroll * 1.1 - 0.3 + Math.sin(t * 0.4 + i) * 0.05;
    });
    flower.rotation.y = t * 0.25 + scroll * 0.9;
  };

  return { group, tick };
}

function buildHardwareCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();
  const gems: THREE.Mesh[] = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.38, 0),
        metal([p.primary, p.secondary, p.tertiary][row], 0.12 + row * 0.05),
      );
      gem.position.set((col - 2) * 1.1, (row - 1) * 0.95, row * 0.15);
      gem.rotation.set(col * 0.3, row * 0.4, (col + row) * 0.25);
      group.add(gem);
      gems.push(gem);
    }
  }

  const fist = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), metal(p.primary, 0.14));
    knuckle.position.set(i * 0.32 - 0.65, 0.2, Math.sin(i) * 0.08);
    knuckle.rotation.z = i * 0.12;
    fist.add(knuckle);
  }
  fist.position.set(0, 1.6, -0.5);
  group.add(fist);

  const tick = (t: number, scroll: number) => {
    gems.forEach((g, i) => {
      g.rotation.x = t * 0.35 + scroll * 1.2 + i * 0.1;
      g.rotation.y = t * 0.28 + i * 0.05;
    });
    fist.rotation.y = Math.sin(t * 0.3) * 0.2 + scroll * 0.4;
  };

  return { group, tick };
}

const BUILDERS: Record<FeatureId, (p: GraphicPalette) => AdvancedMeshScene> = {
  seeds: buildSeedsCluster,
  play: buildPlayCluster,
  security: buildSecurityCluster,
  orbit: buildOrbitCluster,
  api: buildApiCluster,
  hardware: buildHardwareCluster,
};

export function buildAdvancedGraphicCluster(variant: FeatureId, palette: GraphicPalette): AdvancedMeshScene {
  return BUILDERS[variant](palette);
}
