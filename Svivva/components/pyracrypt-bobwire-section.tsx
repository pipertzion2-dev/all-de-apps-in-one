"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import Link from "next/link";
import { Lock, ArrowRight, Shield } from "lucide-react";

const TEAL_N = 0x5ba8a0;
const BURG_N = 0x9b3a5e; // brightened burgundy so barbs pop
const TEAL = "#5BA8A0";
const BG_N = 0x04060f;

// corridor geometry constants
const CW = 18; // corridor width  (±9 in X)
const CH = 12; // corridor height (±6 in Y)
const TILE_LEN = 28; // one tile's Z depth
const TILES_N = 8; // number of repeating tiles
const SPEED = 0.07; // units per frame fly-through speed

function isWebGLAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────

/** Flat array of floats → BufferGeometry position attribute */
function floatGeo(pts: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** grid panel: fixed value on one axis, 2 free axes */
function gridPanel(
  fixedAxis: "x" | "y",
  fixedVal: number,
  yFrom: number,
  yTo: number,
  ySteps: number,
  zFrom: number,
  zTo: number,
  zSteps: number,
  mat: THREE.LineBasicMaterial,
): THREE.LineSegments {
  const pts: number[] = [];
  const addLine = (ax1: number, ax2: number, bx1: number, bx2: number) => {
    if (fixedAxis === "x") {
      pts.push(fixedVal, ax1, ax2, fixedVal, bx1, bx2);
    } else {
      pts.push(ax1, fixedVal, ax2, bx1, fixedVal, bx2);
    }
  };
  // lines along Z (constant Y)
  for (let i = 0; i <= ySteps; i++) {
    const y = yFrom + (i / ySteps) * (yTo - yFrom);
    addLine(y, zFrom, y, zTo);
  }
  // lines along Y (constant Z)
  for (let j = 0; j <= zSteps; j++) {
    const z = zFrom + (j / zSteps) * (zTo - zFrom);
    addLine(yFrom, z, yTo, z);
  }
  return new THREE.LineSegments(floatGeo(pts), mat);
}

/** Barbed wire strand + barbs running along X at fixed (y, z) */
function barbedWireX(
  y: number,
  z: number,
  mat: THREE.LineBasicMaterial,
  barbMat: THREE.LineBasicMaterial,
): THREE.Group {
  const g = new THREE.Group();
  const hw = CW / 2;
  const BARB_SP = 1.3;
  const BS = 0.38; // barb arm length

  // main wire
  g.add(new THREE.LineSegments(floatGeo([-hw, y, z, hw, y, z]), mat));

  // barbs
  const barbPts: number[] = [];
  const count = Math.floor(CW / BARB_SP);
  for (let b = 0; b <= count; b++) {
    const x = -hw + b * BARB_SP;
    // X-cross in the XY plane (barb perpendicular to wire)
    barbPts.push(x - BS, y + BS, z, x + BS, y - BS, z);
    barbPts.push(x - BS, y - BS, z, x + BS, y + BS, z);
  }
  g.add(new THREE.LineSegments(floatGeo(barbPts), barbMat));
  return g;
}

/** Barbed wire strand + barbs running along Y at fixed (x, z) */
function barbedWireY(
  x: number,
  z: number,
  mat: THREE.LineBasicMaterial,
  barbMat: THREE.LineBasicMaterial,
): THREE.Group {
  const g = new THREE.Group();
  const hh = CH / 2;
  const BARB_SP = 1.1;
  const BS = 0.32;

  g.add(new THREE.LineSegments(floatGeo([x, -hh, z, x, hh, z]), mat));

  const barbPts: number[] = [];
  const count = Math.floor(CH / BARB_SP);
  for (let b = 0; b <= count; b++) {
    const y = -hh + b * BARB_SP;
    // X-cross in the YZ plane
    barbPts.push(x, y - BS, z + BS, x, y + BS, z - BS);
    barbPts.push(x, y - BS, z - BS, x, y + BS, z + BS);
  }
  g.add(new THREE.LineSegments(floatGeo(barbPts), barbMat));
  return g;
}

// ── one repeating corridor tile ──────────────────────────────────────────────
function createTile(): THREE.Group {
  const g = new THREE.Group();
  const hw = CW / 2,
    hh = CH / 2;

  const matWall = new THREE.LineBasicMaterial({ color: TEAL_N, transparent: true, opacity: 0.55 });
  const matFloor = new THREE.LineBasicMaterial({ color: TEAL_N, transparent: true, opacity: 0.35 });
  const matCeil = new THREE.LineBasicMaterial({ color: TEAL_N, transparent: true, opacity: 0.22 });
  const matWire = new THREE.LineBasicMaterial({ color: TEAL_N });
  const matBarb = new THREE.LineBasicMaterial({ color: BURG_N });

  // ── walls ──
  // Dense horizontal wires (every ~1 unit in Y) + vertical structs every ~5 units in Z
  g.add(gridPanel("x", -hw, -hh, hh, 11, 0, -TILE_LEN, 6, matWall));
  g.add(gridPanel("x", hw, -hh, hh, 11, 0, -TILE_LEN, 6, matWall));

  // ── floor ──
  g.add(gridPanel("y", -hh, -hw, hw, 9, 0, -TILE_LEN, 14, matFloor));

  // ── ceiling ──
  g.add(gridPanel("y", hh, -hw, hw, 9, 0, -TILE_LEN, 7, matCeil));

  // ── horizontal barbed wire strands crossing the corridor ──
  // Two rows at different heights, spaced through the tile depth
  const zSlots = [-5, -12, -19]; // Z positions within tile
  const yLevels = [-1.8, 1.8]; // two height levels

  for (const z of zSlots) {
    for (const y of yLevels) {
      g.add(barbedWireX(y, z, matWire, matBarb));
    }
    // One extra strand at a third height (mid-level) for every other Z slot
    if (z === -12) g.add(barbedWireX(0, z, matWire, matBarb));
  }

  // ── vertical barbed wire strands on walls ──
  // Hung from ceiling on left/right, staggered in Z
  const vertZ = [-6, -18];
  const vertX = [-hw + 2.5, -hw + 6, hw - 2.5, hw - 6];
  for (const z of vertZ) {
    for (const x of vertX) {
      g.add(barbedWireY(x, z, matWire, matBarb));
    }
  }

  return g;
}

// ── main scene builder ───────────────────────────────────────────────────────
function buildScene(el: HTMLDivElement) {
  const W = el.clientWidth || window.innerWidth || 800;
  const H = el.clientHeight || 600;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG_N, 55, 150);

  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
  camera.position.set(0, 1.5, 14);
  camera.lookAt(0, 0, -60);

  const renderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(BG_N, 1);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  el.appendChild(renderer.domElement);

  // create and space tiles along the Z axis ahead of camera
  const tiles: THREE.Group[] = [];
  for (let i = 0; i < TILES_N; i++) {
    const tile = createTile();
    tile.position.z = -i * TILE_LEN; // first tile at z=0, next at z=-28, etc.
    scene.add(tile);
    tiles.push(tile);
  }

  let raf = 0;
  let t = 0;

  function animate() {
    raf = requestAnimationFrame(animate);
    t += 0.008;

    // fly-through: tiles move toward camera
    for (const tile of tiles) {
      tile.position.z += SPEED;
      // when tile's front face passes camera, teleport it to the back
      if (tile.position.z > camera.position.z) {
        tile.position.z -= TILES_N * TILE_LEN;
      }
    }

    // subtle camera sway (mild drift, not distracting)
    camera.position.x = Math.sin(t * 0.35) * 0.9;
    camera.position.y = 1.5 + Math.sin(t * 0.22) * 0.45;
    camera.lookAt(camera.position.x * 0.15, 0, -60);

    renderer.render(scene, camera);
  }
  animate();

  const onResize = () => {
    const w = el.clientWidth || window.innerWidth;
    const h = el.clientHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
  };
}

