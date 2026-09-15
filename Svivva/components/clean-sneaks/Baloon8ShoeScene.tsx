"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import {
  BALOON8_DIMS,
  BALOON8_SCENE_SCALE,
  buildBaloon8Shoe,
} from "@/lib/clean-sneaks/baloon8-shoe-model";

type Props = {
  className?: string;
  autoRotate?: boolean;
  bubbleCount?: number;
};

/**
 * Interactive BALOON8 car-sneaker — advanced procedural Three.js mesh matching
 * the orthographic brand blueprint (packed iridescent balloons, neon e8 grille,
 * crystal wheels). Orbit to inspect; bloom accents the green grille.
 */
export function Baloon8ShoeScene({ className = "", autoRotate = true, bubbleCount }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    let controls: OrbitControls | null = null;
    let composer: EffectComposer | null = null;
    let shoe: ReturnType<typeof buildBaloon8Shoe> | null = null;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const count = bubbleCount ?? (isMobile ? 1000 : 2800);

    // Light studio like the orthographic blueprint / sneaker reference
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f3f5);
    scene.fog = new THREE.Fog(0xf2f3f5, 8, 22);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 40);
    camera.position.set(2.55, 1.15, 2.35);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0xf2f3f5, 1);
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.45);
    key.position.set(4, 7, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(-3, 4, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xb8d4e0, 0.5);
    rim.position.set(-2, 2, -5);
    scene.add(rim);
    const grilleFill = new THREE.PointLight(0x36f078, 0.7, 8, 2);
    grilleFill.position.set(2.2, 0.85, 0);
    scene.add(grilleFill);

    const clock = new THREE.Clock();
    let userOrbiting = false;
    const lookAtY = (BALOON8_DIMS.height * BALOON8_SCENE_SCALE) / 2;

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
    };

    Promise.resolve()
      .then(() => {
        if (disposed) return;

        shoe = buildBaloon8Shoe(undefined, count);
        scene.add(shoe.root);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.minDistance = 1.6;
        controls.maxDistance = 6;
        controls.maxPolarAngle = Math.PI * 0.48;
        controls.target.set(0, lookAtY, 0);
        controls.update();

        controls.addEventListener("start", () => {
          userOrbiting = true;
        });
        controls.addEventListener("end", () => {
          userOrbiting = false;
        });

        composer = new EffectComposer(renderer);
        composer.setPixelRatio(dpr);
        composer.addPass(new RenderPass(scene, camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.35, 0.82);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());

        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(4.5, 64),
          new THREE.MeshStandardMaterial({
            color: 0xe8eaee,
            roughness: 0.92,
            metalness: 0.05,
          }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.receiveShadow = true;
        scene.add(ground);

        resize();
        ro = new ResizeObserver(resize);
        ro.observe(host);

        const tick = () => {
          if (disposed || !shoe || !composer || !controls) return;
          const t = clock.getElapsedTime();
          if (autoRotate && !reduced && !userOrbiting) {
            shoe.root.rotation.y = t * 0.35;
          }
          controls.update();
          composer.render();
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.error("[Baloon8ShoeScene] failed to build Baloon8 sneaker", err);
        if (!disposed && host) {
          host.innerHTML = `<div style="display:grid;place-items:center;width:100%;height:100%;background:#f2f3f5;color:#5a6570;font:500 14px/1.4 system-ui,sans-serif;padding:1.5rem;text-align:center">3D sneaker unavailable in this browser</div>`;
        }
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      controls?.dispose();
      composer?.dispose();
      shoe?.dispose();
      pmrem.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
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
