import * as THREE from "three";
import { GRAPHIC_PALETTES } from "@/lib/artwork-palettes";
import {
  createBloomLayerMaterial,
  createCamoTileTexture,
  paletteColors,
  type BloomLayerMaterial,
} from "@/lib/feature-bloom-material";
import type { SeedsWorkflowState } from "@/lib/seeds-workflow-state";

export type SeedPodVisual = {
  status: string;
  buildProgress: number;
};

export type SeedsPipelineScene = {
  root: THREE.Group;
  tick: (
    t: number,
    state: SeedsWorkflowState,
    seeds: SeedPodVisual[],
    scroll: number,
  ) => void;
};

const P = GRAPHIC_PALETTES.seeds;
const MAX_PODS = 8;
const MOTIFS = ["gold", "purple", "grain", "courtyard"] as const;
type Motif = (typeof MOTIFS)[number];

type BloomPart = { mesh: THREE.Mesh; material: BloomLayerMaterial; phase: number; baseBloom: number };

type SeedBranch = {
  group: THREE.Group;
  frame: THREE.Group;
  pod: THREE.Mesh;
  bud: THREE.Mesh;
  bloomParts: BloomPart[];
  stem: THREE.Mesh;
  flow: THREE.Points;
  flowPos: Float32Array;
  curve: THREE.CatmullRomCurve3;
  hub: THREE.Vector3;
  end: THREE.Vector3;
  reveal: number;
  motif: Motif;
};

type Filament = {
  line: THREE.Line;
  positions: Float32Array;
  angle: number;
  phase: number;
  targetLen: number;
  currentLen: number;
};

function glass(color: number, emissive = 0.28, transmission = 0.55) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.55,
    roughness: 0.14,
    transmission,
    thickness: 1.2,
    transparent: true,
    opacity: 0.92,
    clearcoat: 0.85,
    emissive: new THREE.Color(color).multiplyScalar(emissive),
    emissiveIntensity: 1.1,
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

function phaseIndex(phase: SeedsWorkflowState["phase"]): number {
  switch (phase) {
    case "idle":
      return 0;
    case "uploading":
      return 1;
    case "parsed":
      return 2;
    case "verifying":
      return 3;
    case "building":
      return 4;
    case "complete":
      return 5;
    default:
      return 0;
  }
}

function podEnergy(status: string, progress: number, phase: SeedsWorkflowState["phase"]): number {
  if (status === "complete") return 1;
  if (status === "building") return 0.4 + (progress / 100) * 0.6;
  if (status === "queued" && phase === "building") return 0.3;
  if (phase === "verifying") return 0.5;
  if (phase === "parsed") return 0.28;
  return 0.1;
}

function podAccent(status: string, phase: SeedsWorkflowState["phase"], motifIndex: number): number {
  if (status === "complete") return P.primary;
  if (status === "building" || status === "queued") return P.secondary;
  if (status === "error") return 0xc04040;
  if (phase === "verifying") return P.highlight;
  return [P.primary, P.highlight, P.secondary, P.wire][motifIndex % 4];
}

function canopyPosition(index: number): THREE.Vector3 {
  const hub = new THREE.Vector3(0, 1.55, 0);
  const spread = Math.min(MAX_PODS, Math.max(index + 1, 2));
  const t = spread <= 1 ? 0.5 : index / (spread - 1);
  const angle = -Math.PI * 0.55 + t * Math.PI * 1.1;
  const radius = 2.05 + (index % 3) * 0.28;
  return new THREE.Vector3(
    hub.x + Math.sin(angle) * radius,
    hub.y + Math.cos(angle) * radius * 0.55 + 0.65,
    hub.z - 0.35 + (index % 2) * 0.22,
  );
}

