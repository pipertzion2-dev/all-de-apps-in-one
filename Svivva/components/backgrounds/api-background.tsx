"use client";

// AI API Builder — "packaging" motif from the BANG ON ME graphic.
// A grid of panels that fold/assemble; a packaging sweep scans across on scroll.

import { useRef, useEffect } from "react";
import * as THREE from "three";

const ACCENT = 0x9b4d6e;

export default function ApiBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const cols = 6;
    const rows = 4;
    const panels: { mesh: THREE.LineSegments; bx: number; by: number; ph: number }[] = [];
    const gw = 7;
    const gh = 4.5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = 3;
        const h = 2.4;
        const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.01));
        const mat = new THREE.LineBasicMaterial({
          color: ACCENT,
          transparent: true,
          opacity: 0.28,
        });
        const mesh = new THREE.LineSegments(edges, mat);
        const bx = (c - (cols - 1) / 2) * gw * 0.5;
        const by = (r - (rows - 1) / 2) * gh;
        mesh.position.set(bx, by, 0);
        scene.add(mesh);
        panels.push({ mesh, bx, by, ph: (c + r) * 0.4 });
      }
    }

    const onScroll = () => {
      scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    };
    window.addEventListener("scroll", onScroll);

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const scroll = scrollRef.current;
      panels.forEach((p) => {
        // Panels fold open at rest, assemble (flatten + close) as you scroll
        const fold = (1 - scroll) * (0.6 + 0.4 * Math.sin(t + p.ph));
        p.mesh.rotation.y = fold;
        p.mesh.rotation.x = fold * 0.3;
        const assemble = 0.4 + scroll * 0.6;
        p.mesh.position.x = p.bx * assemble;
        p.mesh.position.y = p.by * assemble;
        (p.mesh.material as THREE.LineBasicMaterial).opacity =
          0.18 + 0.14 * Math.sin(t * 2 + p.ph) + scroll * 0.15;
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
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
