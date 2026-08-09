"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildSeedsPipelineScene, type SeedPodVisual } from "@/lib/seeds-pipeline-scene";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";
import type { SeedsWorkflowState } from "@/lib/seeds-workflow-state";

type Props = {
  state: SeedsWorkflowState;
  seeds: SeedPodVisual[];
};

/** Full-page layered spec tree — PDF root, trunk stations, branched seed pods. */
export function SeedsImmersiveScene({ state, seeds }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const seedsRef = useRef(seeds);
  stateRef.current = state;
  seedsRef.current = seeds;

  useEffect(() => {
    const el = mountRef.current;
    const shell = shellRef.current;
    if (!el || !shell) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.42;
    const canvas = renderer.domElement;
    canvas.className = "absolute inset-0 h-full w-full pointer-events-none";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060a10, 0.032);

    const camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 120);
    camera.position.set(0.15, 0.25, 11.5);

    scene.add(new THREE.AmbientLight(0x8aa4b8, 0.48));
    const key = new THREE.DirectionalLight(0xffffff, 0.88);
    key.position.set(4, 8, 10);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x5ba8a0, 0.35);
    fill.position.set(-5, 2, 4);
    scene.add(fill);
    const tealLight = new THREE.PointLight(0x5ba8a0, 1.35, 38);
    tealLight.position.set(-2, 1, 5);
    scene.add(tealLight);
    const burgLight = new THREE.PointLight(0x6b2c4a, 0.85, 32);
    burgLight.position.set(3, -0.5, 3);
    scene.add(burgLight);

    const pipeline = buildSeedsPipelineScene();
    scene.add(pipeline.root);

    const scrollRef = { current: 0 };
    const onScroll = () => {
      scrollRef.current = pageScrollProgress();
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    onScroll();

    let raf = 0;
    const start = Date.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = (Date.now() - start) / 1000;
      const scroll = scrollRef.current;

      pipeline.tick(t, stateRef.current, seedsRef.current, scroll);

      camera.position.z = 11.5 - scroll * 1.4;
      camera.position.y = 0.2 - scroll * 0.45;
      camera.lookAt(0, 0.15 - scroll * 0.25, 0);
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", resize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", resize);
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
      data-seeds-immersive-scene
    >
      <div
        ref={mountRef}
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 90% 75% at 50% 42%, rgba(91,168,160,0.11) 0%, transparent 58%)",
            "radial-gradient(ellipse 65% 55% at 72% 62%, rgba(107,44,74,0.09) 0%, transparent 52%)",
            "radial-gradient(ellipse 50% 40% at 28% 68%, rgba(212,168,90,0.06) 0%, transparent 48%)",
            "linear-gradient(180deg, rgba(6,10,16,0.12) 0%, rgba(6,10,16,0.62) 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
