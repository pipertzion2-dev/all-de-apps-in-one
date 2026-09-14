"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  className?: string;
};

const ZZAI_TEAL = 0x5b8da8;
const ZZAI_MAGENTA = 0xd94f9c;
const ZZAI_CYAN = 0x7ec8d9;

/**
 * Ambient Three.js cube field for Clean Sneaks fullscreen play.
 * Spinning wireframe cubes echo the ZZAI homepage cube motif.
 */
export function CleanSneaksCubeBackdrop({ className = "" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.08);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.set(0, 0.4, 5.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
    });
    renderer.domElement.setAttribute("aria-hidden", "true");

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 3, 4);
    scene.add(key);

    const cubes: Array<{
      mesh: THREE.Mesh;
      wire: THREE.LineSegments;
      spin: THREE.Vector3;
      bob: number;
      phase: number;
      baseY: number;
    }> = [];

    const palette = [ZZAI_TEAL, ZZAI_MAGENTA, ZZAI_CYAN];
    const positions: Array<[number, number, number]> = [
      [-2.4, 0.8, -1.2],
      [2.1, -0.6, -0.8],
      [0.3, 1.4, -2.4],
      [-1.2, -1.3, -1.6],
      [1.8, 0.5, -2.8],
      [-0.6, -0.2, -0.4],
    ];

    positions.forEach(([x, y, z], i) => {
      const size = 0.55 + (i % 3) * 0.18;
      const geo = new THREE.BoxGeometry(size, size, size);
      const color = palette[i % palette.length]!;
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        metalness: 0.65,
        roughness: 0.35,
        transparent: true,
        opacity: 0.42,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const wire = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.28,
        }),
      );
      wire.position.copy(mesh.position);
      scene.add(wire);

      cubes.push({
        mesh,
        wire,
        spin: new THREE.Vector3(
          reduced ? 0.08 : 0.35 + (i % 4) * 0.12,
          reduced ? 0.12 : 0.45 + (i % 3) * 0.1,
          reduced ? 0.06 : 0.28 + (i % 5) * 0.08,
        ),
        bob: 0.08 + (i % 3) * 0.04,
        phase: i * 1.7,
        baseY: y,
      });
    });

    const heroGroup = new THREE.Group();
    const heroSize = 1.35;
    const heroGeo = new THREE.BoxGeometry(heroSize, heroSize, heroSize);
    const heroMat = new THREE.MeshStandardMaterial({
      color: ZZAI_TEAL,
      emissive: ZZAI_MAGENTA,
      emissiveIntensity: 0.25,
      metalness: 0.75,
      roughness: 0.28,
      transparent: true,
      opacity: 0.55,
    });
    const hero = new THREE.Mesh(heroGeo, heroMat);
    heroGroup.add(hero);
    const heroWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(heroGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }),
    );
    heroGroup.add(heroWire);
    heroGroup.position.set(0, 0, -1.5);
    scene.add(heroGroup);

    let disposed = false;
    let raf = 0;
    let t0 = performance.now();

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const tick = (now: number) => {
      if (disposed) return;
      const t = (now - t0) * 0.001;

      heroGroup.rotation.x = t * 0.32;
      heroGroup.rotation.y = t * 0.48;
      heroGroup.rotation.z = Math.sin(t * 0.55) * 0.12;
      heroGroup.position.y = Math.sin(t * 0.9) * 0.15;

      cubes.forEach((c) => {
        c.mesh.rotation.x += c.spin.x * 0.016;
        c.mesh.rotation.y += c.spin.y * 0.016;
        c.mesh.rotation.z += c.spin.z * 0.016;
        c.wire.rotation.copy(c.mesh.rotation);
        const bob = Math.sin(t * 1.1 + c.phase) * c.bob;
        c.mesh.position.y = c.baseY + bob;
        c.wire.position.copy(c.mesh.position);
      });

      camera.position.x = Math.sin(t * 0.22) * 0.35;
      camera.lookAt(0, 0, -1.2);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      heroGeo.dispose();
      heroMat.dispose();
      (heroWire.geometry as THREE.BufferGeometry).dispose();
      (heroWire.material as THREE.Material).dispose();
      cubes.forEach((c) => {
        (c.mesh.geometry as THREE.BufferGeometry).dispose();
        (c.mesh.material as THREE.Material).dispose();
        (c.wire.geometry as THREE.BufferGeometry).dispose();
        (c.wire.material as THREE.Material).dispose();
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none ${className}`}
      aria-hidden
      data-testid="clean-sneaks-cube-backdrop"
    />
  );
}
