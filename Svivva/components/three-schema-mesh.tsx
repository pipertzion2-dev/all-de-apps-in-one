"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function ThreeSchemaMesh() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebGLAvailable(false);
      return;
    }
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 25;
    camera.position.y = 8;
    camera.position.x = 10;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const colors = [
      new THREE.Color(0x7ba3ac),
      new THREE.Color(0xd782b2),
      new THREE.Color(0x63b3a6),
      new THREE.Color(0x96a9ab),
      new THREE.Color(0xf3afc4),
    ];

    const disposables: {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    }[] = [];

    const cubes: THREE.Mesh[] = [];
    const cubeCount = 40;

    for (let i = 0; i < cubeCount; i++) {
      const size = 0.4 + Math.random() * 0.8;
      const geometry = new THREE.BoxGeometry(size, size * (1 + Math.random() * 2), size);
      const material = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.6,
        wireframe: Math.random() > 0.5,
      });
      disposables.push({ geometry, material });
      const cube = new THREE.Mesh(geometry, material);

      const gridX = (i % 8) - 4;
      const gridZ = Math.floor(i / 8) - 2.5;
      cube.position.set(gridX * 2 + (Math.random() - 0.5), 0, gridZ * 2 + (Math.random() - 0.5));
      cube.userData = {
        baseY: 0,
        targetHeight: 0.5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
      };
      scene.add(cube);
      cubes.push(cube);
    }

    const gridHelper = new THREE.GridHelper(20, 20, 0x7ba3ac, 0x333333);
    const gridMaterial = gridHelper.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.1;
    disposables.push({ material: gridMaterial });
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x7ba3ac,
      transparent: true,
      opacity: 0.2,
    });
    disposables.push({ material: lineMaterial });

    const lineCount = 30;
    for (let i = 0; i < lineCount; i++) {
      const startCube = cubes[Math.floor(Math.random() * cubes.length)];
      const endCube = cubes[Math.floor(Math.random() * cubes.length)];
      if (startCube !== endCube) {
        const points = [
          startCube.position.clone(),
          new THREE.Vector3(
            (startCube.position.x + endCube.position.x) / 2,
            3 + Math.random() * 2,
            (startCube.position.z + endCube.position.z) / 2,
          ),
          endCube.position.clone(),
        ];
        const curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
        disposables.push({ geometry: lineGeometry });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
      }
    }

    const particleCount = 150;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = Math.random() * 8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      particleVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
        ),
      );
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        uniform float uPixelRatio;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 2.5 * uPixelRatio * (20.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        void main() {
          float dist = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(0.48, 0.64, 0.67, alpha * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push({ geometry: particleGeometry, material: particleMaterial });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    let animationId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 },
    );
    observer.observe(container);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      cubes.forEach((cube) => {
        const { phase, speed, targetHeight } = cube.userData;
        const wave = Math.sin(elapsed * speed + phase) * 0.5 + 0.5;
        cube.position.y = wave * targetHeight;
        cube.rotation.y = elapsed * 0.2 + phase;
      });

      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += particleVelocities[i].x;
        positions[i * 3 + 1] += particleVelocities[i].y;
        positions[i * 3 + 2] += particleVelocities[i].z;

        if (Math.abs(positions[i * 3]) > 8) particleVelocities[i].x *= -1;
        if (positions[i * 3 + 1] > 8 || positions[i * 3 + 1] < 0) particleVelocities[i].y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 5) particleVelocities[i].z *= -1;
      }
      particleGeometry.attributes.position.needsUpdate = true;
      particleMaterial.uniforms.uTime.value = elapsed;

      camera.position.x = 10 + Math.sin(elapsed * 0.2) * 3;
      camera.position.z = 25 + Math.cos(elapsed * 0.15) * 3;
      camera.lookAt(0, 2, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      cancelAnimationFrame(animationId);

      disposables.forEach(({ geometry, material }) => {
        geometry?.dispose();
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material?.dispose();
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webGLAvailable) {
    return null;
  }

  return <div ref={containerRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />;
}
