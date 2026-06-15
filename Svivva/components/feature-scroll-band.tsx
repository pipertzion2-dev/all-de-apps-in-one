"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import { buildGraphicScrollHeroScene } from "@/lib/feature-scroll-hero-scene";
import { elementScrollProgress } from "@/lib/feature-scroll-progress";

type Props = {
  variant: FeatureId;
  accentColor: string;
  className?: string;
  height?: number;
  /** Edge-to-edge immersive band (default). Set false for inset homepage sections. */
  immersive?: boolean;
};

export function FeatureScrollBand({
  variant,
  accentColor,
  className = "",
  height = 480,
  immersive = true,
}: Props) {
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    const canvas = renderer.domElement;
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 160);
    camera.position.set(0, 0.35, 11);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(3, 5, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color(accentColor).getHex(), 0.65);
    rim.position.set(-4, 1, -3);
    scene.add(rim);
    const accentLight = new THREE.PointLight(new THREE.Color(accentColor).getHex(), 1.6, 48);
    accentLight.position.set(-2, 1.5, 6);
    scene.add(accentLight);

    const heroScene = buildGraphicScrollHeroScene(variant, palette);
    heroScene.root.scale.setScalar(variant === "seeds" ? 1.08 : 0.95);
    scene.add(heroScene.root);

    const mouse = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    shell.addEventListener("pointermove", onPointerMove, { passive: true });

    let raf = 0;
    const start = Date.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = (Date.now() - start) / 1000;
      const bandScroll = elementScrollProgress(shell);
      const pageScroll =
        typeof window !== "undefined"
          ? Math.min(1, window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1))
          : 0;
      const scroll = Math.max(bandScroll, pageScroll * 0.35);

      heroScene.tick(t, scroll, mouse);

      camera.position.x = mouse.x * 0.35;
      camera.position.y = 0.2 + mouse.y * 0.18 + scroll * 0.28;
      camera.position.z = 10.5 - scroll * 4.5;
      camera.lookAt(0, scroll * 0.12, 0);
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
      /* progress sampled each frame */
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    shell.closest("main")?.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true });
      shell.removeEventListener("pointermove", onPointerMove);
      shell.closest("main")?.removeEventListener("scroll", onScroll);
      ro.disconnect();
      renderer.dispose();
      canvas.remove();
    };
  }, [variant, height, accentColor]);

  return (
    <div
      ref={shellRef}
      className={`relative w-full overflow-hidden ${immersive ? "rounded-none border-0" : "rounded-xl border border-border/30"} ${className}`}
      style={{
        height,
        background: immersive
          ? `radial-gradient(ellipse 90% 70% at 50% 45%, ${accentColor}22 0%, transparent 62%), radial-gradient(ellipse 60% 40% at 20% 80%, ${accentColor}12 0%, transparent 55%)`
          : `linear-gradient(180deg, ${accentColor}12 0%, transparent 50%, ${accentColor}08 100%)`,
      }}
      data-feature-scroll-band={variant}
      aria-hidden
    >
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}
