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

function buildPlay(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#7c5cbf");
  const lines: THREE.Line[] = [];
  const COUNT = 12;

  for (let i = 0; i < COUNT; i++) {
    const pts: THREE.Vector3[] = [];
    const segments = 120;
    for (let s = 0; s <= segments; s++) pts.push(new THREE.Vector3(0, 0, 0));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: COLOR,
      transparent: true,
      opacity: 0.06 + (i / COUNT) * 0.1,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    lines.push(line);
  }

  // Vertical scan plane
  const scanGeo = new THREE.PlaneGeometry(0.006, 20);
  const scanMat = new THREE.MeshBasicMaterial({
    color: COLOR,
    transparent: true,
    opacity: 0.18,
  });
  const scan = new THREE.Mesh(scanGeo, scanMat);
  scene.add(scan);

  return (t: number) => {
    lines.forEach((line, i) => {
      const geo = line.geometry as THREE.BufferGeometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const segments = pos.count - 1;
      const amp = 0.6 + i * 0.25 + mouse.y * 0.5;
      const freq = 0.04 + i * 0.008;
      const speed = 0.8 + i * 0.15;
      const yBase = -4 + (i / (lines.length - 1)) * 8;
      for (let s = 0; s <= segments; s++) {
        const x = -10 + (s / segments) * 20;
        const y = yBase + Math.sin(x * freq + t * speed + i * 0.6) * amp;
        pos.setXYZ(s, x, y, -2);
      }
      pos.needsUpdate = true;
    });

    // Scan line sweeps horizontally
    scan.position.x = ((t * 1.2) % 22) - 11;
    scan.material.opacity = 0.12 + 0.06 * Math.sin(t * 3);
  };
}

function buildSeeds(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#5BA8A0");
  const NODE_COUNT = 28;

  // Node spheres
  const nodeGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const nodeMat = new THREE.MeshBasicMaterial({
    color: COLOR,
    transparent: true,
    opacity: 0.55,
  });

  type NodeData = {
    mesh: THREE.Mesh;
    ox: number;
    oy: number;
    oz: number;
    phase: number;
    speed: number;
  };
  const nodes: NodeData[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * Math.PI * 2;
    const r = 1.5 + Math.random() * 4;
    const mesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
    const ox = Math.cos(angle) * r;
    const oy = (Math.random() - 0.5) * 8;
    const oz = -3 - Math.random() * 3;
    mesh.position.set(ox, oy, oz);
    scene.add(mesh);
    nodes.push({
      mesh,
      ox,
      oy,
      oz,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4,
    });
  }

  // Line connections
  const linePositions = new Float32Array(NODE_COUNT * NODE_COUNT * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: COLOR,
    transparent: true,
    opacity: 0.12,
  });
  const lineObj = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineObj);

  return (t: number) => {
    nodes.forEach((n) => {
      n.mesh.position.x = n.ox + mouse.x * 0.8 + Math.sin(t * n.speed + n.phase) * 0.3;
      n.mesh.position.y = n.oy + mouse.y * 0.6 + Math.cos(t * n.speed * 0.7 + n.phase) * 0.2;
    });

    let vi = 0;
    const pos = lineGeo.attributes.position as THREE.BufferAttribute;
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const da = nodes[a].mesh.position;
        const db = nodes[b].mesh.position;
        const dist = da.distanceTo(db);
        if (dist < 3.5 && vi + 5 < linePositions.length) {
          pos.setXYZ(vi / 3, da.x, da.y, da.z);
          pos.setXYZ(vi / 3 + 1, db.x, db.y, db.z);
          vi += 6;
        }
      }
    }
    for (let i = vi / 3; i < pos.count; i++) pos.setXYZ(i, 0, 0, 0);
    pos.needsUpdate = true;
    lineGeo.setDrawRange(0, vi / 3);
  };
}

