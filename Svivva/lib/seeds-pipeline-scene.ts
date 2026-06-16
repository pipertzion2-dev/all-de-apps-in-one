import * as THREE from "three";
import { GRAPHIC_PALETTES } from "@/lib/artwork-palettes";
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

type PodSlot = {
  group: THREE.Group;
  shell: THREE.Mesh;
  core: THREE.Mesh;
  branch: THREE.Mesh;
  flow: THREE.Points;
  flowPos: Float32Array;
  hub: THREE.Vector3;
  end: THREE.Vector3;
  reveal: number;
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

function podColor(status: string, phase: SeedsWorkflowState["phase"]): number {
  if (status === "complete") return P.primary;
  if (status === "building" || status === "queued") return P.secondary;
  if (status === "error") return 0xc04040;
  if (phase === "verifying") return P.highlight;
  return P.wire;
}

function podEnergy(status: string, progress: number, phase: SeedsWorkflowState["phase"]): number {
  if (status === "complete") return 1;
  if (status === "building") return 0.45 + (progress / 100) * 0.55;
  if (status === "queued" && phase === "building") return 0.35;
  if (phase === "verifying") return 0.55;
  if (phase === "parsed") return 0.3;
  return 0.12;
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

function buildStaffLines(): THREE.Group {
  const g = new THREE.Group();
  for (let s = 0; s < 5; s++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.028, 0.01),
      new THREE.MeshBasicMaterial({
        color: P.wire,
        transparent: true,
        opacity: 0.14,
      }),
    );
    bar.position.set(0, 2.8 - s * 0.55, -6);
    g.add(bar);
  }
  return g;
}

function buildSpecDocument(): {
  group: THREE.Group;
  body: THREE.Mesh;
  scan: THREE.Mesh;
  lines: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.position.set(-6.2, 0.15, 0);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.8, 0.12), glass(P.primary, 0.18, 0.42));
  group.add(body);

  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.38, 2.84, 0.14)),
    new THREE.LineBasicMaterial({ color: P.primary, transparent: true, opacity: 0.75 }),
  );
  group.add(rim);

  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.18),
    new THREE.MeshBasicMaterial({ color: P.secondary, transparent: true, opacity: 0.65 }),
  );
  badge.position.set(0, 1.18, 0.07);
  group.add(badge);

  const lines: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const w = 0.85 - (i % 3) * 0.12;
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.022, 0.015),
      new THREE.MeshBasicMaterial({
        color: i % 4 === 0 ? P.primary : i % 4 === 1 ? P.secondary : P.tertiary,
        transparent: true,
        opacity: 0.28 + (i % 3) * 0.08,
      }),
    );
    line.position.set(0, 0.85 - i * 0.17, 0.07);
    group.add(line);
    lines.push(line);
  }

  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.05),
    new THREE.MeshBasicMaterial({
      color: P.primary,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scan.position.z = 0.08;
  group.add(scan);

  return { group, body, scan, lines };
}

function buildParseCore(): THREE.Mesh {
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 1), glass(P.tertiary, 0.45, 0.62));
  core.position.set(-2.4, 0.1, 0);
  return core;
}

function buildVerifyGate(): { group: THREE.Group; ring: THREE.Mesh; shield: THREE.LineSegments } {
  const group = new THREE.Group();
  group.position.set(0.8, 0.05, 0);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.045, 12, 6),
    glass(P.highlight, 0.35, 0.35),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const shield = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.62, 0)),
    new THREE.LineBasicMaterial({ color: P.primary, transparent: true, opacity: 0.85 }),
  );
  group.add(shield);

  return { group, ring, shield };
}

function buildBranchHub(): THREE.Mesh {
  const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), glass(P.primary, 0.38, 0.48));
  hub.position.set(3.2, 0.05, 0);
  return hub;
}

function podEndPosition(index: number, total: number): THREE.Vector3 {
  const spread = Math.min(total, MAX_PODS);
  const t = spread <= 1 ? 0.5 : index / (spread - 1);
  const angle = -Math.PI * 0.42 + t * Math.PI * 0.84;
  const radius = 2.35 + (index % 2) * 0.35;
  return new THREE.Vector3(
    3.2 + Math.cos(angle) * radius,
    Math.sin(angle) * radius * 0.72,
    Math.sin(angle * 1.4) * 0.35,
  );
}

