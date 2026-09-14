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
import { loadBaloon8BlueprintTexture } from "@/lib/clean-sneaks/baloon8-textures";

type Props = {
  className?: string;
  autoRotate?: boolean;
  bubbleCount?: number;
};

/**
 * Interactive Baloon8 car-shoe — textured from the user's four-view mockup.
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
    const count = bubbleCount ?? (isMobile ? 200 : 320);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080c);
    scene.fog = new THREE.FogExp2(0x06080c, 0.06);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 40);
    camera.position.set(2.8, 1.5, 2.6);

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

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(4, 6, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7ec8d9, 0.65);
    rim.position.set(-3, 2, -4);
    scene.add(rim);

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

    loadBaloon8BlueprintTexture()
      .then((blueprint) => {
        if (disposed) return;

        shoe = buildBaloon8Shoe(blueprint, count);
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
        const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.3, 0.82);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());

        const grid = new THREE.GridHelper(6, 24, 0x1a3040, 0x0e1820);
        scene.add(grid);

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
        console.error("[Baloon8ShoeScene] failed to load blueprint", err);
        if (!disposed && host) {
          host.innerHTML = `<img src="/assets/clean-sneaks/baloon8-blueprint.jpg" alt="Baloon8 blueprint" style="width:100%;height:100%;object-fit:contain;background:#06080c" />`;
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