function buildDepthLayers(): {
  back: THREE.Group;
  filaments: Filament[];
  bloomParts: BloomPart[];
} {
  const back = new THREE.Group();
  back.position.z = -8;
  const bloomParts: BloomPart[] = [];
  const colors = paletteColors(P);
  const tex = createCamoTileTexture(17, P);

  for (let s = 0; s < 5; s++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.028, 0.012),
      new THREE.MeshBasicMaterial({ color: P.wire, transparent: true, opacity: 0.1 + s * 0.02 }),
    );
    bar.position.set(0, 3.2 - s * 0.58, -1.5 + s * 0.35);
    back.add(bar);
  }

  for (let i = 0; i < 5; i++) {
    const veil = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2 + (i % 2) * 0.8, 2.1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.16, depthWrite: false }),
    );
    veil.position.set(Math.sin(i * 1.4) * 4.5, Math.cos(i * 1.1) * 2.2, -2 - i * 0.9);
    veil.rotation.set(Math.sin(i) * 0.15, Math.cos(i * 0.7) * 0.25, 0);
    back.add(veil);
  }

  const farFrames: [number, number, number, number][] = [
    [-3.8, 1.8, P.tertiary, P.primary],
    [3.6, 1.6, P.highlight, P.secondary],
    [-3.4, -1.6, 0x8b7355, P.wire],
    [3.8, -1.4, P.primary, P.wire],
  ];
  farFrames.forEach(([x, y, c1, c2], i) => {
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.1, 1.55)),
      new THREE.LineBasicMaterial({ color: c1, transparent: true, opacity: 0.22 }),
    );
    frame.position.set(x, y, -1.2 - i * 0.25);
    back.add(frame);
    const cross = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - 0.7, y, -1.1 - i * 0.25),
        new THREE.Vector3(x + 0.7, y, -1.1 - i * 0.25),
        new THREE.Vector3(x, y - 0.45, -1.1 - i * 0.25),
        new THREE.Vector3(x, y + 0.45, -1.1 - i * 0.25),
      ]),
      new THREE.LineBasicMaterial({ color: c2, transparent: true, opacity: 0.16 }),
    );
    back.add(cross);
  });

  for (let b = 0; b < 6; b++) {
    const ang = (b / 6) * Math.PI * 2;
    const g = new THREE.Group();
    g.position.set(Math.cos(ang) * 1.8, Math.sin(ang) * 1.2 - 0.3, -0.8);
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      const mat = createBloomLayerMaterial(colors, 0.1);
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), mat);
      petal.position.set(Math.cos(a) * 0.12, 0.08, Math.sin(a) * 0.12);
      petal.scale.set(1, 0.35, 1.2);
      g.add(petal);
      bloomParts.push({ mesh: petal, material: mat, phase: b + p, baseBloom: 0.08 });
    }
    back.add(g);
  }

  const filaments: Filament[] = [];
  for (let b = 0; b < 14; b++) {
    const ang = (b / 14) * Math.PI * 2;
    const positions = new Float32Array(40 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const col = b % 3 === 0 ? P.tertiary : b % 3 === 1 ? P.primary : P.secondary;
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.35 }),
    );
    back.add(line);
    filaments.push({ line, positions, angle: ang, phase: b, targetLen: 0, currentLen: 0 });
  }

  return { back, filaments, bloomParts };
}

