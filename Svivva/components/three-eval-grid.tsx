"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export function ThreeEvalGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebGLAvailable(false);
      return;
    }
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const passColor = new THREE.Color(0x63B3A6);
    const failColor = new THREE.Color(0xE57373);
    const pendingColor = new THREE.Color(0x96A9AB);

    const disposables: { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }[] = [];

    const gridSize = 8;
    const cubes: THREE.Mesh[] = [];

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const state = Math.random();
        let color = pendingColor;
        if (state > 0.7) color = passColor;
        else if (state > 0.5) color = failColor;

        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.7,
        });
        disposables.push({ geometry, material });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
          (x - gridSize / 2 + 0.5) * 1.2,
          0,
          (z - gridSize / 2 + 0.5) * 1.2
        );
        cube.userData = {
          state: state,
          targetY: 0,
          currentY: 0,
          delay: (x + z) * 0.1,
          activated: false,
        };
        scene.add(cube);
        cubes.push(cube);
      }
    }

    const edgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(gridSize * 1.2, 0.1, gridSize * 1.2));
    const edgesMaterial = new THREE.LineBasicMaterial({ 
      color: 0x7BA3AC, 
      transparent: true, 
      opacity: 0.3 
    });
    disposables.push({ geometry: edgesGeometry, material: edgesMaterial });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.position.y = -0.5;
    scene.add(edges);

    const particleCount = 100;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particlePhases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 4;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = Math.random() * 5;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particlePhases[i] = Math.random() * Math.PI * 2;

      const color = Math.random() > 0.3 ? passColor : failColor;
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('aColor', new THREE.BufferAttribute(particleColors, 3));
    particleGeometry.setAttribute('aPhase', new THREE.BufferAttribute(particlePhases, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = aColor;
          vAlpha = sin(uTime + aPhase) * 0.3 + 0.7;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 3.0 * uPixelRatio * (15.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(vColor, alpha * 0.6);
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

    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0.1 });
    observer.observe(container);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isVisible) return;
      
      const elapsed = clock.getElapsedTime();

      cubes.forEach((cube, index) => {
        const { delay, state } = cube.userData;

        if (elapsed > delay && !cube.userData.activated) {
          cube.userData.activated = true;
          cube.userData.targetY = state > 0.7 ? 2 : (state > 0.5 ? 1 : 0.5);
        }

        if (cube.userData.activated) {
          cube.userData.currentY += (cube.userData.targetY - cube.userData.currentY) * 0.05;
          cube.position.y = cube.userData.currentY;

          const wave = Math.sin(elapsed * 2 + delay) * 0.1;
          cube.position.y += wave;

          cube.rotation.y = Math.sin(elapsed + delay) * 0.1;
        }

        const pulseScale = 1 + Math.sin(elapsed * 3 + index * 0.2) * 0.05;
        cube.scale.set(pulseScale, pulseScale, pulseScale);
      });

      const positions = particleGeometry.attributes.position.array as Float32Array;
      const phases = particleGeometry.attributes.aPhase.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const angle = elapsed * 0.3 + phases[i];
        const radius = 6 + Math.sin(elapsed + phases[i]) * 2;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(elapsed * 0.5 + phases[i]) * 2 + 2;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      particleGeometry.attributes.position.needsUpdate = true;
      particleMaterial.uniforms.uTime.value = elapsed;

      camera.position.x = 15 + Math.sin(elapsed * 0.2) * 3;
      camera.position.z = 15 + Math.cos(elapsed * 0.2) * 3;
      camera.lookAt(0, 1, 0);

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
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      cancelAnimationFrame(animationId);
      
      disposables.forEach(({ geometry, material }) => {
        geometry?.dispose();
        if (Array.isArray(material)) {
          material.forEach(m => m.dispose());
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

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}