function buildBranchTube(from: THREE.Vector3, to: THREE.Vector3): THREE.Mesh {
  const mid = from.clone().lerp(to, 0.5);
  mid.y += 0.35;
  const curve = new THREE.CatmullRomCurve3([from, mid, to]);
  const geo = new THREE.TubeGeometry(curve, 32, 0.045, 8, false);
  return new THREE.Mesh(geo, glass(P.wire, 0.15, 0.38));
}

function buildFlowParticles(curve: THREE.Curve<THREE.Vector3>): THREE.Points {
  const count = 24;
  const flowPos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const p = curve.getPoint(i / count);
    flowPos[i * 3] = p.x;
    flowPos[i * 3 + 1] = p.y;
    flowPos[i * 3 + 2] = p.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(flowPos, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: P.primary,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
}

function createPodSlot(index: number): PodSlot {
  const hub = new THREE.Vector3(3.2, 0.05, 0);
  const end = podEndPosition(index, MAX_PODS);
  const branch = buildBranchTube(hub, end);
  branch.scale.set(1, 0.01, 1);

  const curve = new THREE.CatmullRomCurve3([
    hub,
    hub.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.35, 0)),
    end,
  ]);
  const flow = buildFlowParticles(curve);

  const group = new THREE.Group();
  group.position.copy(end);
  group.scale.setScalar(0.01);
  group.visible = false;

  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), glass(P.wire, 0.12, 0.52));
  group.add(shell);

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), glass(P.primary, 0.55, 0.25));
  core.scale.y = 0.05;
  group.add(core);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 0.28, 8),
    glass(P.wire, 0.1, 0.3),
  );
  stem.position.y = -0.32;
  group.add(stem);

  return { group, shell, core, branch, flow, flowPos: flow.geometry.attributes.position.array as Float32Array, hub, end, reveal: 0 };
}

function buildParseConduit(specPos: THREE.Vector3, corePos: THREE.Vector3): {
  tube: THREE.Mesh;
  particles: THREE.Points;
  positions: Float32Array;
  curve: THREE.CatmullRomCurve3;
} {
  const curve = new THREE.CatmullRomCurve3([
    specPos.clone(),
    specPos.clone().lerp(corePos, 0.5).add(new THREE.Vector3(0, 0.25, 0)),
    corePos.clone(),
  ]);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, 0.035, 8, false),
    glass(P.primary, 0.22, 0.45),
  );
  tube.visible = false;

  const count = 36;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const p = curve.getPoint(i / count);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: P.tertiary,
      size: 0.055,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  particles.visible = false;

  return { tube, particles, positions, curve };
}

