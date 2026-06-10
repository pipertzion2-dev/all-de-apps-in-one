"use client";

/**
 * FeatureThreeBackground
 * Full-screen interactive Three.js canvas rendered behind each feature page.
 * Each variant matches the visual DNA of its corresponding artwork.
 * Mouse-reactive, scroll-aware, GPU-friendly, pointer-events: none.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type FeatureVariant = "play" | "seeds" | "orbit" | "security" | "api" | "hardware";

type Props = { variant: FeatureVariant };

// ─────────────────────────────────────────────────────────────────────────────
// Scene builders — one per feature
// ─────────────────────────────────────────────────────────────────────────────

// ── play: scan-line equalizer bars + vertical sweep ─────────────────────────
function buildPlay(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#7c5cbf");
  const BRIGHT = new THREE.Color("#b08fe8");
  const BAR_COUNT = 22;

  type Bar = { mesh: THREE.Mesh; baseY: number };
  const bars: Bar[] = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    const geo = new THREE.PlaneGeometry(20, 0.048 + Math.random() * 0.02);
    const mat = new THREE.MeshBasicMaterial({
      color: i % 5 === 0 ? BRIGHT : COLOR,
      transparent: true,
      opacity: 0.04 + (i / BAR_COUNT) * 0.1,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(geo, mat);
    const baseY = -5.5 + (i / (BAR_COUNT - 1)) * 11;
    m.position.set(0, baseY, -3 - Math.random() * 0.5);
    scene.add(m);
    bars.push({ mesh: m, baseY });
  }

  // Vertical scan plane sweeping across
  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(0.007, 14),
    new THREE.MeshBasicMaterial({ color: BRIGHT, transparent: true, opacity: 0.28 }),
  );
  scene.add(scan);

  // Glowing peak spheres that ride the audio peak
  const peakSpheres: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 6),
      new THREE.MeshBasicMaterial({ color: BRIGHT, transparent: true, opacity: 0.5 }),
    );
    scene.add(s);
    peakSpheres.push(s);
  }

  return (t: number) => {
    // "Audio peak" follows mouse y — which bar region is boosted
    const peakY = mouse.y * 4.5;

    bars.forEach(({ mesh, baseY }, i) => {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const proximity = Math.exp(-0.35 * (baseY - peakY) ** 2);
      const amp =
        (0.25 + proximity * 0.9) * Math.sin(i * 0.42 + t * (1.4 + i * 0.04) + mouse.x * 1.8);
      mesh.position.y = baseY + amp;
      mat.opacity = 0.02 + Math.abs(amp) * 0.07 + proximity * 0.07;
    });

    // Peak spheres sit at the tips of the 5 most-displaced bars near peakY
    const sorted = [...bars]
      .map((b, i) => ({ i, dist: Math.abs(b.baseY - peakY) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);
    sorted.forEach(({ i }, pi) => {
      const b = bars[i];
      peakSpheres[pi].position.set(mouse.x * 8, b.mesh.position.y, b.mesh.position.z + 0.05);
      (peakSpheres[pi].material as THREE.MeshBasicMaterial).opacity =
        0.3 + 0.2 * Math.sin(t * 3 + pi);
    });

    scan.position.x = ((t * 1.4) % 22) - 11;
    (scan.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.08 * Math.sin(t * 2.5);
  };
}

// ── seeds: branching node tree like a cassette reel unwinding ────────────────
function buildSeeds(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#5BA8A0");
  const NODE_COUNT = 60;

  type NodeData = {
    mesh: THREE.Mesh;
    ox: number;
    oy: number;
    phase: number;
    speed: number;
    depth: number;
  };
  const nodes: NodeData[] = [];

  const nodeGeo = new THREE.SphereGeometry(0.04, 6, 4);

  for (let i = 0; i < NODE_COUNT; i++) {
    const depth = i < 4 ? 0 : Math.floor(1 + Math.random() * 3);
    const angle = (i / NODE_COUNT) * Math.PI * (4 + depth * 0.8) + depth * 0.4;
    const r = depth * 1.6 + 0.4 + Math.random() * 0.9;
    const mat = new THREE.MeshBasicMaterial({
      color: COLOR,
      transparent: true,
      opacity: 0.3 + (depth === 0 ? 0.3 : 0.1),
    });
    const m = new THREE.Mesh(nodeGeo, mat);
    const ox = Math.cos(angle) * r;
    const oy = (Math.random() - 0.5) * (2 + depth * 1.8);
    m.position.set(ox, oy, -3 - Math.random() * 2);
    scene.add(m);
    nodes.push({
      mesh: m,
      ox,
      oy,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.3,
      depth,
    });
  }

  // Line connections between depth-adjacent nodes
  const maxLines = NODE_COUNT * 4;
  const linePositions = new Float32Array(maxLines * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  const lineObj = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ color: COLOR, transparent: true, opacity: 0.14 }),
  );
  scene.add(lineObj);

  return (t: number) => {
    nodes.forEach((n) => {
      n.mesh.position.x =
        n.ox + mouse.x * (0.4 + n.depth * 0.25) + Math.sin(t * n.speed + n.phase) * 0.25;
      n.mesh.position.y =
        n.oy + mouse.y * (0.3 + n.depth * 0.18) + Math.cos(t * n.speed * 0.8 + n.phase) * 0.18;
    });

    let vi = 0;
    const pos = lineGeo.attributes.position as THREE.BufferAttribute;
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        if (Math.abs(nodes[a].depth - nodes[b].depth) <= 1) {
          const da = nodes[a].mesh.position;
          const db = nodes[b].mesh.position;
          const dist = da.distanceTo(db);
          if (dist < 3.2 && vi + 5 < maxLines * 6) {
            pos.setXYZ(vi / 3, da.x, da.y, da.z);
            pos.setXYZ(vi / 3 + 1, db.x, db.y, db.z);
            vi += 6;
          }
        }
      }
    }
    for (let i = vi / 3; i < pos.count; i++) pos.setXYZ(i, 0, 0, 0);
    pos.needsUpdate = true;
    lineGeo.setDrawRange(0, vi / 3);
  };
}

// ── orbit: botanical web + pulsing connections + eye ellipses ────────────────
function buildOrbit(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#c06010");
  const NODE_COUNT = 80;

  type NodeData = {
    mesh: THREE.Mesh;
    angle: number;
    r: number;
    oy: number;
    phase: number;
  };
  const nodes: NodeData[] = [];

  const nodeGeo = new THREE.IcosahedronGeometry(0.045, 0);
  const nodeMat = new THREE.MeshBasicMaterial({ color: COLOR, transparent: true, opacity: 0.45 });

  for (let i = 0; i < NODE_COUNT; i++) {
    const m = new THREE.Mesh(nodeGeo, nodeMat.clone());
    const angle = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 6;
    const oy = (Math.random() - 0.5) * 9;
    m.position.set(Math.cos(angle) * r, oy, -3);
    scene.add(m);
    nodes.push({
      mesh: m,
      angle: angle + Math.random() * 0.3,
      r,
      oy,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Web connection lines (capped for performance)
  const MAX_SEGS = 240;
  const webPos = new Float32Array(MAX_SEGS * 6);
  const webGeo = new THREE.BufferGeometry();
  webGeo.setAttribute("position", new THREE.BufferAttribute(webPos, 3));
  scene.add(
    new THREE.LineSegments(
      webGeo,
      new THREE.LineBasicMaterial({ color: COLOR, transparent: true, opacity: 0.1 }),
    ),
  );

  // Eye-like ring ellipses
  type EyeData = { mesh: THREE.Mesh; life: number; maxLife: number };
  const eyes: EyeData[] = [];
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.RingGeometry(0.28, 0.32, 36);
    geo.scale(1, 0.38, 1); // squash to ellipse
    const mat = new THREE.MeshBasicMaterial({
      color: COLOR,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set((Math.random() - 0.5) * 13, (Math.random() - 0.5) * 8, -2.5);
    scene.add(m);
    eyes.push({
      mesh: m,
      life: Math.floor(Math.random() * 180),
      maxLife: 180 + Math.floor(Math.random() * 120),
    });
  }

  return (t: number) => {
    nodes.forEach((n) => {
      const speed = 0.09 / (n.r + 0.5);
      const a = n.angle + t * speed;
      n.mesh.position.x = Math.cos(a) * n.r + mouse.x * 0.7;
      n.mesh.position.y = n.oy + Math.sin(n.phase + t * 0.22) * n.r * 0.28 + mouse.y * 0.45;
    });

    const pos = webGeo.attributes.position as THREE.BufferAttribute;
    let vi = 0;
    for (let a = 0; a < nodes.length && vi < MAX_SEGS - 1; a++) {
      for (let b = a + 1; b < nodes.length && vi < MAX_SEGS - 1; b++) {
        const da = nodes[a].mesh.position;
        const db = nodes[b].mesh.position;
        if (da.distanceTo(db) < 2.2) {
          pos.setXYZ(vi, da.x, da.y, da.z);
          pos.setXYZ(vi + 1, db.x, db.y, db.z);
          vi += 2;
        }
      }
    }
    for (let i = vi; i < pos.count; i++) pos.setXYZ(i, 0, 0, 0);
    pos.needsUpdate = true;
    webGeo.setDrawRange(0, vi);

    eyes.forEach((eye) => {
      eye.life++;
      if (eye.life > eye.maxLife) {
        eye.life = 0;
        eye.maxLife = 180 + Math.floor(Math.random() * 120);
        eye.mesh.position.set((Math.random() - 0.5) * 13, (Math.random() - 0.5) * 8, -2.5);
      }
      const prog = eye.life / eye.maxLife;
      const mat = eye.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(prog * Math.PI) * 0.28;
      const sc = 0.6 + prog * 0.7 + Math.sin(t * 0.7 + eye.life) * 0.04;
      eye.mesh.scale.setScalar(sc);
    });
  };
}

// ── security: crystal lattice with edge glow + scroll compression ────────────
function buildSecurity(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#4a90d9");
  const EDGE_COLOR = new THREE.Color("#a0c8ff");

  const COLS = 4;
  const ROWS = 4;
  type CrystalData = { mesh: THREE.Mesh; bx: number; by: number; phase: number };
  const crystals: CrystalData[] = [];

  const crystalGeo = new THREE.OctahedronGeometry(0.3, 0);

  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      const mat = new THREE.MeshStandardMaterial({
        color: COLOR,
        metalness: 0.75,
        roughness: 0.08,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.12,
      });
      const m = new THREE.Mesh(crystalGeo, mat);
      const bx = (x - COLS / 2 + 0.5) * 4.2;
      const by = (y - ROWS / 2 + 0.5) * 3.2;
      m.position.set(bx, by, -3);
      scene.add(m);

      // Wireframe edge overlay for edge-glow effect
      const edgeMat = new THREE.MeshBasicMaterial({
        color: EDGE_COLOR,
        transparent: true,
        opacity: 0.55,
        wireframe: true,
      });
      const edgeMesh = new THREE.Mesh(crystalGeo, edgeMat);
      m.add(edgeMesh); // child follows parent transform

      crystals.push({ mesh: m, bx, by, phase: (x * COLS + y) * 0.52 });
    }
  }

  // Connecting grid lines
  const gridPts: THREE.Vector3[] = [];
  crystals.forEach((c) => {
    crystals.forEach((d) => {
      if (c !== d && Math.abs(c.bx - d.bx) + Math.abs(c.by - d.by) < 5) {
        gridPts.push(new THREE.Vector3(c.bx, c.by, -3));
        gridPts.push(new THREE.Vector3(d.bx, d.by, -3));
      }
    });
  });
  if (gridPts.length > 0) {
    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPts);
    scene.add(
      new THREE.LineSegments(
        gridGeo,
        new THREE.LineBasicMaterial({ color: EDGE_COLOR, transparent: true, opacity: 0.07 }),
      ),
    );
  }

  const light = new THREE.PointLight(0x90c8ff, 3.5, 22);
  light.position.set(0, 0, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  let scrollScale = 1.0;

  return (t: number) => {
    // Use mouse.y as a scroll-like proxy to compress/expand the grid
    scrollScale += (1.0 + mouse.y * 0.45 - scrollScale) * 0.025;

    crystals.forEach(({ mesh, bx, by, phase }) => {
      const bob = Math.sin(t * 0.85 + phase) * 0.18;
      mesh.position.x = bx + mouse.x * 0.6;
      mesh.position.y = by * scrollScale + mouse.y * 0.25 + bob;
      mesh.rotation.y = t * 0.28 + phase;
      mesh.rotation.x = t * 0.18 + phase * 0.4;
    });

    light.position.set(mouse.x * 7, mouse.y * 5, 3);
  };
}

// ── api: floating wireframe panels that snap into grid from off-screen ────────
function buildApi(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#e85d04");

  const COLS = 7;
  const ROWS = 4;
  type PanelData = { mesh: THREE.Mesh; bx: number; by: number; bz: number; delay: number };
  const panels: PanelData[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const w = 1.7 + Math.random() * 0.5;
      const h = 0.85 + Math.random() * 0.3;
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({
        color: COLOR,
        transparent: true,
        opacity: 0,
        wireframe: true,
      });
      const m = new THREE.Mesh(geo, mat);
      const bx = (c - COLS / 2 + 0.5) * 2.1;
      const by = (r - ROWS / 2 + 0.5) * 1.35;
      const bz = -3.5 - Math.random() * 0.8;
      m.position.set(bx, by + 18, bz); // start above viewport
      scene.add(m);
      panels.push({ mesh: m, bx, by, bz, delay: (r * COLS + c) * 0.12 });
    }
  }

  // Horizontal sweep light
  const sweep = new THREE.Mesh(
    new THREE.PlaneGeometry(0.007, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 }),
  );
  scene.add(sweep);

  return (t: number) => {
    panels.forEach(({ mesh, bx, by, bz, delay }) => {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const progress = Math.max(0, Math.min(1, (t - delay) / 0.9));
      // Cubic ease-out snaps panels into place
      const ease = 1 - Math.pow(1 - progress, 3);
      mesh.position.x = bx + mouse.x * 0.35;
      mesh.position.y = by + (1 - ease) * 14;
      mesh.position.z = bz + Math.sin(t * 0.45 + delay) * 0.18;
      mesh.rotation.y = mouse.x * 0.07 + Math.sin(t * 0.28 + delay) * 0.04;
      const base = ease * (0.05 + 0.05 * Math.abs(Math.sin(t * 0.55 + delay)));
      // Highlight panels near cursor
      const dx = mouse.x * 9 - bx;
      const dy = mouse.y * 5 - by;
      mat.opacity = base + Math.max(0, 0.14 - Math.sqrt(dx * dx + dy * dy) * 0.045);
    });
    sweep.position.x = ((t * 2.2) % 18) - 9;
  };
}

// ── hardware: diamond tetrahedra field with depth parallax ───────────────────
function buildHardware(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#c9a84c");
  const SILVER = new THREE.Color("#e8e0c8");
  const COUNT = 38;

  const light1 = new THREE.PointLight(0xffe8a0, 3, 22);
  light1.position.set(4, 4, 4);
  scene.add(light1);
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));

  const diamondGeo = new THREE.TetrahedronGeometry(1, 0);

  type GemData = {
    mesh: THREE.Mesh;
    ox: number;
    oy: number;
    oz: number;
    phase: number;
    speed: number;
    depth: number;
  };
  const gems: GemData[] = [];

  for (let i = 0; i < COUNT; i++) {
    const size = 0.07 + Math.random() * 0.28;
    const mat = new THREE.MeshStandardMaterial({
      color: i % 3 === 0 ? SILVER : COLOR,
      metalness: 0.9,
      roughness: 0.04,
      transparent: true,
      opacity: 0.5 + Math.random() * 0.32,
    });
    const m = new THREE.Mesh(diamondGeo, mat);
    m.scale.setScalar(size);
    const ox = (Math.random() - 0.5) * 17;
    const oy = (Math.random() - 0.5) * 11;
    const oz = -2 - Math.random() * 3.5;
    m.position.set(ox, oy, oz);
    scene.add(m);
    gems.push({
      mesh: m,
      ox,
      oy,
      oz,
      phase: Math.random() * Math.PI * 2,
      speed: 0.18 + Math.random() * 0.45,
      depth: -oz, // positive depth value (2–5.5)
    });
  }

  return (t: number) => {
    gems.forEach((g) => {
      // Nearer gems move more with mouse (parallax)
      const parallax = 3.5 / g.depth;
      g.mesh.rotation.y = t * g.speed + g.phase;
      g.mesh.rotation.x = t * g.speed * 0.65;
      g.mesh.position.x = g.ox + mouse.x * parallax * 1.8 + Math.sin(t * g.speed + g.phase) * 0.12;
      g.mesh.position.y = g.oy + mouse.y * parallax + Math.cos(t * g.speed * 0.75 + g.phase) * 0.1;
    });
    light1.position.set(mouse.x * 7, mouse.y * 5, 3.5);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function FeatureThreeBackground({ variant }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 8;

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const sceneBuilders: Record<FeatureVariant, typeof buildPlay> = {
      play: buildPlay,
      seeds: buildSeeds,
      orbit: buildOrbit,
      security: buildSecurity,
      api: buildApi,
      hardware: buildHardware,
    };
    const tick = sceneBuilders[variant](scene, mouse);

    let rafId = 0;
    const start = Date.now();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      tick((Date.now() - start) / 1000);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
