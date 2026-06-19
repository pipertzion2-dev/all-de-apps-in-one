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

  // Blueprint grid — faint horizontal + vertical trace lines (architectural drawing)
  for (let g = 0; g < 6; g++) {
    const hLine = new THREE.Mesh(new THREE.BoxGeometry(11, 0.018, 0.012), metal(p.wire, 0.42));
    hLine.position.set(0, 2.6 - g * 0.85, -2.4);
    group.add(hLine);
  }
  for (let g = 0; g < 8; g++) {
    const vLine = new THREE.Mesh(new THREE.BoxGeometry(0.018, 4.8, 0.012), metal(p.wire, 0.38));
    vLine.position.set(-3.5 + g * 1.0, 0, -2.4);
    group.add(vLine);
  }

  // Central spec core — glass dodecahedron (the compiled "seed")
  const core = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.95, 2),
    glass(p.tertiary, { emissive: 0.48, transmission: 0.58 }),
  );
  core.position.set(0, 0.1, 0.4);
  group.add(core);

  const innerCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.38, 1),
    glass(p.highlight, { emissive: 0.6, transmission: 0.32, metalness: 0.68 }),
  );
  innerCore.position.set(0, 0.1, 0.4);
  group.add(innerCore);

  // Stack layer slabs — frontend / backend / database / auth (float above each other)
  const LAYER_LABELS = ["auth", "database", "backend", "frontend"];
  const layerSlabs: THREE.Mesh[] = [];
  LAYER_LABELS.forEach((_, i) => {
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(3.2 - i * 0.3, 0.08, 1.8 - i * 0.15),
      glass([p.primary, p.secondary, p.tertiary, p.highlight][i], {
        transmission: 0.52,
        metalness: 0.45,
        emissive: 0.22,
      }),
    );
    slab.position.set(-3.8, -1.2 + i * 0.72, -1.5 - i * 0.2);
    slab.rotation.x = 0.18;
    layerSlabs.push(slab);
    group.add(slab);
    // connector pin on each slab
    for (let p2 = 0; p2 < 4; p2++) {
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6),
        metal(p.wire, 0.2),
      );
      pin.position.set(-1.4 + p2 * 0.95, 0.15, 0);
      slab.add(pin);
    }
  });

  // Four satellite service pods with technical stems
  const podGroups: THREE.Group[] = [];
  const positions: [number, number, number][] = [
    [-2.45, 1.45, -0.35],
    [2.35, 1.25, -0.55],
    [-2.25, -1.35, -0.2],
    [2.45, -1.15, -0.45],
  ];
  const colors = [p.primary, p.highlight, p.secondary, p.wire];

  positions.forEach(([x, y, z], i) => {
    const podGroup = new THREE.Group();
    const pod = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.72, 2),
      glass(colors[i], { transmission: 0.5, emissive: 0.3 }),
    );
    podGroup.add(pod);

    // Frame panel behind pod (architectural section view)
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 1.5, 0.08),
      glass(colors[i], { transmission: 0.38, metalness: 0.55 }),
    );
    frame.position.set(0, 0, -0.65);
    podGroup.add(frame);
    // Corner brackets
    [
      [0.7, 0.6],
      [-0.7, 0.6],
      [0.7, -0.6],
      [-0.7, -0.6],
    ].forEach(([bx, by]) => {
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.04, 0.04),
        metal(p.highlight, 0.15),
      );
      bracket.position.set(bx, by, -0.61);
      podGroup.add(bracket);
    });

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.1, 0.3),
      new THREE.Vector3(x * 0.28, y * 0.28, 0.0),
      new THREE.Vector3(x * 0.68, y * 0.68, -0.1),
      new THREE.Vector3(x, y, z),
    ]);
    group.add(tubeAlong(curve, p.primary, 0.045, 44));

    podGroup.position.set(x, y, z);
    podGroup.userData.podIndex = i;
    group.add(podGroup);
    podGroups.push(podGroup);
    panels.push(frame as unknown as THREE.Group);
  });

  // Git-log spiral particles
  const commitCount = 36;
  const commits: THREE.Mesh[] = [];
  for (let i = 0; i < commitCount; i++) {
    const a = (i / commitCount) * Math.PI * 6;
    const r = 0.55 + i * 0.05;
    const commit = new THREE.Mesh(
      new THREE.SphereGeometry(0.06 + (i % 3) * 0.015, 8, 6),
      glass(i % 2 === 0 ? p.secondary : p.primary, { transmission: 0.65, emissive: 0.2 }),
    );
    commit.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.52, 0.3 - i * 0.04);
    commit.userData.commitPhase = i;
    commits.push(commit);
    group.add(commit);
  }

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    const mx = mouse?.x ?? 0;
    const my = mouse?.y ?? 0;
    core.rotation.y = t * 0.3 + scroll * 1.0 + mx * 0.12;
    core.rotation.x = Math.sin(t * 0.38) * 0.14 + my * 0.07;
    innerCore.rotation.y = -t * 0.45 - scroll * 0.75;
    innerCore.scale.setScalar(1 + Math.sin(t * 0.65) * 0.055 + scroll * 0.07);

    layerSlabs.forEach((slab, i) => {
      slab.position.y = -1.2 + i * 0.72 + Math.sin(t * 0.5 + i * 0.8) * 0.04 + scroll * 0.12;
      slab.rotation.y = Math.sin(t * 0.2 + i * 0.5) * 0.04 + mx * 0.03;
    });

    podGroups.forEach((pg, i) => {
      pg.rotation.y = Math.sin(t * 0.22 + i) * 0.06 + scroll * 0.18;
      pg.rotation.x = Math.sin(t * 0.18 + i * 0.7) * 0.04;
    });

    commits.forEach((c) => {
      const phase = c.userData.commitPhase as number;
      const a = (phase / commitCount) * Math.PI * 6 + t * 0.12;
      const r = 0.55 + phase * 0.05;
      c.position.x = Math.cos(a) * r;
      c.position.y = Math.sin(a) * r * 0.52;
      (c.material as THREE.MeshPhysicalMaterial).opacity =
        0.55 + 0.3 * Math.sin(t * 1.2 + phase * 0.4);
    });

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

  // ── Vault door — circular plate + combination dial rings ──────────────────
  const vaultPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 1.85, 0.22, 48),
    glass(p.primary, { transmission: 0.22, metalness: 0.72, emissive: 0.18 }),
  );
  vaultPlate.rotation.x = Math.PI / 2;
  group.add(vaultPlate);

  // Combination dial rings
  const dialRings: THREE.Mesh[] = [];
  [1.45, 1.65, 1.8].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.055, 10, 52),
      metal(i % 2 === 0 ? p.secondary : p.highlight, 0.12),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.z = 0.02 + i * 0.04;
    ring.userData.dialIndex = i;
    dialRings.push(ring);
    group.add(ring);
  });

  // Locking bolt arms (6 radial arms extending from vault center)
  const boltArms: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.12), metal(p.tertiary, 0.08));
    bolt.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.85, 0.16);
    bolt.rotation.z = angle;
    bolt.userData.boltIndex = i;
    boltArms.push(bolt);
    group.add(bolt);
  }

  // Central eye / keyhole
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 18, 14),
    glass(p.highlight, { emissive: 0.68, transmission: 0.38, metalness: 0.55 }),
  );
  eye.position.z = 0.22;
  group.add(eye);

  // Crystal lattice cage — 8 crystal nodes at cube corners around vault
  const latticeNodes: THREE.Mesh[] = [];
  const latticeEdges: THREE.Mesh[] = [];
  const corners: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const x = (i & 1 ? 1 : -1) * 2.4;
    const y = (i & 2 ? 1 : -1) * 2.4;
    const z = i & 4 ? 0.8 : -2.2;
    corners.push(new THREE.Vector3(x, y, z));
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      glass(i % 2 === 0 ? p.secondary : p.tertiary, { transmission: 0.58, emissive: 0.32 }),
    );
    crystal.position.set(x, y, z);
    crystal.scale.y = 1.35;
    crystal.userData.crystalIndex = i;
    latticeNodes.push(crystal);
    group.add(crystal);
  }

  // Lattice edges (12 edges of a cube — connect adjacent corners)
  [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ].forEach(([a, b]) => {
    const ca = corners[a]!;
    const cb = corners[b]!;
    const edge = tubeAlong(new THREE.CatmullRomCurve3([ca, cb]), p.wire, 0.018, 2);
    latticeEdges.push(edge as THREE.Mesh);
    group.add(edge);
  });

  // Orbiting encrypted fragments
  const fragments: THREE.Mesh[] = [];
  for (let i = 0; i < 16; i++) {
    const frag = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09 + (i % 3) * 0.04, 0),
      glass(i % 3 === 0 ? p.primary : i % 3 === 1 ? p.secondary : p.highlight, {
        transmission: 0.7,
        emissive: 0.25,
      }),
    );
    frag.userData.fragPhase = i;
    fragments.push(frag);
    group.add(frag);
  }

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    const mx = mouse?.x ?? 0;

    // Dial rings rotate at different speeds (combination lock)
    dialRings.forEach((ring) => {
      const idx = ring.userData.dialIndex as number;
      ring.rotation.z = t * (0.18 + idx * 0.12) * (idx % 2 === 0 ? 1 : -1);
    });

    // Bolt arms extend/retract based on scroll (locking/unlocking)
    boltArms.forEach((bolt) => {
      const idx = bolt.userData.boltIndex as number;
      const angle = (idx / 6) * Math.PI * 2;
      const extension = 0.85 + scroll * 0.35 + Math.sin(t * 0.4 + idx * 0.5) * 0.05;
      bolt.position.set(Math.cos(angle) * extension, Math.sin(angle) * extension, 0.16);
    });

    // Eye pulses
    const eyePulse = 1 + Math.sin(t * 1.8) * 0.08;
    eye.scale.setScalar(eyePulse);

    // Crystal nodes breathe
    latticeNodes.forEach((c) => {
      const idx = c.userData.crystalIndex as number;
      c.rotation.y = t * 0.22 * (idx % 2 ? 1 : -1);
      c.rotation.x = Math.sin(t * 0.35 + idx) * 0.12;
      c.scale.y = 1.35 + Math.sin(t * 0.8 + idx * 0.6) * 0.08;
    });

    // Fragments orbit at different radii and elevations
    fragments.forEach((frag) => {
      const phase = frag.userData.fragPhase as number;
      const r = 2.6 + (phase % 5) * 0.4;
      const a = t * (0.35 + phase * 0.03) + phase * 0.7;
      frag.position.set(
        Math.cos(a) * r,
        Math.sin(a * 0.7) * 1.2 + ((phase % 3) - 1) * 0.8,
        -1.0 + (phase % 4) * 0.5,
      );
      frag.rotation.x = t * 0.5 + phase;
      frag.rotation.y = t * 0.4;
    });

    group.rotation.y = mx * 0.05 + Math.sin(t * 0.08) * 0.02;
    group.rotation.x = (mouse?.y ?? 0) * 0.03;
  };

  return { group, tick };
}

function buildOrbitCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();

  // ── Central intelligence eye ──────────────────────────────────────────────
  const eyeCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 22, 18),
    glass(p.primary, { emissive: 0.52, transmission: 0.35, metalness: 0.6 }),
  );
  group.add(eyeCore);

  const eyeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.055, 10, 40),
    metal(p.highlight, 0.18),
  );
  eyeRing.rotation.x = Math.PI / 2;
  group.add(eyeRing);

  // ── Radar sweep arm ───────────────────────────────────────────────────────
  const radarArm = new THREE.Group();
  const armBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.025), metal(p.secondary, 0.08));
  armBody.position.x = 1.4;
  radarArm.add(armBody);

  // Sweep fill — very thin plane (the green radar sweep)
  const sweepGeo = new THREE.PlaneGeometry(2.8, 0.04);
  const sweepPlane = new THREE.Mesh(
    sweepGeo,
    new THREE.MeshPhysicalMaterial({
      color: p.tertiary,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  sweepPlane.position.x = 1.4;
  radarArm.add(sweepPlane);
  group.add(radarArm);

  // Radar range rings (flat, tilted like a radar dish)
  const radarRings: THREE.Mesh[] = [];
  [1.2, 2.1, 3.0, 3.8].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.018, 8, 44),
      metal(i % 2 === 0 ? p.tertiary : p.wire, 0.22),
    );
    ring.rotation.x = Math.PI / 2.4;
    radarRings.push(ring);
    group.add(ring);
  });

  // ── Multi-altitude growth nodes ───────────────────────────────────────────
  // Three orbit tiers: inner (close), mid, outer — 8 systems monitored
  const NODE_CONFIG = [
    { r: 1.45, count: 3, y: 0.2, color: p.secondary },
    { r: 2.4, count: 4, y: -0.15, color: p.tertiary },
    { r: 3.3, count: 1, y: 0.35, color: p.highlight },
  ];
  const allNodes: Array<{ mesh: THREE.Mesh; tier: number; phase: number }> = [];

  NODE_CONFIG.forEach(({ r, count, y, color }, tier) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const node = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.2 + tier * 0.05, 1),
        glass(color, { emissive: 0.38, transmission: 0.45 }),
      );
      node.position.set(Math.cos(a) * r, y + Math.sin(a) * r * 0.28, 0.1);
      node.userData.r = r;
      node.userData.baseA = a;
      node.userData.y = y;
      allNodes.push({ mesh: node, tier, phase: i });
      group.add(node);

      // Signal tube from central eye to each node
      const nodePos = node.position.clone();
      const midPt = nodePos.clone().multiplyScalar(0.5);
      midPt.z += 0.6;
      group.add(
        tubeAlong(
          new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), midPt, nodePos),
          p.wire,
          0.018,
          18,
        ),
      );
    }
  });

  // ── Growth trajectory arc rising upward ───────────────────────────────────
  const growthArc = tubeAlong(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, -1.6, 0.2),
      new THREE.Vector3(-0.8, -0.6, 0.5),
      new THREE.Vector3(0.6, 0.4, 0.6),
      new THREE.Vector3(2.0, 1.5, 0.4),
      new THREE.Vector3(3.2, 2.4, 0.1),
    ]),
    p.tertiary,
    0.048,
    44,
  );
  group.add(growthArc);

  // Data packet spheres flowing along the radar arm
  const packetCount = 6;
  const packets: THREE.Mesh[] = [];
  for (let i = 0; i < packetCount; i++) {
    const pkt = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      glass(p.highlight, { emissive: 0.55, transmission: 0.35 }),
    );
    pkt.userData.packetPhase = i;
    packets.push(pkt);
    group.add(pkt);
  }

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    const mx = mouse?.x ?? 0;
    const my = mouse?.y ?? 0;

    // Radar sweep rotates
    radarArm.rotation.z = t * 0.65 + scroll * 0.8;

    // Rings breathe
    radarRings.forEach((ring, i) => {
      ring.rotation.z = t * 0.05 * (i % 2 === 0 ? 1 : -1);
    });

    // Eye core pulses
    const ep = 1 + Math.sin(t * 1.4) * 0.06;
    eyeCore.scale.setScalar(ep);
    eyeRing.rotation.z = t * 0.15;

    // Nodes orbit at their tiers
    allNodes.forEach(({ mesh, phase }) => {
      const r = mesh.userData.r as number;
      const baseA = mesh.userData.baseA as number;
      const y = mesh.userData.y as number;
      const speed = 0.18 + phase * 0.04;
      const a = baseA + t * speed;
      mesh.position.set(Math.cos(a) * r, y + Math.sin(a) * r * 0.28, 0.1);
      mesh.rotation.y = t * 0.5;
    });

    // Data packets trace an oval
    packets.forEach((pkt) => {
      const phase = pkt.userData.packetPhase as number;
      const a = t * 1.4 + phase * ((Math.PI * 2) / packetCount);
      const r = 2.0;
      pkt.position.set(
        Math.cos(a) * r,
        Math.sin(a) * r * 0.42 + 0.1,
        0.35 + Math.sin(a * 0.7) * 0.2,
      );
    });

    group.rotation.y = mx * 0.05 + t * 0.04;
    group.rotation.x = my * 0.03;
  };

  return { group, tick };
}

function buildApiCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();

  // ── Central schema enforcer sphere ────────────────────────────────────────
  const schema = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 20, 16),
    glass(p.primary, { emissive: 0.5, transmission: 0.38, metalness: 0.58 }),
  );
  group.add(schema);

  const schemaRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.04, 8, 36),
    metal(p.highlight, 0.15),
  );
  schemaRing.rotation.x = Math.PI / 2;
  group.add(schemaRing);

  // ── JSON payload blocks — stacked glass slabs at different depths ─────────
  const METHODS = ["GET", "POST", "PUT", "DELETE"] as const;
  const METHOD_COLORS = [p.secondary, p.tertiary, p.highlight, p.wire];
  const METHOD_POSITIONS: [number, number, number][] = [
    [-2.6, 1.0, 0.2],
    [2.5, 0.8, -0.1],
    [-2.3, -0.9, 0.3],
    [2.4, -1.1, -0.2],
  ];

  const endpointNodes: THREE.Group[] = [];
  METHOD_POSITIONS.forEach(([x, y, z], i) => {
    const endpointGroup = new THREE.Group();

    // Method label block (JSON object body)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.9, 0.12),
      glass(METHOD_COLORS[i]!, { transmission: 0.45, metalness: 0.42, emissive: 0.28 }),
    );
    endpointGroup.add(body);

    // Key-value line stubs inside the block
    for (let line = 0; line < 3; line++) {
      const lineStub = new THREE.Mesh(
        new THREE.BoxGeometry(0.5 + (line % 2) * 0.4, 0.025, 0.02),
        metal(p.wire, 0.35),
      );
      lineStub.position.set(-0.25 + (line % 2) * 0.15, 0.2 - line * 0.22, 0.08);
      endpointGroup.add(lineStub);
    }

    // Method node gem
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      metal(METHOD_COLORS[i]!, 0.05),
    );
    gem.position.set(0, 0.65, 0.08);
    endpointGroup.add(gem);

    endpointGroup.position.set(x, y, z);
    endpointGroup.userData.methodIndex = i;
    endpointNodes.push(endpointGroup);
    group.add(endpointGroup);

    // Bezier routing tube from schema to endpoint
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(x, y, z);
    const ctrl = new THREE.Vector3(x * 0.5, y * 0.5 + 0.6, z * 0.3 + 0.8);
    group.add(tubeAlong(new THREE.QuadraticBezierCurve3(start, ctrl, end), p.wire, 0.022, 22));
  });

  // ── Bracket geometry — opening/closing brace shapes ───────────────────────
  const brackets: THREE.Group[] = [];
  [
    [-3.2, 0, 0.5],
    [3.2, 0, 0.5],
  ].forEach(([bx, , bz], idx) => {
    const bracketGroup = new THREE.Group();
    // Main vertical
    const vert = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.6, 0.04), metal(p.highlight, 0.22));
    bracketGroup.add(vert);
    // Top/bottom serifs
    [-1.3, 1.3].forEach((by) => {
      const serif = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.04, 0.04),
        metal(p.highlight, 0.22),
      );
      serif.position.set(idx === 0 ? 0.12 : -0.12, by, 0);
      bracketGroup.add(serif);
    });
    bracketGroup.position.set(bx as number, 0, bz as number);
    brackets.push(bracketGroup);
    group.add(bracketGroup);
  });

  // ── Streaming data packets along routes ───────────────────────────────────
  const streamPackets: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const pkt = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 7, 5),
      glass(METHOD_COLORS[i % 4]!, { emissive: 0.55, transmission: 0.3 }),
    );
    pkt.userData.streamPhase = i;
    streamPackets.push(pkt);
    group.add(pkt);
  }

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    const mx = mouse?.x ?? 0;

    schema.rotation.y = t * 0.3;
    schemaRing.rotation.z = t * 0.18 + scroll * 0.5;
    const sp = 1 + Math.sin(t * 1.2) * 0.05;
    schema.scale.setScalar(sp);

    endpointNodes.forEach((eg, i) => {
      eg.rotation.y = Math.sin(t * 0.28 + i * 0.8) * 0.08 + scroll * 0.12;
      eg.rotation.x = Math.sin(t * 0.2 + i * 0.6) * 0.05;
      // Gems spin
      const gem = eg.children[4];
      if (gem) {
        gem.rotation.y = t * 0.6 + i;
        gem.rotation.x = t * 0.45;
      }
    });

    brackets.forEach((b, idx) => {
      b.position.x = (idx === 0 ? -3.2 : 3.2) + Math.sin(t * 0.4 + idx) * 0.08;
    });

    // Packets animate along bezier paths between schema and endpoints
    streamPackets.forEach((pkt) => {
      const phase = pkt.userData.streamPhase as number;
      const targetIdx = phase % 4;
      const [tx, ty, tz] = METHOD_POSITIONS[targetIdx]!;
      const progress = (((t * 0.7 + phase * 0.3) % 1) + 1) % 1;
      const ctrl = new THREE.Vector3(
        (tx as number) * 0.5,
        (ty as number) * 0.5 + 0.6,
        (tz as number) * 0.3 + 0.8,
      );
      const start = new THREE.Vector3(0, 0, 0);
      const end = new THREE.Vector3(tx as number, ty as number, tz as number);
      const pos = new THREE.QuadraticBezierCurve3(start, ctrl, end).getPoint(progress);
      pkt.position.copy(pos);
    });

    group.rotation.y = mx * 0.04 + t * 0.025;
    group.rotation.x = (mouse?.y ?? 0) * 0.03;
  };

  return { group, tick };
}

