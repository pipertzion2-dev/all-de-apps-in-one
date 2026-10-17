"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/** Cap concurrent WebGL flower scenes (buttons share a soft budget). */
let activeBlooms = 0;
const MAX_ACTIVE = 6;

type Tint = "blue" | "purple" | "mixed";

function makePetal(color: number, w: number, h: number) {
  const geo = new THREE.SphereGeometry(1, 12, 10);
  geo.scale(w, h, 0.18);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.28,
    metalness: 0.2,
    transparent: true,
    opacity: 0.95,
    emissive: color,
    emissiveIntensity: 0.28,
  });
  return new THREE.Mesh(geo, mat);
}

function makeFlower(tint: Tint, seed: number) {
  const group = new THREE.Group();
  const blue = 0x6d91b3;
  const purple = 0xac81af;
  const primary =
    tint === "blue" ? blue : tint === "purple" ? purple : seed % 2 === 0 ? blue : purple;
  const secondary = primary === blue ? purple : blue;
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const petal = makePetal(i % 2 === 0 ? primary : secondary, 0.32, 0.7);
    const a = (i / petals) * Math.PI * 2 + seed * 0.15;
    petal.position.set(Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0.02);
    petal.rotation.z = a + Math.PI / 2;
    petal.rotation.x = 0.55;
    group.add(petal);
  }
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfff8fc,
      emissive: secondary,
      emissiveIntensity: 0.45,
      roughness: 0.35,
    }),
  );
  group.add(center);
  group.userData.phase = seed * 0.7;
  return group;
}

/**
 * Tiny Three.js CRT-style flower field for glass buttons.
 * Mounts only while visible and under a global WebGL budget.
 */
export function ButtonFlowerBloom({
  className,
  tint = "mixed",
  density = "normal",
}: {
  className?: string;
  tint?: Tint;
  density?: "sparse" | "normal";
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let allowed = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = Boolean(entry?.isIntersecting);
        if (on && !allowed && activeBlooms < MAX_ACTIVE) {
          activeBlooms += 1;
          allowed = true;
          setLive(true);
        } else if (!on && allowed) {
          activeBlooms = Math.max(0, activeBlooms - 1);
          allowed = false;
          setLive(false);
        }
      },
      { rootMargin: "40px", threshold: 0.05 },
    );
    io.observe(host);
    return () => {
      io.disconnect();
      if (allowed) {
        activeBlooms = Math.max(0, activeBlooms - 1);
        allowed = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!live) return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    const w = Math.max(host.clientWidth, 48);
    const h = Math.max(host.clientHeight, 36);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 20);
    camera.position.set(0, 0, 3.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;";
    host.appendChild(canvas);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(1.5, 2, 3);
    scene.add(key);
    const fill = new THREE.PointLight(0xac81af, 0.45);
    fill.position.set(-1.2, -0.4, 1.5);
    scene.add(fill);

    const count = density === "sparse" ? 2 : 4;
    const flowers: THREE.Group[] = [];
    for (let i = 0; i < count; i++) {
      const flower = makeFlower(tint, i + 1);
      const x = ((i % 3) - 1) * 0.95;
      const y = (Math.floor(i / 3) - 0.35) * 0.7 + (i % 2) * 0.15;
      flower.position.set(x, y, -0.2 - (i % 3) * 0.08);
      flower.scale.setScalar(0.55 + (i % 3) * 0.12);
      scene.add(flower);
      flowers.push(flower);
    }

    const ro = new ResizeObserver(() => {
      if (disposed || !host) return;
      const nw = Math.max(host.clientWidth, 48);
      const nh = Math.max(host.clientHeight, 36);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    });
    ro.observe(host);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (t: number) => {
      if (disposed) return;
      if (!reduced) {
        const s = t * 0.001;
        flowers.forEach((f, i) => {
          const phase = f.userData.phase as number;
          f.rotation.y = Math.sin(s * 0.9 + phase) * 0.25;
          f.rotation.z = Math.cos(s * 0.7 + phase) * 0.12;
          f.position.y += Math.sin(s * 1.4 + phase + i) * 0.00035;
        });
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      flowers.forEach((f) => {
        f.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const m = obj.material;
            if (Array.isArray(m)) m.forEach((x) => x.dispose());
            else m.dispose();
          }
        });
        scene.remove(f);
      });
      renderer.dispose();
      canvas.remove();
    };
  }, [live, tint, density]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className,
      )}
    />
  );
}
