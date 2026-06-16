"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  buildSeedsPipelineScene,
  type SeedPodVisual,
} from "@/lib/seeds-pipeline-scene";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";
import type { SeedsWorkflowState } from "@/lib/seeds-workflow-state";

type Props = {
  state: SeedsWorkflowState;
  seeds: SeedPodVisual[];
};

/** Full-page spec pipeline — PDF → parse → verify → branched seed pods. */
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
    renderer.toneMappingExposure = 1.28;
    const canvas = renderer.domElement;
    canvas.className = "absolute inset-0 h-full w-full pointer-events-none";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060a10, 0.038);

    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 120);
    camera.position.set(0, 0.4, 13);

    scene.add(new THREE.AmbientLight(0x8aa4b8, 0.42));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(4, 6, 10);
    scene.add(key);
    const tealLight = new THREE.PointLight(0x5ba8a0, 1.2, 35);
    tealLight.position.set(-3, 2, 5);
    scene.add(tealLight);
    const burgLight = new THREE.PointLight(0x6b2c4a, 0.75, 30);
    burgLight.position.set(4, 0, 3);
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

      camera.position.z = 13 - scroll * 1.6;
      camera.position.y = 0.35 - scroll * 0.35;
      camera.lookAt(0.5, scroll * -0.2, 0);
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
            "radial-gradient(ellipse 100% 70% at 35% 45%, rgba(91,168,160,0.1) 0%, transparent 55%)",
            "radial-gradient(ellipse 70% 50% at 75% 55%, rgba(107,44,74,0.08) 0%, transparent 50%)",
            "linear-gradient(180deg, rgba(6,10,16,0.15) 0%, rgba(6,10,16,0.6) 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