function buildOrbit(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#3d8a82");
  const PARTICLE_COUNT = 220;

  // Particles
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const phases = new Float32Array(PARTICLE_COUNT);
  const radii = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 6;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = -3 + Math.random() * 2;
    phases[i] = Math.random() * Math.PI * 2;
    radii[i] = r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: COLOR,
    size: 0.04,
    transparent: true,
    opacity: 0.5,
  });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // Orbital rings
  for (let ri = 0; ri < 3; ri++) {
    const r = 2.5 + ri * 2;
    const ringGeo = new THREE.RingGeometry(r - 0.005, r + 0.005, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: COLOR,
      transparent: true,
      opacity: 0.06 + ri * 0.03,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + ri * 0.3;
    ring.rotation.y = ri * 0.5;
    ring.position.z = -3;
    scene.add(ring);
  }

  // Web connections
  const webPositions = new Float32Array(1000 * 6);
  const webGeo = new THREE.BufferGeometry();
  webGeo.setAttribute("position", new THREE.BufferAttribute(webPositions, 3));
  scene.add(
    new THREE.LineSegments(
      webGeo,
      new THREE.LineBasicMaterial({ color: COLOR, transparent: true, opacity: 0.08 }),
    ),
  );

  return (t: number) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = phases[i] + t * (0.15 / radii[i]);
      pos.setXYZ(
        i,
        Math.cos(angle) * radii[i] + mouse.x * 0.5,
        Math.sin(phases[i] * 2 + t * 0.2) * radii[i] * 0.4 + mouse.y * 0.4,
        -3,
      );
    }
    pos.needsUpdate = true;
  };
}

function buildSecurity(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#6B2C4A");
  const ACCENT = new THREE.Color("#c47fa0");

  // Corner diamond clusters
  const diamondGeo = new THREE.OctahedronGeometry(0.12, 0);
  const positions = [
    [-7, 5],
    [7, 5],
    [-7, -5],
    [7, -5],
    [0, 5.5],
    [0, -5.5],
    [-7.5, 0],
    [7.5, 0],
  ];
  const diamonds: THREE.Mesh[] = [];
  positions.forEach(([x, y], i) => {
    const mat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? COLOR : ACCENT,
      metalness: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
    });
    const m = new THREE.Mesh(diamondGeo, mat);
    m.position.set(x, y, -2);
    scene.add(m);
    diamonds.push(m);
  });

  // Ornamental border lines
  const borderPts = [
    new THREE.Vector3(-8, 5.5, -2),
    new THREE.Vector3(8, 5.5, -2),
    new THREE.Vector3(8, 5.5, -2),
    new THREE.Vector3(8, -5.5, -2),
    new THREE.Vector3(8, -5.5, -2),
    new THREE.Vector3(-8, -5.5, -2),
    new THREE.Vector3(-8, -5.5, -2),
    new THREE.Vector3(-8, 5.5, -2),
  ];
  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts);
  scene.add(
    new THREE.LineSegments(
      borderGeo,
      new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.15 }),
    ),
  );

  // Animated trace line (as a single-segment line that progresses)
  const tracePts = [new THREE.Vector3(-8, 5.5, -1.9), new THREE.Vector3(-8, 5.5, -1.9)];
  const traceGeo = new THREE.BufferGeometry().setFromPoints(tracePts);
  const traceMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.6 });
  scene.add(new THREE.Line(traceGeo, traceMat));

  // Light for diamonds
  const light = new THREE.PointLight(0xffd0e8, 2, 15);
  light.position.set(0, 0, 3);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  return (t: number) => {
    diamonds.forEach((d, i) => {
      d.rotation.y = t * (0.4 + i * 0.1) + mouse.x * 0.5;
      d.rotation.x = t * (0.3 + i * 0.07) + mouse.y * 0.3;
      const scale = 1 + 0.15 * Math.sin(t * 1.2 + i);
      d.scale.setScalar(scale);
    });
    light.position.x = mouse.x * 4;
    light.position.y = mouse.y * 3;
  };
}

