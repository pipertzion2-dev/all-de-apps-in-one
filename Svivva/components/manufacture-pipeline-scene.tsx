"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Props = {
  activeStep?: number; // 0..5
  className?: string;
  height?: number;
  onStepSelect?: (index: number) => void;
};

const STEP_COLORS = [0x00e5ff, 0xc77dff, 0x5ba8a0, 0xff2bd6, 0xf59e0b, 0x39ff14];

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

/**
 * Interactive manufacture pipeline — six stage nodes on a helical path.
 * Hover/click stages; active step glows and attracts spark particles.
 */
export function ManufacturePipelineScene({
  activeStep = 0,
  className = "",
  height = 260,
  onStepSelect,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(activeStep);
  const onSelectRef = useRef(onStepSelect);
  const [ok, setOk] = useState(true);
  activeRef.current = activeStep;
  onSelectRef.current = onStepSelect;

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
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 40);
    camera.position.set(0, 1.2, 7.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "pointer";
    renderer.domElement.setAttribute("aria-label", "Interactive manufacture pipeline");

    const root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(2, 5, 4);
    scene.add(key);

    // Helical rail
    const railPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const u = i / 64;
      const a = u * Math.PI * 1.6 - 0.3;
      railPts.push(new THREE.Vector3(Math.cos(a) * 2.4, (u - 0.5) * 2.8, Math.sin(a) * 1.1));
    }
    const railCurve = new THREE.CatmullRomCurve3(railPts);
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(railCurve, 80, 0.025, 6, false),
      new THREE.MeshPhysicalMaterial({
        color: 0x8899aa,
        metalness: 0.85,
        roughness: 0.25,
        iridescence: 0.6,
      }),
    );
    root.add(rail);

    const nodes: THREE.Mesh[] = [];
    const nodeMats: THREE.MeshPhysicalMaterial[] = [];
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.5) / 6;
      const p = railCurve.getPoint(u);
      const mat = new THREE.MeshPhysicalMaterial({
        color: STEP_COLORS[i],
        emissive: STEP_COLORS[i],
        emissiveIntensity: 0.15,
        metalness: 0.4,
        roughness: 0.3,
        transmission: 0.2,
        thickness: 0.4,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), mat);
      mesh.position.copy(p);
      mesh.userData.index = i;
      nodes.push(mesh);
      nodeMats.push(mat);
      root.add(mesh);
    }

    // Sparks
    const SPARKS = 80;
    const sparkPos = new Float32Array(SPARKS * 3);
    const sparkSeed = new Float32Array(SPARKS);
    for (let i = 0; i < SPARKS; i++) {
      sparkSeed[i] = Math.random();
      const p = railCurve.getPoint(sparkSeed[i]);
      sparkPos[i * 3] = p.x;
      sparkPos[i * 3 + 1] = p.y;
      sparkPos[i * 3 + 2] = p.z;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    root.add(sparks);

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let hover = -1;

    const pick = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(nodes);
      return hits[0]?.object.userData.index as number | undefined;
    };

    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      hover = pick(e.clientX, e.clientY) ?? -1;
      renderer.domElement.style.cursor = hover >= 0 ? "pointer" : "grab";
    };
    const onClick = (e: PointerEvent) => {
      const idx = pick(e.clientX, e.clientY);
      if (typeof idx === "number") onSelectRef.current?.(idx);
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("click", onClick);

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
      const active = activeRef.current;

      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;

      if (!reduce) {
        root.rotation.y = pointer.x * 0.35 + t * 0.08;
        root.rotation.x = pointer.y * 0.15;

        for (let i = 0; i < nodes.length; i++) {
          const isActive = i === active;
          const isHover = i === hover;
          const target = isActive ? 1.35 : isHover ? 1.2 : 1;
          const s = THREE.MathUtils.lerp(nodes[i].scale.x, target, 0.12);
          nodes[i].scale.setScalar(s);
          nodeMats[i].emissiveIntensity = isActive ? 0.55 + Math.sin(t * 3) * 0.15 : isHover ? 0.35 : 0.12;
          nodes[i].rotation.y = t * (0.3 + i * 0.05);
        }

        const attr = sparkGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < SPARKS; i++) {
          const base = (sparkSeed[i] + t * 0.08) % 1;
          // Attract toward active stage
          const targetU = (active + 0.5) / 6;
          const u = THREE.MathUtils.lerp(base, targetU, 0.15);
          const p = railCurve.getPoint(u);
          attr.setXYZ(i, p.x, p.y + Math.sin(t * 4 + i) * 0.05, p.z);
        }
        attr.needsUpdate = true;
        sparkMat.color.setHex(STEP_COLORS[active] ?? 0xffffff);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      rail.geometry.dispose();
      (rail.material as THREE.Material).dispose();
      nodes.forEach((n) => {
        n.geometry.dispose();
        (n.material as THREE.Material).dispose();
      });
      sparkGeo.dispose();
      sparkMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [height]);

  if (!ok) {
    return (
      <div
        className={`rounded-xl border border-border/60 bg-gradient-to-br from-[#FF2BD6]/10 to-[#00E5FF]/10 ${className}`}
        style={{ height }}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative w-full overflow-hidden rounded-xl border border-border/50 bg-black/20 ${className}`}
      style={{ height }}
      data-testid="manufacture-pipeline-scene"
      title="Click a stage node · drag to orbit"
    />
  );
}
