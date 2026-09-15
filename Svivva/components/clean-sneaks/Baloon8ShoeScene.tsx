"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  BALOON8_HERO_REFERENCE_URL,
  buildBaloon8ReferenceHero,
  buildBaloon8Shoe,
} from "@/lib/clean-sneaks/baloon8-shoe-model";
import {
  loadBaloon8BlueprintTexture,
  loadBaloon8HeroReferenceTexture,
} from "@/lib/clean-sneaks/baloon8-textures";

type Props = {
  className?: string;
  autoRotate?: boolean;
  bubbleCount?: number;
};

const STUDIO_BG = 0xededed;

/**
 * Baloon8 viewer — opens on the exact hero reference; drag to orbit the blueprint 3D.
 */
export function Baloon8ShoeScene({ className = "", autoRotate = true }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    let controls: OrbitControls | null = null;
    let hero: ReturnType<typeof buildBaloon8ReferenceHero> | null = null;
    let shoe: ReturnType<typeof buildBaloon8Shoe> | null = null;
    let showModel = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(STUDIO_BG);

    const camera = new THREE.PerspectiveCamera(isMobile ? 32 : 28, 1, 0.05, 40);
    camera.position.set(0.05, 1.05, 4.35);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(STUDIO_BG, 1);
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      touchAction: "none",
    });
    renderer.domElement.setAttribute("aria-label", "Baloon8 car-shoe — hero reference");

    const pmrem = new THREE.PMREMGenerator(renderer);
    const studioEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.92));
    const key = new THREE.DirectionalLight(0xffffff, 0.35);
    key.position.set(2, 4, 3);
    scene.add(key);

    const heroGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    modelGroup.visible = false;
    scene.add(heroGroup, modelGroup);

    const clock = new THREE.Clock();
    let userOrbiting = false;

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const switchToModel = () => {
      if (showModel) return;
      showModel = true;
      heroGroup.visible = false;
      modelGroup.visible = true;
      scene.background = new THREE.Color(0x06080c);
      scene.environment = studioEnv;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      if (controls) {
        controls.target.set(0, 0.28, 0);
        controls.minDistance = 1.4;
        controls.maxDistance = 5.5;
        controls.update();
      }
      camera.position.set(2.4, 1.35, 2.5);
    };

    Promise.all([loadBaloon8HeroReferenceTexture(), loadBaloon8BlueprintTexture()])
      .then(([heroTex, blueprint]) => {
        if (disposed) return;

        hero = buildBaloon8ReferenceHero(heroTex);
        heroGroup.add(hero.root);

        shoe = buildBaloon8Shoe(blueprint, 0);
        modelGroup.add(shoe.root);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.minDistance = 2.8;
        controls.maxDistance = 6;
        controls.maxPolarAngle = Math.PI * 0.48;
        controls.target.set(0, 0.72, 0);
        controls.update();

        controls.addEventListener("start", () => {
          userOrbiting = true;
          switchToModel();
        });

        resize();
        ro = new ResizeObserver(resize);
        ro.observe(host);

        const tick = () => {
          if (disposed || !controls) return;
          const t = clock.getElapsedTime();
          if (showModel && autoRotate && !reduced && !userOrbiting && shoe) {
            shoe.root.rotation.y = t * 0.32;
          }
          controls.update();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.error("[Baloon8ShoeScene] failed to load Baloon8 assets", err);
        if (!disposed && host) {
          host.innerHTML = `<img src="${BALOON8_HERO_REFERENCE_URL}" alt="Baloon8 reference" style="width:100%;height:100%;object-fit:contain;background:#ededed" />`;
        }
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      controls?.dispose();
      hero?.dispose();
      shoe?.dispose();
      pmrem.dispose();
      studioEnv.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);

  return (
    <div
      ref={hostRef}
      className={`relative h-full min-h-[280px] w-full bg-[#ededed] ${className}`}
      data-testid="baloon8-shoe-scene"
    />
  );
}