function buildHardwareCluster(p: GraphicPalette): AdvancedMeshScene {
  const group = new THREE.Group();
  // NOTE: no board plane — a large opaque box would block the page UI.

  // ── Central diamond crystal — the defining icon from DIAMOND FISTS ────────
  const diamondOuter = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.0, 0),
    glass(p.highlight, { emissive: 0.52, transmission: 0.7, metalness: 0.42 }),
  );
  diamondOuter.scale.y = 0.72;
  group.add(diamondOuter);

  const diamondInner = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    glass(p.wire, { emissive: 0.68, transmission: 0.52, metalness: 0.48 }),
  );
  diamondInner.scale.y = 0.72;
  group.add(diamondInner);

  // Crown + pavilion girdle rings (cut-diamond facet edges)
  const facetRings: THREE.Mesh[] = [];
  [0.18, -0.18, 0.42, -0.42].forEach((yOff) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.64 - Math.abs(yOff) * 0.55, 0.025, 6, 24),
      metal(p.highlight, 0.07),
    );
    ring.position.y = yOff * 0.68;
    ring.rotation.x = Math.PI / 2;
    facetRings.push(ring);
    group.add(ring);
  });

  // ── Indigo-purple fist knuckle arcs ─────────────────────────────────────
  const fistMeshes: THREE.Mesh[] = [];
  [-0.42, -0.2, 0.0, 0.2, 0.42].forEach((angOff, i) => {
    const knuckle = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 8),
      glass(p.tertiary, { transmission: 0.32, metalness: 0.52, emissive: 0.2 }),
    );
    knuckle.position.set(angOff * 2.6, -1.1 - Math.abs(angOff) * 0.25, 0.1);
    fistMeshes.push(knuckle);
    group.add(knuckle);
    // Finger tube
    const fingerTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.55, 8),
      glass(p.tertiary, { transmission: 0.28, metalness: 0.55 }),
    );
    fingerTube.rotation.z = angOff * 0.5;
    fingerTube.position.set(angOff * 2.6, -1.48 - Math.abs(angOff) * 0.25, 0.08 + i * 0.02);
    group.add(fingerTube);
  });

  // ── Jade-green figure silhouettes (from artwork) ─────────────────────────
  const figurePositions: [number, number, number][] = [
    [2.8, 0.2, 0.1],
    [3.4, -0.6, 0.2],
    [-3.0, 0.6, -0.1],
  ];
  const figureMeshes: THREE.Mesh[] = [];
  figurePositions.forEach(([fx, fy, fz], i) => {
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.48, 3, 8),
      glass(p.secondary, { emissive: 0.42, transmission: 0.35, metalness: 0.52 }),
    );
    torso.position.set(fx, fy, fz);
    torso.rotation.z = (i - 1) * 0.3;
    torso.userData.figPhase = i;
    figureMeshes.push(torso);
    group.add(torso);
    // Extended arm
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.36, 3, 6),
      glass(p.secondary, { emissive: 0.32, transmission: 0.42 }),
    );
    arm.position.set(fx + 0.28 * (i % 2 === 0 ? 1 : -1), fy + 0.3, fz);
    arm.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.7;
    group.add(arm);
  });

  // ── Wisteria-violet drape strands ─────────────────────────────────────────
  for (let i = 0; i < 7; i++) {
    group.add(
      tubeAlong(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.8 + i * 0.6, 1.8, 0.0),
          new THREE.Vector3(-1.6 + i * 0.6, 0.8 + Math.sin(i) * 0.3, 0.08),
          new THREE.Vector3(-1.9 + i * 0.6, -0.4 + Math.cos(i * 0.7) * 0.35, 0.15),
          new THREE.Vector3(-2.0 + i * 0.6, -1.5, 0.1),
        ]),
        p.wire,
        0.024,
        18,
      ),
    );
  }

  const tick = (t: number, scroll: number, mouse?: { x: number; y: number }) => {
    const mx = mouse?.x ?? 0;
    const my = mouse?.y ?? 0;

    diamondOuter.rotation.y = t * 0.32 + scroll * 0.7;
    diamondOuter.rotation.x = Math.sin(t * 0.38) * 0.14;
    const dp = 1 + Math.sin(t * 1.1) * 0.04;
    diamondOuter.scale.set(dp, 0.72 * dp, dp);

    diamondInner.rotation.y = -t * 0.5 - scroll * 0.45;
    diamondInner.rotation.z = t * 0.18;

    facetRings.forEach((ring, i) => {
      ring.rotation.z = t * (0.12 + i * 0.07) * (i % 2 === 0 ? 1 : -1);
    });

    fistMeshes.forEach((k, i) => {
      k.position.y =
        -1.1 - Math.abs([-0.42, -0.2, 0, 0.2, 0.42][i]! * 0.25) + Math.sin(t * 0.45 + i) * 0.04;
    });

    figureMeshes.forEach((fig, i) => {
      fig.rotation.z = (i - 1) * 0.3 + Math.sin(t * 0.38 + i * 1.1) * 0.07;
      fig.position.y = figurePositions[i]![1] + Math.sin(t * 0.5 + i * 0.8) * 0.08 + scroll * 0.04;
    });

    group.rotation.y = mx * 0.05;
    group.rotation.x = my * 0.03;
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
