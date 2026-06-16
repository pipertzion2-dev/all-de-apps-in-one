"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildSeedsReplitScene } from "@/lib/seeds-replit-scene";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";
import type { SeedsWorkflowState } from "@/lib/seeds-workflow-state";

type Props = {
  state: SeedsWorkflowState;
};

/** Full-page Replit-style workspace — spec monolith + deploy tiles across the entire viewport. */
export function SeedsImmersiveScene({ state }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

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
    renderer.toneMappingExposure = 1.35;
    const canvas = renderer.domElement;
    canvas.className = "absolute inset-0 h-full w-full pointer-events-none";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05080c, 0.045);

    const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 200);
    camera.position.set(0, 1.2, 11);

    scene.add(new THREE.AmbientLight(0x8aa4b8, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(5, 8, 10);
    scene.add(key);
    const tealLight = new THREE.PointLight(0x5ba8a0, 1.4, 40);
    tealLight.position.set(-4, 3, 6);
    scene.add(tealLight);
    const burgLight = new THREE.PointLight(0x6b2c4a, 0.9, 35);
    burgLight.position.set(5, 1, 2);
    scene.add(burgLight);

    const replitScene = buildSeedsReplitScene();
    scene.add(replitScene.root);

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

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
      const s = stateRef.current;

      replitScene.tick(t, s, mouse, scroll);

      camera.position.x = mouse.x * 0.55 + Math.sin(t * 0.12) * 0.08;
      camera.position.y = 1.1 + mouse.y * 0.35 - scroll * 1.8;
      camera.position.z = 10.5 - scroll * 2.5;
      camera.lookAt(mouse.x * 0.4, scroll * -0.5, -2);
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
      window.removeEventListener("mousemove", onMouseMove);
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
            "radial-gradient(ellipse 120% 80% at 50% 20%, rgba(91,168,160,0.12) 0%, transparent 55%)",
            "radial-gradient(ellipse 80% 60% at 80% 70%, rgba(107,44,74,0.1) 0%, transparent 50%)",
            "linear-gradient(180deg, rgba(5,8,12,0.2) 0%, rgba(5,8,12,0.65) 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