function buildSpecRoot(): {
  group: THREE.Group;
  pages: THREE.Mesh[];
  scan: THREE.Mesh;
  lines: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.position.set(0, -2.35, 0);

  const pages: THREE.Mesh[] = [];
  for (let p = 0; p < 3; p++) {
    const page = new THREE.Mesh(
      new THREE.BoxGeometry(1.45 - p * 0.04, 2.05 - p * 0.03, 0.07),
      glass(p === 0 ? P.primary : P.wire, 0.12 + p * 0.04, 0.38),
    );
    page.position.set(p * 0.06, p * 0.04, p * 0.05);
    group.add(page);
    pages.push(page);
  }

  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.48, 2.08, 0.09)),
    new THREE.LineBasicMaterial({ color: P.primary, transparent: true, opacity: 0.7 }),
  );
  group.add(rim);

  const lines: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const w = 0.9 - (i % 3) * 0.1;
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.02, 0.012),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? P.primary : i % 3 === 1 ? P.secondary : P.tertiary,
        transparent: true,
        opacity: 0.32,
      }),
    );
    line.position.set(0.04, 0.75 - i * 0.16, 0.06);
    group.add(line);
    lines.push(line);
  }

  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 0.045),
    new THREE.MeshBasicMaterial({
      color: P.primary,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scan.position.set(0, 0, 0.08);
  group.add(scan);

  return { group, pages, scan, lines };
}

function buildTrunkSpine(): {
  group: THREE.Group;
  trunk: THREE.Mesh;
  parseCore: THREE.Mesh;
  innerCore: THREE.Mesh;
  verifyRing: THREE.Mesh;
  verifyShield: THREE.LineSegments;
  branchHub: THREE.Mesh;
  rings: THREE.Mesh[];
  ingestFlow: THREE.Points;
  ingestPos: Float32Array;
  ingestCurve: THREE.CatmullRomCurve3;
} {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, 3.6, 16, 1, true),
    glass(P.wire, 0.08, 0.32),
  );
  trunk.position.y = -0.35;
  group.add(trunk);

  const rings: THREE.Mesh[] = [];
  const ringYs = [-1.15, 0.05, 1.35];
  const ringColors = [P.primary, P.highlight, P.secondary];
  ringYs.forEach((y, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.48 + i * 0.04, 0.035, 10, 24),
      metal(ringColors[i], 0.15),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
    rings.push(ring);
  });

  const parseCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), glass(P.tertiary, 0.42, 0.6));
  parseCore.position.y = -1.15;
  group.add(parseCore);

  const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), glass(P.highlight, 0.5, 0.35));
  innerCore.position.y = -1.15;
  group.add(innerCore);

  const verifyRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.04, 12, 6),
    glass(P.highlight, 0.32, 0.3),
  );
  verifyRing.rotation.x = Math.PI / 2;
  verifyRing.position.y = 0.05;
  group.add(verifyRing);

  const verifyShield = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.52, 0)),
    new THREE.LineBasicMaterial({ color: P.primary, transparent: true, opacity: 0.85 }),
  );
  verifyShield.position.y = 0.05;
  group.add(verifyShield);

  const branchHub = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), glass(P.primary, 0.38, 0.45));
  branchHub.position.y = 1.55;
  group.add(branchHub);

  const ingestCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -2.35, 0),
    new THREE.Vector3(0, -1.6, 0.15),
    new THREE.Vector3(0, -1.15, 0),
  ]);
  const ingestPos = new Float32Array(48 * 3);
  for (let i = 0; i < 48; i++) {
    const pt = ingestCurve.getPoint(i / 47);
    ingestPos[i * 3] = pt.x;
    ingestPos[i * 3 + 1] = pt.y;
    ingestPos[i * 3 + 2] = pt.z;
  }
  const ingestGeo = new THREE.BufferGeometry();
  ingestGeo.setAttribute("position", new THREE.BufferAttribute(ingestPos, 3));
  const ingestFlow = new THREE.Points(
    ingestGeo,
    new THREE.PointsMaterial({
      color: P.tertiary,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ingestFlow.visible = false;
  group.add(ingestFlow);

  return {
    group,
    trunk,
    parseCore,
    innerCore,
    verifyRing,
    verifyShield,
    branchHub,
    rings,
    ingestFlow,
    ingestPos,
    ingestCurve,
  };
}

function buildCollageFrame(motif: Motif, accent: number): THREE.Group {
  const frame = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.35, 0.09), glass(accent, 0.14, 0.44));
  frame.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.032, 8, 20),
    metal(P.highlight, 0.12),
  );
  rim.position.z = 0.06;
  if (motif === "purple") rim.scale.set(1, 1.28, 1);
  frame.add(rim);

  const accentMesh =
    motif === "grain"
      ? new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.035), metal(P.secondary, 0.18))
      : new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), glass(P.wire, 0.2, 0.45));
  accentMesh.position.set(0, motif === "courtyard" ? -0.38 : 0, 0.07);
  frame.add(accentMesh);

  const innerBars: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.1 - i * 0.12, 0.018, 0.012),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.28 - i * 0.04 }),
    );
    bar.position.set(0, 0.35 - i * 0.18, 0.055);
    frame.add(bar);
    innerBars.push(bar);
  }
  frame.userData.innerBars = innerBars;

  return frame;
}

function addPodBloom(parent: THREE.Group, parts: BloomPart[]): void {
  const colors = paletteColors(P);
  for (let layer = 0; layer < 2; layer++) {
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2 + layer * 0.35;
      const mat = createBloomLayerMaterial(colors, 0.11 + layer * 0.02);
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.16 - layer * 0.03, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.58),
        mat,
      );
      petal.position.set(Math.cos(angle) * 0.14, 0.42 + layer * 0.06, Math.sin(angle) * 0.14);
      petal.scale.set(1, 0.32, 1.15);
      petal.rotation.y = angle;
      parent.add(petal);
      parts.push({ mesh: petal, material: mat, phase: p + layer * 8, baseBloom: 0.1 + layer * 0.06 });
    }
  }
}

