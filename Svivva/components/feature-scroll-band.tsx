"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import { buildImmersiveScrollScene } from "@/lib/feature-immersive-scroll";

type Props = {
  variant: FeatureId;
  accentColor: string;
  className?: string;
  height?: number;
};

function bandScrollProgress(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const travel = rect.height + vh;
  return Math.max(0, Math.min(1, (vh * 0.75 - rect.top) / travel));
}

export function FeatureScrollBand({ variant, accentColor, className = "", height = 280 }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    const shell = shellRef.current;
    if (!el || !shell) return;

    const palette = getGraphicPalette(variant);
    const W = el.clientWidth || 800;
    const H = height;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.cssText = "display:block;width:100%;height:100%";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 140);
    camera.position.set(0, 0.5, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(2, 4, 6);
    scene.add(key);

    const immersive = buildImmersiveScrollScene(variant, palette);
    scene.add(immersive.root);

    let raf = 0;
    const start = Date.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = (Date.now() - start) / 1000;
      const scroll = bandScrollProgress(shell);
      immersive.tick(t, scroll);

      camera.position.x = Math.sin(t * 0.2 + scroll * 1.2) * 0.6;
      camera.position.y = 0.4 + Math.sin(t * 0.15) * 0.15 + scroll * 0.3;
      camera.position.z = 9 - scroll * 3.5;
      camera.lookAt(0, scroll * 0.2, -4);
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (!w) return;
      camera.aspect = w / H;
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
    });
    ro.observe(el);

    const onScroll = () => {
      /* scroll read inside animate via bandScrollProgress */
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true });
      ro.disconnect();
      renderer.dispose();
      canvas.remove();
    };
  }, [variant, height]);

  return (
    <div
      ref={shellRef}
      className={`relative w-full overflow-hidden rounded-xl border border-border/40 ${className}`}
      style={{
        height,
        background: `linear-gradient(180deg, ${accentColor}14 0%, transparent 42%, ${accentColor}10 100%)`,
        boxShadow: `inset 0 1px 0 ${accentColor}40, 0 12px 40px -10px ${accentColor}45`,
      }}
    >
      <div ref={mountRef} className="absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-12"
        style={{ background: "linear-gradient(to bottom, hsl(var(--background) / 0.7), transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
        style={{ background: "linear-gradient(to top, hsl(var(--background) / 0.7), transparent)" }}
      />
      <p
        className="absolute bottom-2 right-3 text-[9px] uppercase tracking-[0.25em] font-mono opacity-40"
        style={{ color: accentColor }}
      >
        scroll · 3d
      </p>
    </div>
  );
}
