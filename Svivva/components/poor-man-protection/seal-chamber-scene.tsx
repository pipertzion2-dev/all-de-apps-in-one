"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  /** 0..1 seal progress — drives bloom/coin spin */
  progress?: number;
  palette?: string[];
  className?: string;
  /** "ambient" idle chamber vs "sealing" active ceremony */
  mode?: "ambient" | "sealing" | "sealed";
};

/**
 * Distinctive ZZAI Poor Man Protection chamber — dual-axis rings + protection coin.
 * Section-scoped WebGL so it does not compete with page FeatureThreeBackground.
 */
export function SealChamberScene({
  progress = 0,
  palette = ["#5B8DA8", "#6B2C4E", "#D4A5B8", "#8B6B5A"],
  className = "",
  mode = "ambient",
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 320;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.1);
    light.position.set(2, 3, 4);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const group = new THREE.Group();
    scene.add(group);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.045, 16, 96),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette[0] || "#5B8DA8"),
        metalness: 0.55,
        roughness: 0.35,
      }),
    );
    ringA.rotation.x = Math.PI / 2.4;
    group.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.04, 16, 80),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette[1] || "#6B2C4E"),
        metalness: 0.5,
        roughness: 0.4,
      }),
    );
    ringB.rotation.y = Math.PI / 3;
    group.add(ringB);

    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.08, 48),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette[2] || "#D4A5B8"),
        metalness: 0.85,
        roughness: 0.22,
        emissive: new THREE.Color(palette[0] || "#5B8DA8"),
        emissiveIntensity: 0.15,
      }),
    );
    coin.rotation.x = Math.PI / 2;
    group.add(coin);

    // Palette orbs along axis B
    const orbs: THREE.Mesh[] = [];
    palette.slice(0, 5).forEach((hex, i) => {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 16, 16),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.3 }),
      );
      const a = (i / 5) * Math.PI * 2;
      orb.position.set(Math.cos(a) * 1.45, Math.sin(a * 1.3) * 0.25, Math.sin(a) * 1.45);
      group.add(orb);
      orbs.push(orb);
    });

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const p = Math.min(1, Math.max(0, progress));
      const sealBoost = mode === "sealing" ? 1.4 : mode === "sealed" ? 0.6 : 0.35;
      ringA.rotation.z = t * 0.25 * sealBoost + p * Math.PI;
      ringB.rotation.x = t * 0.35 * sealBoost;
      coin.rotation.z = t * (0.4 + p) * (mode === "ambient" ? 0.5 : 1.2);
      coin.scale.setScalar(0.9 + p * 0.35);
      orbs.forEach((orb, i) => {
        orb.position.y = Math.sin(t * 1.4 + i) * 0.2 * (0.5 + p);
      });
      group.rotation.y = Math.sin(t * 0.2) * 0.15 + p * 0.4;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [mode, palette, progress]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-[220px] sm:h-[280px] rounded-2xl overflow-hidden border border-[#5B8DA8]/25 bg-gradient-to-b from-[#0b1220]/80 to-[#121a2b]/90 ${className}`}
      aria-hidden
    />
  );
}
