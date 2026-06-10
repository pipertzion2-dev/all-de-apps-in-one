"use client";

/**
 * FeatureThreeBackground — artwork-derived floating elements from each feature graphic.
 * Regions are cropped from /public/artworks/*.png (see lib/artwork-atlas.ts).
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";
import { addSceneFloaters, loadArtworkTexture, tickFloaters } from "@/lib/artwork-three";

export type FeatureVariant = "play" | "seeds" | "orbit" | "security" | "api" | "hardware";

type Props = { variant: FeatureVariant };

const AMBIENT_BG: Record<FeatureVariant, string> = {
  play: "radial-gradient(ellipse 120% 80% at 50% 40%, rgba(124,92,191,0.22) 0%, transparent 55%), hsl(var(--background))",
  seeds:
    "radial-gradient(ellipse 120% 80% at 30% 50%, rgba(91,168,160,0.2) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 80% 30%, rgba(107,44,74,0.15) 0%, transparent 50%), hsl(var(--background))",
  orbit:
    "radial-gradient(ellipse 130% 90% at 50% 35%, rgba(91,168,160,0.18) 0%, transparent 55%), radial-gradient(ellipse 90% 70% at 75% 70%, rgba(107,44,74,0.14) 0%, transparent 50%), hsl(var(--background))",
  security:
    "radial-gradient(ellipse 120% 80% at 40% 45%, rgba(107,44,74,0.18) 0%, transparent 55%), hsl(var(--background))",
  api: "radial-gradient(ellipse 120% 80% at 60% 40%, rgba(155,77,110,0.16) 0%, transparent 55%), hsl(var(--background))",
  hardware:
    "radial-gradient(ellipse 120% 80% at 50% 45%, rgba(181,84,122,0.18) 0%, transparent 55%), hsl(var(--background))",
};

function buildArtworkScene(
  variant: FeatureVariant,
  scene: THREE.Scene,
  mouse: { x: number; y: number },
): Promise<(t: number) => void> {
  const manifest = ARTWORK_MANIFESTS[variant];
  return loadArtworkTexture(manifest.src).then((tex) => {
    const floaters = addSceneFloaters(scene, tex, manifest.sceneElements);

    // Soft accent wash behind artwork pieces
    const wash = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 14),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(manifest.accentColor),
        transparent: true,
        opacity: 0.04,
        depthWrite: false,
      }),
    );
    wash.position.z = -8;
    scene.add(wash);

    return (t: number) => {
      tickFloaters(floaters, mouse, t);
      wash.position.x = mouse.x * 0.4;
      wash.position.y = mouse.y * 0.3;
    };
  });
}

export function FeatureThreeBackground({ variant }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 8;

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let tick: (t: number) => void = () => {};
    let cancelled = false;
    buildArtworkScene(variant, scene, mouse).then((fn) => {
      if (!cancelled) tick = fn;
    });

    let rafId = 0;
    const start = Date.now();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      tick((Date.now() - start) / 1000);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 pointer-events-none w-full min-h-full"
      style={{ background: AMBIENT_BG[variant] }}
    />
  );
}
