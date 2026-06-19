"use client";

// Svivva Seeds — "branching" motif from the SETTLE DOWN graphic.
// Filaments branch outward from a central seed and grow on scroll.

import { useRef, useEffect } from "react";
import * as THREE from "three";

const ACCENT = 0x5ba8a0;

export default function SeedsBackground() {
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
    camera.position.z = 32;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const branchCount = 9;
    const segments = 60;
    const branches: { line: THREE.Line; angle: number; spread: number }[] = [];

    for (let b = 0; b < branchCount; b++) {
      const positions = new Float32Array(segments * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: ACCENT,
        transparent: true,
        opacity: 0.18 + (b / branchCount) * 0.3,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      branches.push({
        line,
        angle: (b / branchCount) * Math.PI * 2,
        spread: 0.6 + Math.random() * 0.6,
      });
    }

    const nodeGeo = new THREE.BufferGeometry();
    const nodePos = new Float32Array(branchCount * 3);
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: ACCENT,
      size: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodes);

    const onScroll = () => {
      scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    };
    window.addEventListener("scroll", onScroll);

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const scroll = scrollRef.current;
      const grow = 8 + scroll * 22;
      branches.forEach((br, b) => {
        const pos = br.line.geometry.attributes.position as THREE.BufferAttribute;
        const ang = br.angle + Math.sin(t * 0.3 + b) * 0.15;
        for (let s = 0; s < segments; s++) {
          const f = s / segments;
          const wobble = Math.sin(f * 6 + t + b) * br.spread * f;
          const r = f * grow;
          pos.setX(s, Math.cos(ang) * r - Math.sin(ang) * wobble);
          pos.setY(s, Math.sin(ang) * r + Math.cos(ang) * wobble);
          pos.setZ(s, 0);
        }
        pos.needsUpdate = true;
        const np = nodes.geometry.attributes.position as THREE.BufferAttribute;
        np.setXYZ(b, Math.cos(ang) * grow, Math.sin(ang) * grow, 0);
        np.needsUpdate = true;
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
