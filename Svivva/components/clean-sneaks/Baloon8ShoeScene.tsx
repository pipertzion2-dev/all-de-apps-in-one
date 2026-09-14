"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { buildBaloon8Shoe } from "@/lib/clean-sneaks/baloon8-shoe-model";

type Props = {
  className?: string;
  /** Auto-rotate showcase (default true). */
  autoRotate?: boolean;
  /** Bubble instance count — lower on mobile for perf. */
  bubbleCount?: number;
};

/**
 * Advanced Three.js viewer for the Baloon8 car-shoe mockup.
 * Iridescent bubble coat, glowing grille, transparent wheels, bloom post-FX.
 */
export function Baloon8ShoeScene({ className = "", autoRotate = true, bubbleCount }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const count = bubbleCount ?? (isMobile ? 1200 : 2400);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080c);
    scene.fog = new THREE.FogExp2(0x06080c, 0.045);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 80);
    camera.position.set(5.5, 2.4, 4.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x06080c, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      touchAction: "none",
    });
    renderer.domElement.setAttribute("aria-label", "Baloon8 3D car-shoe model");

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(6, 8, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7ec8d9, 0.55);
    rim.position.set(-4, 3, -6);
    scene.add(rim);
    const fill = new THREE.PointLight(0xd94f9c, 0.45, 20);
    fill.position.set(-2, 2, 3);
    scene.add(fill);

    const shoe = buildBaloon8Shoe(count);
    scene.add(shoe.root);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 0.55, 0);
    controls.update();

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.35, 0.72);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const grid = new THREE.GridHelper(14, 28, 0x1a3040, 0x0e1820);
    grid.position.y = -0.02;
    scene.add(grid);

    let disposed = false;
    let raf = 0;
    let userOrbiting = false;
    const clock = new THREE.Clock();

    controls.addEventListener("start", () => {
      userOrbiting = true;
    });
    controls.addEventListener("end", () => {
      userOrbiting = false;
    });

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloom.resolution.set(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();

      if (autoRotate && !reduced && !userOrbiting) {
        shoe.root.rotation.y = -Math.PI / 2 + t * 0.18;
      }

      const pulse = 0.85 + Math.sin(t * 2.2) * 0.15;
      shoe.glowMeshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = pulse * 1.2;
      });

      controls.update();
      composer.render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      composer.dispose();
      shoe.dispose();
      pmrem.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [autoRotate, bubbleCount]);

  return (
    <div
      ref={hostRef}
      className={`relative h-full min-h-[280px] w-full ${className}`}
      data-testid="baloon8-shoe-scene"
    />
  );
}
