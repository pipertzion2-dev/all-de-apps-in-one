import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { GraphicPalette } from "@/lib/artwork-palettes";

export type AdvancedMeshScene = {
  group: THREE.Group;
  tick: (t: number, scroll: number, mouse?: { x: number; y: number }) => void;
};

function glass(
  color: number,
  opts?: { transmission?: number; metalness?: number; emissive?: number },
) {
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
  const panels: THREE.Group[] = [];

  // Music staff — solid thin bars (SETTLE DOWN header)
  for (let s = 0; s < 5; s++) {
    const staff = new THREE.Mesh(
      new THREE.BoxGeometry(13.5, 0.035, 0.025),
      metal(s % 2 === 0 ? p.primary : p.highlight, 0.28),
    );
    staff.position.set(0, 2.35 - s * 0.52, -1.8);
    group.add(staff);
  }

  // Central spec core — glass dodecahedron seed
  const core = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.05, 2),
    glass(p.tertiary, { emissive: 0.42, transmission: 0.62 }),
  );
  core.position.set(0, 0.1, 0.4);
  group.add(core);

  const innerCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    glass(p.highlight, { emissive: 0.55, transmission: 0.35, metalness: 0.65 }),
  );
  innerCore.position.set(0, 0.1, 0.4);
  group.add(innerCore);

  // Four satellite seed pods
  const podGroups: THREE.Group[] = [];
  const positions: [number, number, number][] = [
    [-2.55, 1.55, -0.35],
    [2.45, 1.35, -0.55],
    [-2.35, -1.45, -0.2],
    [2.55, -1.25, -0.45],
  ];
  const colors = [p.primary, p.highlight, p.secondary, p.wire];
  const motifs: Array<"gold" | "purple" | "grain" | "courtyard"> = [
    "gold",
    "purple",
    "grain",
    "courtyard",
  ];

  positions.forEach(([x, y, z], i) => {
    const podGroup = new THREE.Group();

    const pod = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.78, 2),
      glass(colors[i], { transmission: 0.55, emissive: 0.32 }),
    );
    podGroup.add(pod);

    const bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 12),
      glass(p.tertiary, { transmission: 0.48, emissive: 0.38 }),
    );
    bud.position.set(0, 0.35, 0.12);
    podGroup.add(bud);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.1, 0.25),
      new THREE.Vector3(x * 0.3, y * 0.3 + 0.1, 0.05),
      new THREE.Vector3(x * 0.7, y * 0.7, -0.05),
      new THREE.Vector3(x, y, z),
    ]);
    const stem = tubeAlong(curve, p.primary, 0.052, 52);
    group.add(stem);

    // Collage frame panel behind each pod
    const frameGroup = new THREE.Group();
    const frameBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 1.65, 0.1),
      glass(colors[i], { transmission: 0.42, metalness: 0.52 }),
    );
    frameGroup.add(frameBody);

    const frameRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.04, 8, 24),
      metal(p.highlight, 0.15),
    );
    frameRim.position.z = 0.08;
    if (motifs[i] === "purple") frameRim.scale.set(1, 1.35, 1);
    frameGroup.add(frameRim);

    const accent =
      motifs[i] === "grain"
        ? new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.04), metal(p.secondary, 0.2))
        : new THREE.Mesh(
            new THREE.OctahedronGeometry(0.28, 0),
            glass(p.wire, { transmission: 0.5 }),
          );
    accent.position.set(0, motifs[i] === "courtyard" ? -0.35 : 0, 0.1);
    frameGroup.add(accent);

    frameGroup.position.set(x * 0.55, y * 0.55, z - 1.1);
    frameGroup.rotation.z = Math.atan2(y, x) * 0.15;
    group.add(frameGroup);
    panels.push(frameGroup);

    podGroup.position.set(x, y, z);
    podGroup.userData.podIndex = i;
    group.add(podGroup);
    podGroups.push(podGroup);
  });

  // Orbiting spec particles
  const particleGeo = new THREE.SphereGeometry(0.09, 10, 10);
  const particleMat = glass(p.secondary, { transmission: 0.68, emissive: 0.22 });
  const count = 42;
  const inst = new THREE.InstancedMesh(particleGeo, particleMat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 1.35 + (i % 5) * 0.38;
    dummy.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.72, (i % 3) * 0.22 - 0.15);
    dummy.scale.setScalar(0.65 + (i % 4) * 0.14);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  group.add(inst);

  group.userData.seedsRefs = { core, innerCore, pods: podGroups, panels };

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    const mx = mouse?.x ?? 0;
    const my = mouse?.y ?? 0;
    core.rotation.y = t * 0.35 + scroll * 1.2 + mx * 0.15;
    core.rotation.x = Math.sin(t * 0.4) * 0.15 + my * 0.08;
    innerCore.rotation.y = -t * 0.5 - scroll * 0.8;
    innerCore.scale.setScalar(1 + Math.sin(t * 0.7) * 0.06 + scroll * 0.08);
    panels.forEach((panel, i) => {
      panel.rotation.y = Math.sin(t * 0.25 + i) * 0.08 + scroll * 0.2;
      panel.position.z += Math.sin(t * 0.5 + i * 1.2) * 0.002;
    });
    inst.rotation.z = t * 0.1 + scroll * 0.45;
    group.rotation.y = mx * 0.04;
    group.rotation.x = my * 0.03;
  };

  return { group, tick };
}

function buildPlayCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();

  // ── Staff lines — 5 horizontal strings like a music staff ────────────────
  const staffLines: THREE.Mesh[] = [];
  for (let s = 0; s < 5; s++) {
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 13, 8),
      metal(s % 2 === 0 ? p.primary : p.highlight, 0.22),
    );
    line.rotation.z = Math.PI / 2;
    line.position.set(0, 2.2 - s * 0.52, -2.2);
    staffLines.push(line);
    group.add(line);
  }

  // ── Note heads — pitched across the staff, 8 notes (hocket voices) ────────
  const PITCHES = [0, 1, 2, 0.5, 3, 1.5, 2.5, 0.25]; // staff position offsets
  const noteGroups: THREE.Group[] = [];
  PITCHES.forEach((pitch, i) => {
    const noteGroup = new THREE.Group();

    // Oval note head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 14),
      glass(i % 3 === 0 ? p.primary : i % 3 === 1 ? p.secondary : p.tertiary, {
        transmission: 0.45,
        emissive: 0.38,
      }),
    );
    head.scale.set(1.3, 0.82, 0.68);
    noteGroup.add(head);

    // Note stem
    const stemDir = i % 2 === 0 ? 1 : -1;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 1.05, 8),
      metal(p.highlight, 0.18),
    );
    stem.position.y = stemDir * 0.72;
    noteGroup.add(stem);

    // Flag on eighth notes
    if (i % 3 === 2) {
      const flagCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, stemDir * 0.72, 0),
        new THREE.Vector3(0.35, stemDir * 0.45, 0),
        new THREE.Vector3(0.3, stemDir * 0.2, 0),
      );
      noteGroup.add(tubeAlong(flagCurve, p.wire, 0.022, 16));
    }

    noteGroup.position.set((i - 3.5) * 1.55, 2.2 - pitch * 0.52, -1.8 - i * 0.18);
    noteGroup.rotation.z = (i - 3.5) * 0.05;
    noteGroup.userData.notePhase = i;
    noteGroup.userData.staffPitch = pitch;
    noteGroups.push(noteGroup);
    group.add(noteGroup);
  });

  // ── Meend glide arcs — curved tubes connecting adjacent notes (Indian vocal glide) ──
  const meendArcs: THREE.Mesh[] = [];
  const meendPairs = [
    [0, 1],
    [2, 4],
    [5, 7],
  ];
  meendPairs.forEach(([a, b]) => {
    const na = noteGroups[a]!.position;
    const nb = noteGroups[b]!.position;
    const mid = new THREE.Vector3(
      (na.x + nb.x) / 2,
      Math.max(na.y, nb.y) + 0.65,
      (na.z + nb.z) / 2,
    );
    const arc = tubeAlong(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(na.x, na.y + 0.2, na.z),
        mid,
        new THREE.Vector3(nb.x, nb.y + 0.2, nb.z),
      ),
      p.tertiary,
      0.032,
      28,
    );
    meendArcs.push(arc);
    group.add(arc);
  });

  // ── Harmonic series rings — concentric tori representing overtone partials ──
  const partialRings: THREE.Mesh[] = [];
  [1.4, 2.1, 2.85, 3.6].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.032 - i * 0.005, 10, 56),
      glass(i % 2 === 0 ? p.secondary : p.tertiary, {
        transmission: 0.62,
        emissive: 0.22,
        metalness: 0.35,
      }),
    );
    ring.rotation.x = Math.PI / 2.8 + i * 0.12;
    ring.rotation.z = i * 0.2;
    ring.position.set(0, -0.4, -3.5 - i * 0.35);
    ring.userData.ringIndex = i;
    partialRings.push(ring);
    group.add(ring);
  });

  // ── Vibraphone bars — pitched metal rectangles behind the staff ────────────
  const VIBE_NOTES = [0, 2, 4, 5, 7, 9, 11, 12]; // diatonic intervals
  const vibeBars: THREE.Mesh[] = [];
  VIBE_NOTES.forEach((semitone, i) => {
    const barLength = 0.85 - (semitone / 12) * 0.28;
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, barLength, 0.12),
      metal(i % 2 === 0 ? p.primary : p.secondary, 0.12),
    );
    bar.position.set((i - 3.5) * 0.85, -1.8 + (semitone / 12) * 0.6, -4.5);
    bar.userData.vibeIndex = i;
    bar.userData.semitone = semitone;
    vibeBars.push(bar);
    group.add(bar);

    // Resonator tube below bar
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, barLength * 0.7, 8),
      glass(p.highlight, { transmission: 0.72, metalness: 0.2, emissive: 0.12 }),
    );
    tube.position.set(bar.position.x, bar.position.y - barLength * 0.75, -4.5);
    group.add(tube);
  });

  // ── Multi-voice waveforms — 3 independent voices (soprano / alto / bass) ──
  const waveGroups: { pts: THREE.Vector3[]; tube: THREE.Mesh }[] = [];
  const VOICE_OFFSETS = [0.9, 0, -0.8];
  const VOICE_FREQS = [1.4, 1.0, 0.6];
  const VOICE_COLS = [p.primary, p.tertiary, p.secondary];
  VOICE_OFFSETS.forEach((yOff, v) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const x = (i / 96 - 0.5) * 11;
      pts.push(new THREE.Vector3(x, yOff + Math.sin(x * VOICE_FREQS[v]!) * 0.35, -6.5));
    }
    const tube = tubeAlong(new THREE.CatmullRomCurve3(pts), VOICE_COLS[v]!, 0.048);
    tube.userData.waveVoice = v;
    waveGroups.push({ pts, tube });
    group.add(tube);
  });

  // ── Tick ──────────────────────────────────────────────────────────────────
  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    const mx = mouse?.x ?? 0;

    // Notes breathe up/down on their staff pitch, hocket rhythm
    noteGroups.forEach((ng, i) => {
      const phase = (ng.userData.notePhase as number) * 0.82;
      ng.position.y =
        2.2 -
        (ng.userData.staffPitch as number) * 0.52 +
        Math.sin(t * 1.35 + phase) * 0.09 +
        scroll * 0.06;
      ng.rotation.y = Math.sin(t * 0.55 + phase) * 0.18 + mx * 0.1;
      // Subtle glow pulse — scale the head
      const head = ng.children[0] as THREE.Mesh;
      const pulse = 1 + Math.sin(t * 2.2 + phase) * 0.04;
      head.scale.set(1.3 * pulse, 0.82 * pulse, 0.68 * pulse);
    });

    // Meend arcs sway gently
    meendArcs.forEach((arc, i) => {
      arc.rotation.z = Math.sin(t * 0.4 + i * 1.2) * 0.03;
      arc.position.y = Math.sin(t * 0.6 + i) * 0.04;
    });

    // Harmonic rings spin at harmonic ratios
    partialRings.forEach((ring) => {
      const idx = ring.userData.ringIndex as number;
      ring.rotation.z = t * (0.12 + idx * 0.07) + scroll * 0.55;
      ring.rotation.x = Math.PI / 2.8 + idx * 0.12 + scroll * 0.08;
    });

    // Vibraphone bars: struck animation — bar drops then bounces back
    vibeBars.forEach((bar) => {
      const s = bar.userData.semitone as number;
      const strike = Math.abs(Math.sin(t * 0.9 + s * 0.38));
      bar.position.y = -1.8 + (s / 12) * 0.6 + strike * 0.06 * Math.sin(t * 4.5 + s);
      bar.rotation.z = Math.sin(t * 0.3 + s * 0.22) * 0.015;
    });

    // Waveforms regenerate paths with live t offset
    waveGroups.forEach(({ tube }, v) => {
      // Animate opacity for "hearing" effect
      const mat = tube.material as THREE.MeshPhysicalMaterial;
      mat.opacity = 0.72 + Math.sin(t * 1.1 + v) * 0.18 + Math.abs(mx) * 0.08;
    });

    // Staff strings vibrate subtly
    staffLines.forEach((line, s) => {
      line.rotation.z = Math.PI / 2 + Math.sin(t * 2.8 + s * 0.6) * 0.008;
    });
  };

  return { group, tick };
}

function buildSecurityCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();
  const crystals: THREE.Mesh[] = [];

  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.85 - i * 0.15, 0),
      glass(p.primary, { transmission: 0.62 }),
    );
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
    const node = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.28, 1),
      glass(i % 2 ? p.secondary : p.tertiary),
    );
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
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.2, 0.35),
      glass(p.primary, { transmission: 0.4 }),
    );
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 0.38), metal(p.secondary));
    lid.position.y = 0.66;
    lid.userData.isLid = true;
    caseGroup.add(body, lid);
    caseGroup.position.set((i - 1.5) * 2.4, 0, i * 0.12);
    caseGroup.rotation.y = (i - 1.5) * 0.3;
    group.add(caseGroup);
    lids.push(lid);
  }

  const flower = new THREE.Mesh(
    new THREE.LatheGeometry(
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return new THREE.Vector2(0.35 + Math.sin(a * 5) * 0.12, i * 0.08);
      }),
      24,
    ),
    glass(p.highlight, { transmission: 0.55 }),
  );
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

export function buildAdvancedGraphicCluster(
  variant: FeatureId,
  palette: GraphicPalette,
): AdvancedMeshScene {
  return BUILDERS[variant](palette);
}
