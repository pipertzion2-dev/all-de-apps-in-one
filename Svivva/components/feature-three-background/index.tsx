"use client";

/**
 * FeatureThreeBackground — Pyracrypt-grade fly-through Three.js motifs per feature theme.
 * Fixed viewport background; no artwork texture planes.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FEATURES, type FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildFeaturePageScene } from "@/lib/feature-page-scenes";

export type FeatureVariant = FeatureId;

type Props = { variant: FeatureVariant };

export function FeatureThreeBackground({ variant }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const feature = FEATURES.find((f) => f.id === variant) ?? FEATURES[0];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x04060f, 0);
    const canvas = renderer.domElement;
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0";
    el.appendChild(canvas);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 1.5, 14);
    camera.lookAt(0, 0, -60);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(4, 6, 8);
    scene.add(key);

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let tick: (t: number) => void = () => {};
    let cancelled = false;
    buildFeaturePageScene(variant, scene, mouse)
      .then((fn) => {
        if (!cancelled) tick = fn;
      })
      .catch((err) => {
        console.warn("[FeatureThreeBackground] scene build failed:", err);
      });

    let rafId = 0;
    const start = Date.now();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = (Date.now() - start) / 1000;
      tick(t);
      camera.position.x = mouse.x * 0.6 + Math.sin(t * 0.35) * 0.9;
      camera.position.y = 1.5 + mouse.y * 0.3 + Math.sin(t * 0.22) * 0.45;
      camera.lookAt(camera.position.x * 0.15, 0, -60);
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
      canvas.remove();
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      aria-hidden
      data-svivva-feature-bg={variant}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${feature.accentColor}12 0%, #04060f 70%)`,
      }}
    />
  );
}
