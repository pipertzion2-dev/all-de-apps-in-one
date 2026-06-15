"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildFeaturePageScene } from "@/lib/feature-page-scenes";

type Props = {
  variant: FeatureId;
  accentColor: string;
  className?: string;
};

function sectionScrollProgress(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const travel = rect.height + vh * 0.6;
  const raw = (vh * 0.85 - rect.top) / travel;
  return Math.max(0, Math.min(1, raw));
}

export function FeatureSceneCanvas({ variant, accentColor, className = "" }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    const shell = shellRef.current;
    if (!el || !shell) return;

    const W = el.clientWidth || 400;
    const H = el.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const root = new THREE.Group();
    scene.add(root);

    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 120);
    camera.position.z = 11;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.65);
    key.position.set(3, 5, 8);
    scene.add(key);

    const mouse = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = shell.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    shell.addEventListener("pointermove", onPointer, { passive: true });

    let tick: (t: number, scroll: number) => void = () => {};
    let cancelled = false;
    buildFeaturePageScene(variant, root, mouse).then((fn) => {
      if (!cancelled) tick = fn;
    });

    let raf = 0;
    const start = Date.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = (Date.now() - start) / 1000;
      const scroll = sectionScrollProgress(shell);
      tick(t, scroll);
      root.rotation.y = scroll * Math.PI * 1.1 + mouse.x * 0.18;
      root.rotation.x = -0.12 + scroll * 0.22 + mouse.y * 0.08;
      camera.position.z = 11 - scroll * 2.8;
      camera.position.x = mouse.x * 0.35;
      camera.position.y = mouse.y * 0.22;
      camera.lookAt(mouse.x * 0.15, mouse.y * 0.1, 0);
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      shell.removeEventListener("pointermove", onPointer);
      ro.disconnect();
      renderer.dispose();
      canvas.remove();
    };
  }, [variant]);

  return (
    <div
      ref={shellRef}
      className={`relative aspect-square w-full max-w-md overflow-hidden rounded-2xl ${className}`}
      style={{
        boxShadow: `0 0 80px -12px ${accentColor}55`,
        background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${accentColor}14 0%, transparent 70%)`,
      }}
    >
      <div ref={mountRef} className="absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: `linear-gradient(to top, ${accentColor}22 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}
