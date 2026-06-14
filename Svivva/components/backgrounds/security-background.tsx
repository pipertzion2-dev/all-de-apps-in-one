"use client";

// Security (Pyracrypt / Clutety) — "seal" motif from the FOREVER YOURS vault graphic.
// An ornate shackle + concentric lock rings that rotate closed and seal on scroll.

import { useRef, useEffect } from "react";
import * as THREE from "three";

const ACCENT = 0x6b2c4a;

export default function SecurityBackground() {
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

    const group = new THREE.Group();
    scene.add(group);

    // Concentric ornate lock rings
    const rings: THREE.LineLoop[] = [];
    for (let r = 0; r < 4; r++) {
      const radius = 4 + r * 2.4;
      const teeth = 24 + r * 8;
      const positions = new Float32Array((teeth + 1) * 3);
      for (let i = 0; i <= teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        const rr = radius + (i % 2 === 0 ? 0.6 : 0); // notched/ornate edge
        positions[i * 3] = Math.cos(a) * rr;
        positions[i * 3 + 1] = Math.sin(a) * rr;
        positions[i * 3 + 2] = 0;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.3 - r * 0.04 });
      const loop = new THREE.LineLoop(geo, mat);
      group.add(loop);
      rings.push(loop);
    }

    // Shackle (the lock's arc) drawn above the rings
    const shacklePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * (i / 40);
      shacklePts.push(new THREE.Vector3(Math.cos(a) * 5.5, Math.sin(a) * 5.5 + 7, 0));
    }
    const shackleGeo = new THREE.BufferGeometry().setFromPoints(shacklePts);
    const shackle = new THREE.Line(shackleGeo, new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.5 }));
    group.add(shackle);

    const onScroll = () => {
      scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    };
    window.addEventListener("scroll", onScroll);

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const scroll = scrollRef.current;
      rings.forEach((ring, r) => {
        const dir = r % 2 === 0 ? 1 : -1;
        // Rings rotate toward a locked alignment as you scroll
        ring.rotation.z = dir * (t * 0.1 + scroll * Math.PI) ;
        (ring.material as THREE.LineBasicMaterial).opacity = (0.3 - r * 0.04) * (0.7 + scroll * 0.5);
      });
      // Shackle drops down and "locks" as scroll approaches 1
      shackle.position.y = -scroll * 1.5;
      (shackle.material as THREE.LineBasicMaterial).opacity = 0.4 + scroll * 0.4;
      group.position.y = Math.sin(t * 0.5) * 0.4;
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