function stemCurve(hub: THREE.Vector3, end: THREE.Vector3): THREE.CatmullRomCurve3 {
  const mid = hub.clone().lerp(end, 0.45);
  mid.x += (end.x - hub.x) * 0.15;
  mid.y += 0.25;
  return new THREE.CatmullRomCurve3([hub.clone(), mid, end.clone()]);
}

function buildStemTube(curve: THREE.CatmullRomCurve3): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 36, 0.042, 10, false),
    glass(P.primary, 0.18, 0.42),
  );
}

function buildFlowOnCurve(curve: THREE.CatmullRomCurve3): { flow: THREE.Points; flowPos: Float32Array } {
  const count = 28;
  const flowPos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const pt = curve.getPoint(i / count);
    flowPos[i * 3] = pt.x;
    flowPos[i * 3 + 1] = pt.y;
    flowPos[i * 3 + 2] = pt.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(flowPos, 3));
  const flow = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: P.primary,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  return { flow, flowPos };
}

function createSeedBranch(index: number, hub: THREE.Vector3): SeedBranch {
  const end = canopyPosition(index);
  const curve = stemCurve(hub, end);
  const stem = buildStemTube(curve);
  stem.scale.setScalar(0.008);
  const { flow, flowPos } = buildFlowOnCurve(curve);
  flow.visible = false;

  const group = new THREE.Group();
  group.position.copy(end);
  group.scale.setScalar(0.01);
  group.visible = false;

  const motif = MOTIFS[index % MOTIFS.length];
  const frame = buildCollageFrame(motif, [P.primary, P.highlight, P.secondary, P.wire][index % 4]);
  frame.position.set(0, 0, -0.55);
  frame.rotation.y = Math.atan2(end.x - hub.x, end.y - hub.y) * 0.35;
  group.add(frame);

  const pod = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 2), glass(P.wire, 0.12, 0.52));
  group.add(pod);

  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), glass(P.primary, 0.45, 0.28));
  bud.position.set(0, 0.12, 0.08);
  bud.scale.y = 0.08;
  group.add(bud);

  const bloomGroup = new THREE.Group();
  bloomGroup.position.set(0, 0.08, 0.05);
  const bloomParts: BloomPart[] = [];
  addPodBloom(bloomGroup, bloomParts);
  bloomGroup.scale.setScalar(0.2);
  group.add(bloomGroup);
  group.userData.bloomGroup = bloomGroup;

  return {
    group,
    frame,
    pod,
    bud,
    bloomParts,
    stem,
    flow,
    flowPos,
    curve,
    hub,
    end,
    reveal: 0,
    motif,
  };
}

