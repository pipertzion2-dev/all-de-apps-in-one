"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type HybridVizScores = {
  domainAffinity?: number;
  topologyFit?: number;
  hybridViability?: number;
  noveltyIndex?: number;
  materialInterfaceRisk?: number;
};

type Props = {
  scores?: HybridVizScores | null;
  mode?: "complementary" | "antagonistic" | "emergent" | "biomimetic";
  className?: string;
  height?: number;
};

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

/**
 * Interactive dual-domain hybridization field:
 * two orbital cores, bridging particle flux, pointer tilt, score-driven intensity.
 */
export function HybridizationFieldScene({
  scores,
  mode = "complementary",
  className = "",
  height = 280,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scoresRef = useRef(scores);
  const modeRef = useRef(mode);
  const [ok, setOk] = useState(true);
  scoresRef.current = scores;
  modeRef.current = mode;

  useEffect(() => {
    if (!webglOk()) {
      setOk(false);
      return;
    }
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const w = mount.clientWidth || 640;
    const h = mount.clientHeight || height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 50);
    camera.position.set(0, 0.35, 5.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.setAttribute("aria-label", "Interactive hybridization field");

    const root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0x00e5ff, 0.9);
    key.position.set(3, 4, 5);
    const fill = new THREE.DirectionalLight(0xff2bd6, 0.55);
    fill.position.set(-4, 1, 2);
    scene.add(key, fill);

    const coreGeo = new THREE.IcosahedronGeometry(0.55, 2);
    const coreAMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      metalness: 0.35,
      roughness: 0.25,
      transmission: 0.35,
      thickness: 0.6,
      transparent: true,
      opacity: 0.92,
      iridescence: 0.8,
      iridescenceIOR: 1.3,
    });
    const coreBMat = new THREE.MeshPhysicalMaterial({
      color: 0xff2bd6,
      metalness: 0.35,
      roughness: 0.25,
      transmission: 0.35,
      thickness: 0.6,
      transparent: true,
      opacity: 0.92,
      iridescence: 0.8,
      iridescenceIOR: 1.3,
    });
    const coreA = new THREE.Mesh(coreGeo, coreAMat);
    const coreB = new THREE.Mesh(coreGeo.clone(), coreBMat);
    coreA.position.x = -1.55;
    coreB.position.x = 1.55;
    root.add(coreA, coreB);

    // Wire shells = topology cages
    const shellA = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.78, 1),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.35 }),
    );
    const shellB = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.78, 1),
      new THREE.MeshBasicMaterial({ color: 0xff2bd6, wireframe: true, transparent: true, opacity: 0.35 }),
    );
    shellA.position.copy(coreA.position);
    shellB.position.copy(coreB.position);
    root.add(shellA, shellB);

    // Bridge arc (Bezier ribbon via tubes)
    const bridgeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.1, 0, 0),
      new THREE.Vector3(0, 1.1, 0.4),
      new THREE.Vector3(1.1, 0, 0),
    );
    const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 48, 0.035, 8, false);
    const bridgeMat = new THREE.MeshPhysicalMaterial({
      color: 0xb8f7ff,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x003344,
      transparent: true,
      opacity: 0.85,
    });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    root.add(bridge);

    // Flux particles along bridge
    const COUNT = 120;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      seeds[i] = Math.random();
      const p = bridgeCurve.getPoint(seeds[i]);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.06,
      color: 0x39ff14,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pGeo, pMat);
    root.add(points);

    // Emergent nucleus at bridge apex
    const nucleus = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xc77dff,
        emissive: 0x4a0066,
        metalness: 0.5,
        roughness: 0.15,
        iridescence: 1,
      }),
    );
    nucleus.position.set(0, 0.95, 0.2);
    root.add(nucleus);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, burst: 0 };
    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const onDown = () => {
      pointer.burst = 1;
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);

    const onResize = () => {
      const nw = mount.clientWidth || w;
      const nh = mount.clientHeight || h;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const s = scoresRef.current;
      const viability = (s?.hybridViability ?? 55) / 100;
      const affinity = (s?.domainAffinity ?? 60) / 100;
      const novelty = (s?.noveltyIndex ?? 40) / 100;
      const risk = (s?.materialInterfaceRisk ?? 40) / 100;
      const m = modeRef.current;

      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      pointer.burst *= 0.9;

      if (!reduce) {
        root.rotation.y = pointer.x * 0.45;
        root.rotation.x = pointer.y * 0.25;
        coreA.rotation.y = t * 0.35;
        coreB.rotation.y = -t * 0.4;
        shellA.rotation.x = t * 0.2;
        shellB.rotation.z = t * 0.25;
        nucleus.rotation.x = t * 0.8;
        nucleus.rotation.y = t * 0.6;
        const pulse = 1 + Math.sin(t * 2.2) * 0.04 * viability + pointer.burst * 0.12;
        nucleus.scale.setScalar(pulse * (0.85 + novelty * 0.4));

        // Mode-colored bridge emissive
        const modeColor =
          m === "emergent"
            ? 0xc77dff
            : m === "antagonistic"
              ? 0xff6b35
              : m === "biomimetic"
                ? 0x39ff14
                : 0x00e5ff;
        bridgeMat.color.setHex(modeColor);
        bridgeMat.opacity = 0.45 + affinity * 0.5;
        pMat.size = 0.04 + affinity * 0.08 + pointer.burst * 0.05;
        pMat.opacity = 0.5 + affinity * 0.45;

        // Risk heats core separation slightly
        const sep = 1.45 + risk * 0.35;
        coreA.position.x = -sep;
        coreB.position.x = sep;
        shellA.position.x = -sep;
        shellB.position.x = sep;

        const pos = pGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < COUNT; i++) {
          const u = (seeds[i] + t * (0.15 + affinity * 0.25)) % 1;
          const p = bridgeCurve.getPoint(u);
          const wobble = Math.sin(t * 3 + i) * 0.04 * (1 + pointer.burst);
          pos.setXYZ(i, p.x, p.y + wobble, p.z + wobble * 0.5);
        }
        pos.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      coreGeo.dispose();
      coreAMat.dispose();
      coreBMat.dispose();
      bridgeGeo.dispose();
      bridgeMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [height]);

  if (!ok) {
    return (
      <div
        className={`rounded-xl border border-border/60 bg-gradient-to-br from-[#00E5FF]/10 to-[#FF2BD6]/10 ${className}`}
        style={{ height }}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative w-full overflow-hidden rounded-xl border border-border/50 bg-black/20 ${className}`}
      style={{ height }}
      data-testid="hybridization-field-scene"
      title="Drag to tilt · click to pulse the bridge"
    />
  );
}
