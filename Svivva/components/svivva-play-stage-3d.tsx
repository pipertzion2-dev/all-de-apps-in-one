"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type PlayStageModel = "v1" | "piano" | "vibraphone" | "steelpan" | "notebook" | "moog";

const MODELS: Record<PlayStageModel, string> = {
  v1: "/models/play/v1-console.glb",
  piano: "/models/play/play-piano.glb",
  vibraphone: "/models/play/play-vibraphone.glb",
  steelpan: "/models/play/play-steelpan.glb",
  notebook: "/models/play/play-composition-notebook.glb",
  moog: "/models/play/play-moog.glb",
};

export function SvivvaPlayStage3D({
  model,
  className = "",
  accent = "#A05068",
}: {
  model: PlayStageModel;
  className?: string;
  accent?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 0.85, 2.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 2 || h < 2) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    el.innerHTML = "";
    el.appendChild(renderer.domElement);
    resize();

    const hemi = new THREE.HemisphereLight(0xd8c8e8, 0x1a1a22, 0.65);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(2.2, 3.5, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(accent, 0.35);
    fill.position.set(-2, 1.5, -1.5);
    scene.add(fill);

    let root: THREE.Group | null = null;
    let cancelled = false;
    const loader = new GLTFLoader();
    const url = MODELS[model];

    setErr(null);
    setReady(false);

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;
        if (root) scene.remove(root);
        root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 1.35 / maxDim;
        root.scale.setScalar(scale);
        const c = box.getCenter(new THREE.Vector3());
        root.position.sub(c.multiplyScalar(scale));
        root.position.y += 0.05;
        scene.add(root);
        setReady(true);
      },
      undefined,
      () => {
        if (!cancelled) setErr("Model loading failed");
      },
    );

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (root) root.rotation.y += 0.0035;
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      renderer.dispose();
      el.innerHTML = "";
    };
  }, [model, accent]);

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-gray-800 bg-[#060606] ${className}`}
      style={{ minHeight: 200 }}
    >
      <div ref={wrapRef} className="w-full h-[220px] sm:h-[260px]" />
      {err && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-600/90 px-4 text-center bg-black/50">
          {err}
        </div>
      )}
      {!ready && !err && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">
          Loading 3D…
        </div>
      )}
    </div>
  );
}