function buildApi(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#9b4d6e");

  // Grid of panels
  const COLS = 8;
  const ROWS = 5;
  const panels: { mesh: THREE.Mesh; baseX: number; baseY: number }[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const geo = new THREE.PlaneGeometry(1.6, 1.0);
      const mat = new THREE.MeshBasicMaterial({
        color: COLOR,
        transparent: true,
        opacity: 0,
        wireframe: true,
      });
      const m = new THREE.Mesh(geo, mat);
      const bx = (c - COLS / 2 + 0.5) * 1.8;
      const by = (r - ROWS / 2 + 0.5) * 1.2;
      m.position.set(bx, by, -4);
      scene.add(m);
      panels.push({ mesh: m, baseX: bx, baseY: by });
    }
  }

  // Light sweep plane
  const sweepGeo = new THREE.PlaneGeometry(0.04, 20);
  const sweepMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.12,
  });
  const sweep = new THREE.Mesh(sweepGeo, sweepMat);
  scene.add(sweep);

  return (t: number) => {
    panels.forEach(({ mesh, baseX, baseY }, i) => {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const wave = Math.sin(t * 0.8 + i * 0.3 + mouse.x) * 0.25;
      mesh.position.z = -4 + wave;
      mesh.rotation.y = mouse.x * 0.1 + Math.sin(t * 0.3 + i * 0.2) * 0.05;
      mat.opacity = 0.04 + 0.08 * Math.abs(Math.sin(t * 0.5 + i * 0.4));
      // Panel closest to mouse lights up
      const dx = mouse.x * 9 - baseX;
      const dy = mouse.y * 5 - baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mat.opacity += Math.max(0, 0.15 - dist * 0.06);
    });
    sweep.position.x = ((t * 1.8) % 16) - 8;
  };
}

function buildHardware(scene: THREE.Scene, mouse: { x: number; y: number }): (t: number) => void {
  const COLOR = new THREE.Color("#b5547a");
  const SILVER = new THREE.Color("#d0c8d8");
  const COUNT = 22;

  const light1 = new THREE.PointLight(0xffd8ee, 3, 18);
  light1.position.set(4, 4, 4);
  scene.add(light1);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  type GemData = {
    mesh: THREE.Mesh;
    ox: number;
    oy: number;
    phase: number;
    speed: number;
  };
  const gems: GemData[] = [];
  const gemGeo = new THREE.OctahedronGeometry(1, 0);

  for (let i = 0; i < COUNT; i++) {
    const size = 0.08 + Math.random() * 0.28;
    const mat = new THREE.MeshStandardMaterial({
      color: i % 3 === 0 ? SILVER : COLOR,
      metalness: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.55 + Math.random() * 0.3,
    });
    const m = new THREE.Mesh(gemGeo, mat);
    m.scale.setScalar(size);
    const ox = (Math.random() - 0.5) * 16;
    const oy = (Math.random() - 0.5) * 10;
    m.position.set(ox, oy, -2 - Math.random() * 2);
    scene.add(m);
    gems.push({
      mesh: m,
      ox,
      oy,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.4,
    });
  }

  return (t: number) => {
    gems.forEach((g) => {
      g.mesh.rotation.y = t * g.speed + g.phase;
      g.mesh.rotation.x = t * g.speed * 0.7;
      g.mesh.position.x = g.ox + mouse.x * 1.2 + Math.sin(t * g.speed + g.phase) * 0.2;
      g.mesh.position.y = g.oy + mouse.y * 0.8 + Math.cos(t * g.speed * 0.8 + g.phase) * 0.15;
    });
    light1.position.set(mouse.x * 5, mouse.y * 4, 4);
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

    // Shared mouse tracker
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Build scene for this variant
    const sceneBuilders = {
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

    // Resize
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