/** Layered spec tree: PDF root → trunk stations → branched seed pods with collage frames + bloom. */
export function buildSeedsPipelineScene(): SeedsPipelineScene {
  const root = new THREE.Group();

  const layerBack = new THREE.Group();
  const layerMid = new THREE.Group();
  const layerSpine = new THREE.Group();
  const layerCanopy = new THREE.Group();
  const layerFore = new THREE.Group();
  layerBack.position.z = -6;
  layerMid.position.z = -3;
  layerCanopy.position.z = 0.6;
  layerFore.position.z = 1.8;
  root.add(layerBack, layerMid, layerSpine, layerCanopy, layerFore);

  const { back, filaments, bloomParts: backBloom } = buildDepthLayers();
  layerBack.add(back);

  const spec = buildSpecRoot();
  layerSpine.add(spec.group);

  const spine = buildTrunkSpine();
  layerSpine.add(spine.group);

  const hub = new THREE.Vector3(0, 1.55, 0);
  const branches: SeedBranch[] = [];
  const allBloomParts: BloomPart[] = [...backBloom];

  for (let i = 0; i < MAX_PODS; i++) {
    const branch = createSeedBranch(i, hub);
    layerCanopy.add(branch.stem);
    layerCanopy.add(branch.flow);
    layerCanopy.add(branch.group);
    allBloomParts.push(...branch.bloomParts);
    branches.push(branch);
  }

  const orbitGeo = new THREE.SphereGeometry(0.05, 6, 5);
  const orbitMat = glass(P.secondary, 0.2, 0.55);
  const orbitCount = 36;
  const orbitInst = new THREE.InstancedMesh(orbitGeo, orbitMat, orbitCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < orbitCount; i++) {
    dummy.position.set(0, -1.15, 0);
    dummy.scale.setScalar(0.01);
    dummy.updateMatrix();
    orbitInst.setMatrixAt(i, dummy.matrix);
  }
  orbitInst.instanceMatrix.needsUpdate = true;
  layerFore.add(orbitInst);

  const tick = (t: number, state: SeedsWorkflowState, seeds: SeedPodVisual[], scroll: number) => {
    const phase = phaseIndex(state.phase);
    const count = Math.min(MAX_PODS, seeds.length);
    const energy =
      state.phase === "building"
        ? 0.55 + state.avgBuildProgress * 0.45
        : state.phase === "uploading"
          ? 0.65
          : state.phase === "verifying"
            ? 0.6
            : state.phase === "complete"
              ? 1
              : 0.25;

    layerBack.position.y = -scroll * 0.35;
    layerMid.position.y = -scroll * 0.55;
    layerSpine.position.y = -scroll * 0.75;
    layerCanopy.position.y = -scroll * 0.9;
    layerFore.position.y = -scroll * 1.05;

    const specLit = phase >= 1 ? 1 : 0.22;
    spec.pages.forEach((page, i) => {
      (page.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.1 + specLit * (0.35 - i * 0.06);
    });
    spec.scan.position.y = ((t * 0.85) % 1.8) * 0.95 - 0.85;
    (spec.scan.material as THREE.MeshBasicMaterial).opacity =
      state.phase === "uploading" ? 0.82 : phase >= 2 ? 0.22 : 0.06;

    spine.parseCore.visible = phase >= 1;
    spine.innerCore.visible = phase >= 1;
    spine.parseCore.rotation.y = t * 0.28;
    spine.innerCore.rotation.y = -t * 0.42;
    (spine.parseCore.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
      state.phase === "uploading" ? 0.55 + Math.sin(t * 3.5) * 0.12 : 0.35 + energy * 0.25;

    spine.ingestFlow.visible = state.phase === "uploading";
    if (state.phase === "uploading") {
      for (let i = 0; i < 48; i++) {
        const u = ((t * 0.45 + i * 0.02) % 1);
        const pt = spine.ingestCurve.getPoint(u);
        spine.ingestPos[i * 3] = pt.x;
        spine.ingestPos[i * 3 + 1] = pt.y;
        spine.ingestPos[i * 3 + 2] = pt.z;
      }
      (spine.ingestFlow.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    spine.rings.forEach((ring, i) => {
      const lit =
        (i === 0 && phase >= 1) || (i === 1 && phase >= 3) || (i === 2 && phase >= 2);
      (ring.material as THREE.MeshStandardMaterial).emissiveIntensity = lit
        ? 0.15 + energy * 0.35
        : 0.05;
      ring.rotation.z = t * (0.08 + i * 0.04);
    });

    (spine.verifyRing.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
      state.phase === "verifying" ? 0.5 + Math.sin(t * 4) * 0.18 : phase >= 3 ? 0.22 : 0.08;
    spine.verifyShield.rotation.y = -t * 0.2;
    if (state.phase === "verifying") {
      const wave = (t * 0.4) % 1;
      spine.verifyShield.scale.setScalar(0.88 + Math.sin(wave * Math.PI) * 0.14);
      spine.verifyShield.position.y = 0.05 + wave * 1.2;
    } else {
      spine.verifyShield.scale.setScalar(1);
      spine.verifyShield.position.y = 0.05;
    }

    spine.branchHub.visible = phase >= 2;
    spine.branchHub.rotation.y = t * 0.14;
    (spine.branchHub.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.2 + energy * 0.4;

    const filamentTarget = phase >= 2 ? 3.2 + count * 0.35 : phase >= 1 ? 1.2 : 0.35;
    filaments.forEach((fil) => {
      fil.targetLen = filamentTarget;
      fil.currentLen = THREE.MathUtils.lerp(fil.currentLen, fil.targetLen, 0.04);
      const len = fil.currentLen;
      for (let s = 0; s < 40; s++) {
        const f = s / 39;
        const wobble = Math.sin(f * 7 + t + fil.phase) * 0.12 * f;
        const r = f * len;
        fil.positions[s * 3] = Math.cos(fil.angle) * r - Math.sin(fil.angle) * wobble;
        fil.positions[s * 3 + 1] = Math.sin(fil.angle) * r * 0.75 + f * 0.5 - 1.2;
        fil.positions[s * 3 + 2] = -2 - f * 2.5;
      }
      (fil.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (fil.line.material as THREE.LineBasicMaterial).opacity = 0.12 + energy * 0.28;
    });

    const branchRevealTarget = phase >= 2 ? 1 : 0;
    branches.forEach((branch, i) => {
      const active = i < count;
      const seed = seeds[i];
      branch.reveal = THREE.MathUtils.lerp(
        branch.reveal,
        active ? branchRevealTarget : 0,
        active ? 0.045 : 0.1,
      );

      branch.stem.visible = active && branch.reveal > 0.02;
      branch.stem.scale.setScalar(Math.max(0.008, branch.reveal));

      const scale = THREE.MathUtils.lerp(branch.group.scale.x, active ? branchRevealTarget : 0.01, active ? 0.05 : 0.1);
      branch.group.scale.setScalar(scale);
      branch.group.visible = scale > 0.03;

      if (!active || !seed) {
        branch.flow.visible = false;
        return;
      }

      const accent = podAccent(seed.status, state.phase, i);
      const e = podEnergy(seed.status, seed.buildProgress, state.phase);
      (branch.pod.material as THREE.MeshPhysicalMaterial).emissive.set(accent);
      (branch.pod.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.12 + e * 0.58;

      const fill = seed.status === "complete" ? 1 : seed.buildProgress / 100;
      branch.bud.scale.y = THREE.MathUtils.lerp(branch.bud.scale.y, 0.08 + fill * 0.92, 0.07);
      (branch.bud.material as THREE.MeshPhysicalMaterial).emissive.set(
        seed.status === "complete" ? P.primary : P.secondary,
      );

      const bloomGroup = branch.group.userData.bloomGroup as THREE.Group;
      const bloomOpen = seed.status === "complete" ? 1 : fill * 0.85;
      bloomGroup.scale.setScalar(0.15 + bloomOpen * 0.95);

      branch.bloomParts.forEach((part) => {
        part.material.userData.bloomUniform.value =
          part.baseBloom + bloomOpen * 0.55 + Math.sin(t * 1.2 + part.phase) * 0.04;
        part.material.userData.timeUniform.value = t;
      });

      const innerBars = branch.frame.userData.innerBars as THREE.Mesh[] | undefined;
      innerBars?.forEach((bar, b) => {
        bar.scale.x = 0.9 + Math.sin(t * 1.5 + i + b) * 0.05 * (seed.status === "building" ? 1.4 : 1);
      });

      const flowing =
        (state.phase === "building" && (seed.status === "building" || seed.status === "queued")) ||
        state.phase === "verifying";
      branch.flow.visible = flowing && branch.reveal > 0.45;
      if (branch.flow.visible) {
        const speed = state.phase === "building" ? 1.6 : 0.85;
        for (let p = 0; p < 28; p++) {
          const u = ((t * speed * 0.22 + p * 0.035 + i * 0.04) % 1);
          const pt = branch.curve.getPoint(u);
          branch.flowPos[p * 3] = pt.x;
          branch.flowPos[p * 3 + 1] = pt.y;
          branch.flowPos[p * 3 + 2] = pt.z;
        }
        (branch.flow.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (branch.flow.material as THREE.PointsMaterial).opacity = 0.3 + e * 0.45;
      }
    });

    allBloomParts.forEach((part) => {
      part.material.userData.bloomUniform.value =
        part.baseBloom + energy * 0.35 + Math.sin(t * 0.9 + part.phase) * 0.03;
      part.material.userData.timeUniform.value = t;
    });

    const orbitActive = phase >= 1;
    for (let i = 0; i < orbitCount; i++) {
      const a = (i / orbitCount) * Math.PI * 2 + t * 0.35;
      const r = 0.55 + (i % 5) * 0.14;
      dummy.position.set(
        Math.cos(a) * r,
        -1.15 + Math.sin(a * 2 + t) * 0.12,
        Math.sin(a) * r * 0.35,
      );
      dummy.scale.setScalar(orbitActive ? 0.5 + energy * 0.6 : 0.01);
      dummy.updateMatrix();
      orbitInst.setMatrixAt(i, dummy.matrix);
    }
    orbitInst.instanceMatrix.needsUpdate = true;
  };

  return { root, tick };
};
