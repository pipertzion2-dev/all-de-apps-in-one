"use client";

// Hardware Mode — "crystal" motif from the DIAMOND FISTS graphic.
// Faceted diamonds rotate and refract; they grow sharper / spin faster on scroll.

import { useRef, useEffect } from "react";
import * as THREE from "three";

const ACCENT = 0xb5547a;

export default function HardwareBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const diamonds: { mesh: THREE.LineSegments; spin: number; ph: number; bx: number; by: number }[] = [];
    const placements = [
      [-9, 4, 2.6],
      [8, 6, 1.8],
      [6, -5, 2.2],
      [-7, -6, 1.6],
      [0, 0, 3.4],
      [-3, 8, 1.4],
      [3, -9, 1.5],
    ];

    placements.forEach(([x, y, s], i) => {
      // Octahedron = classic faceted diamond/crystal
      const geo = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(s));
      const mat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.32 });
      const mesh = new THREE.LineSegments(geo, mat);
      mesh.position.set(x, y, 0);
      scene.add(mesh);
      diamonds.push({ mesh, spin: 0.2 + (i % 3) * 0.15, ph: i * 0.7, bx: x, by: y });
    });

    const onScroll = () => {
      scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    };
    window.addEventListener("scroll", onScroll);

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const scroll = scrollRef.current;
      diamonds.forEach((d) => {
        const speed = d.spin * (1 + scroll * 2.5);
        d.mesh.rotation.x = t * speed;
        d.mesh.rotation.y = t * speed * 0.7;
        d.mesh.position.y = d.by + Math.sin(t * 0.6 + d.ph) * 0.6;
        const refract = 0.22 + Math.abs(Math.sin(t * 1.5 + d.ph)) * 0.4 + scroll * 0.2;
        (d.mesh.material as THREE.LineBasicMaterial).opacity = refract;
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1, pointerEvents: "none" }}
    />
  );
}
