"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

const ACCENT = 0x7c5cbf;

export default function PlayBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const linesRef = useRef<THREE.Line[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

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
    rendererRef.current = renderer;

    const lineCount = 40;
    const lines: THREE.Line[] = [];
    const segments = 100;

    for (let i = 0; i < lineCount; i++) {
      const positions = new Float32Array(segments * 3);
      for (let s = 0; s < segments; s++) {
        positions[s * 3] = (s / segments - 0.5) * 50;
        positions[s * 3 + 1] = 0;
        positions[s * 3 + 2] = 0;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: ACCENT,
        transparent: true,
        opacity: 0.15 + (i / lineCount) * 0.4,
      });
      const line = new THREE.Line(geo, mat);
      line.position.y = (i - lineCount / 2) * 1.2;
      scene.add(line);
      lines.push(line);
    }
    linesRef.current = lines;

    const onScroll = () => {
      scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    };
    window.addEventListener("scroll", onScroll);

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const scroll = scrollRef.current;
      lines.forEach((line, i) => {
        const pos = line.geometry.attributes.position as THREE.BufferAttribute;
        for (let s = 0; s < segments; s++) {
          const x = pos.getX(s);
          const phase = t * 2 + i * 0.3 + scroll * 10;
          const amp = 1.5 + Math.sin(t + i) * 0.5 + scroll * 3;
          pos.setY(s, Math.sin(x * 0.3 + phase) * amp * Math.sin((s / segments) * Math.PI));
        }
        pos.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity =
          (0.15 + (i / lineCount) * 0.4) * (0.6 + Math.sin(t * 3 + i) * 0.4);
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
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
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