/** Spec → parse → verify → branch pipeline with seed pods tied to real build state. */
export function buildSeedsPipelineScene(): SeedsPipelineScene {
  const root = new THREE.Group();
  root.add(buildStaffLines());

  const spec = buildSpecDocument();
  root.add(spec.group);

  const parseCore = buildParseCore();
  root.add(parseCore);

  const verify = buildVerifyGate();
  verify.group.visible = false;
  root.add(verify.group);

  const branchHub = buildBranchHub();
  branchHub.visible = false;
  root.add(branchHub);

  const conduit = buildParseConduit(
    new THREE.Vector3(-6.2, 0.15, 0),
    parseCore.position.clone(),
  );
  root.add(conduit.tube);
  root.add(conduit.particles);

  const pods: PodSlot[] = [];
  for (let i = 0; i < MAX_PODS; i++) {
    const pod = createPodSlot(i);
    root.add(pod.branch);
    root.add(pod.flow);
    root.add(pod.group);
    pods.push(pod);
  }

  const tick = (t: number, state: SeedsWorkflowState, seeds: SeedPodVisual[], scroll: number) => {
    const phase = phaseIndex(state.phase);
    const count = Math.min(MAX_PODS, seeds.length);

    root.position.y = -scroll * 0.8;
    root.rotation.y = scroll * 0.08;

    const specLit = phase >= 1 ? 1 : 0.25;
    (spec.body.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.15 + specLit * 0.55;
    spec.scan.position.y = ((t * 0.9) % 2.4) * 0.95 - 1.1;
    (spec.scan.material as THREE.MeshBasicMaterial).opacity =
      state.phase === "uploading" ? 0.8 : phase >= 2 ? 0.25 : 0.08;
    spec.lines.forEach((line, i) => {
      line.position.x = Math.sin(t * 0.35 + i) * 0.015 * specLit;
    });

    parseCore.visible = phase >= 1;
    parseCore.rotation.y = t * 0.35;
    parseCore.rotation.x = Math.sin(t * 0.2) * 0.12;
    (parseCore.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
      state.phase === "uploading" ? 0.65 + Math.sin(t * 4) * 0.15 : phase >= 2 ? 0.45 : 0.2;

    conduit.tube.visible = phase >= 1;
    conduit.particles.visible = state.phase === "uploading";
    if (state.phase === "uploading") {
      for (let i = 0; i < 36; i++) {
        const u = ((t * 0.55 + i * 0.028) % 1);
        const p = conduit.curve.getPoint(u);
        conduit.positions[i * 3] = p.x;
        conduit.positions[i * 3 + 1] = p.y;
        conduit.positions[i * 3 + 2] = p.z;
      }
      (conduit.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    verify.group.visible = phase >= 3;
    verify.group.scale.setScalar(phase >= 3 ? 1 : 0.01);
    verify.ring.rotation.z = t * 0.4;
    (verify.ring.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
      state.phase === "verifying" ? 0.55 + Math.sin(t * 5) * 0.2 : 0.25;
    verify.shield.rotation.y = -t * 0.25;

    branchHub.visible = phase >= 2;
    branchHub.rotation.y = t * 0.18;

    const branchTarget = phase >= 2 ? 1 : 0;
    const podTarget = phase >= 2 ? 1 : 0;

    pods.forEach((pod, i) => {
      const active = i < count;
      const seed = seeds[i];
      const targetReveal = active ? branchTarget : 0;
      pod.reveal = THREE.MathUtils.lerp(pod.reveal, targetReveal, active ? 0.05 : 0.1);

      pod.branch.visible = active && pod.reveal > 0.02;
      pod.branch.scale.y = pod.reveal;

      const targetScale = active ? podTarget : 0.01;
      const scale = THREE.MathUtils.lerp(pod.group.scale.x, targetScale, active ? 0.06 : 0.12);
      pod.group.scale.setScalar(scale);
      pod.group.visible = scale > 0.03;

      if (!active || !seed) {
        pod.flow.visible = false;
        return;
      }

      const color = podColor(seed.status, state.phase);
      const energy = podEnergy(seed.status, seed.buildProgress, state.phase);
      (pod.shell.material as THREE.MeshPhysicalMaterial).emissive.set(color);
      (pod.shell.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.12 + energy * 0.55;

      const fill = seed.status === "complete" ? 1 : seed.buildProgress / 100;
      pod.core.scale.y = THREE.MathUtils.lerp(pod.core.scale.y, 0.08 + fill * 0.92, 0.08);
      (pod.core.material as THREE.MeshPhysicalMaterial).emissive.set(
        seed.status === "complete" ? P.primary : P.secondary,
      );

      const flowing =
        state.phase === "building" &&
        (seed.status === "building" || seed.status === "queued") &&
        pod.reveal > 0.5;
      pod.flow.visible = flowing || (state.phase === "verifying" && pod.reveal > 0.5);
      if (pod.flow.visible) {
        const speed = state.phase === "building" ? 1.8 : 0.9;
        const curve = new THREE.CatmullRomCurve3([
          pod.hub,
          pod.hub.clone().lerp(pod.end, 0.5).add(new THREE.Vector3(0, 0.35, 0)),
          pod.end,
        ]);
        for (let p = 0; p < 24; p++) {
          const u = ((t * speed * 0.25 + p * 0.04) % 1);
          const pt = curve.getPoint(u);
          pod.flowPos[p * 3] = pt.x;
          pod.flowPos[p * 3 + 1] = pt.y;
          pod.flowPos[p * 3 + 2] = pt.z;
        }
        (pod.flow.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (pod.flow.material as THREE.PointsMaterial).opacity =
          state.phase === "verifying" ? 0.35 + Math.sin(t * 4 + i) * 0.15 : 0.45 + energy * 0.35;
      }

      pod.group.position.y = pod.end.y + Math.sin(t * 0.7 + i * 0.9) * 0.04 * energy;
    });

    if (state.phase === "verifying") {
      const wave = (t * 0.35) % 1;
      verify.shield.scale.setScalar(0.85 + Math.sin(wave * Math.PI) * 0.12);
    } else {
      verify.shield.scale.setScalar(1);
    }
  };

  return { root, tick };
}