// ── React component ──────────────────────────────────────────────────────────
export function PyracryptBobwireSection() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || !isWebGLAvailable()) return;
    return buildScene(mountRef.current);
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "640px", background: "#04060f" }}
    >
      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* top/bottom page-blend gradients */}
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, hsl(var(--background)) 0%, #04060f 100%)",
          zIndex: 1,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to top, hsl(var(--background)) 0%, #04060f 100%)",
          zIndex: 1,
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[640px] px-4 py-24 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-6"
          style={{ background: `${TEAL}18`, border: `1px solid ${TEAL}40`, color: TEAL }}
        >
          <Shield className="w-3.5 h-3.5" /> Integrates with the Svivva platform
        </div>

        <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 text-white">
          <span style={{ color: TEAL }}>Pyracrypt</span>
        </h2>
        <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-4 leading-relaxed">
          Lock your files so only you can open them. AES-256 encryption that runs entirely in your
          browser — nothing ever leaves your device.
        </p>
        <p className="text-sm text-white/35 max-w-md mx-auto mb-10">
          Free forever · Pro plans from $19/mo · Zero upload · No sign-up needed
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/pyracrypt"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm"
            style={{ background: TEAL, boxShadow: `0 0 28px ${TEAL}50` }}
          >
            <Lock className="w-4 h-4" /> Try Pyracrypt Free
          </Link>
          <Link
            href="/pyracrypt#pricing"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm border text-white/60 hover:text-white transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
          >
            See Pro &amp; Team plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-8">
          {["AES-256", "Zero Upload", "No Account", "Free Forever", "Pro from $19/mo"].map(
            (tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `${TEAL}12`, border: `1px solid ${TEAL}28`, color: TEAL }}
              >
                {tag}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
