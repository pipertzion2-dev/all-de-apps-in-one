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

export function ThreeAPITraffic() {
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
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const colors = {
      primary: new THREE.Color(0x7ba3ac),
      secondary: new THREE.Color(0xd782b2),
      tertiary: new THREE.Color(0x63b3a6),
    };

    const disposables: {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    }[] = [];

    const torusGeometry = new THREE.TorusGeometry(8, 0.1, 16, 100);
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.3,
    });
    disposables.push({ geometry: torusGeometry, material: torusMaterial });

    const torusMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const material = torusMaterial.clone();
      disposables.push({ material });
      const torus = new THREE.Mesh(torusGeometry, material);
      torus.rotation.x = Math.PI / 2 + (i * Math.PI) / 6;
      torus.userData = { rotationSpeed: 0.2 + i * 0.1 };
      scene.add(torus);
      torusMeshes.push(torus);
    }

    const centerGeometry = new THREE.OctahedronGeometry(2, 0);
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });
    disposables.push({ geometry: centerGeometry, material: centerMaterial });
    const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
    scene.add(centerMesh);

    const innerGeometry = new THREE.OctahedronGeometry(1.2, 0);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      transparent: true,
      opacity: 0.4,
    });
    disposables.push({ geometry: innerGeometry, material: innerMaterial });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerMesh);

    const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: colors.primary },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = sin(uTime * 2.0) * 0.15 + 0.85;
          gl_FragColor = vec4(uColor, intensity * 0.4 * pulse);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    disposables.push({ geometry: glowGeometry, material: glowMaterial });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    const orbitParticleCount = 300;
    const orbitPositions = new Float32Array(orbitParticleCount * 3);
    const orbitColors = new Float32Array(orbitParticleCount * 3);
    const orbitPhases = new Float32Array(orbitParticleCount);
    const orbitRadii = new Float32Array(orbitParticleCount);
    const orbitSpeeds = new Float32Array(orbitParticleCount);

    const colorArray = [colors.primary, colors.secondary, colors.tertiary];

    for (let i = 0; i < orbitParticleCount; i++) {
      orbitPhases[i] = Math.random() * Math.PI * 2;
      orbitRadii[i] = 5 + Math.random() * 6;
      orbitSpeeds[i] = 0.3 + Math.random() * 0.7;

      const color = colorArray[i % 3];
      orbitColors[i * 3] = color.r;
      orbitColors[i * 3 + 1] = color.g;
      orbitColors[i * 3 + 2] = color.b;
    }

    const orbitGeometry = new THREE.BufferGeometry();
    orbitGeometry.setAttribute("position", new THREE.BufferAttribute(orbitPositions, 3));
    orbitGeometry.setAttribute("aColor", new THREE.BufferAttribute(orbitColors, 3));

    const orbitMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute vec3 aColor;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = aColor;
          float dist = length(position);
          vAlpha = 1.0 - (dist / 12.0);
          
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
          gl_FragColor = vec4(vColor, alpha * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push({ geometry: orbitGeometry, material: orbitMaterial });

    const orbitParticles = new THREE.Points(orbitGeometry, orbitMaterial);
    scene.add(orbitParticles);

    const trailCount = 50;
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailCount * 3);
    const trailColors = new Float32Array(trailCount * 3);

    for (let i = 0; i < trailCount; i++) {
      const color = colorArray[i % 3];
      trailColors[i * 3] = color.r;
      trailColors[i * 3 + 1] = color.g;
      trailColors[i * 3 + 2] = color.b;
    }

    trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));

    const trailMaterial = new THREE.PointsMaterial({
      size: 4,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push({ geometry: trailGeometry, material: trailMaterial });

    const trails = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(trails);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    container.addEventListener("mousemove", handleMouseMove);

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

      torusMeshes.forEach((torus) => {
        torus.rotation.z += torus.userData.rotationSpeed * 0.01;
      });

      centerMesh.rotation.y = elapsed * 0.5;
      centerMesh.rotation.x = Math.sin(elapsed * 0.3) * 0.2;
      innerMesh.rotation.y = -elapsed * 0.7;
      innerMesh.rotation.z = elapsed * 0.3;

      glowMaterial.uniforms.uTime.value = elapsed;

      const orbitPos = orbitGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < orbitParticleCount; i++) {
        const phase = orbitPhases[i];
        const radius = orbitRadii[i];
        const speed = orbitSpeeds[i];

        const theta = elapsed * speed + phase;
        const phi = elapsed * speed * 0.5 + phase * 2;

        orbitPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        orbitPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        orbitPos[i * 3 + 2] = radius * Math.cos(phi);
      }
      orbitGeometry.attributes.position.needsUpdate = true;
      orbitMaterial.uniforms.uTime.value = elapsed;

      const trailPos = trailGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < trailCount; i++) {
        const angle = elapsed * 2 + (i / trailCount) * Math.PI * 2;
        const radius = 10 + Math.sin(elapsed + i) * 2;
        trailPos[i * 3] = Math.cos(angle) * radius;
        trailPos[i * 3 + 1] = Math.sin(angle * 2) * 3;
        trailPos[i * 3 + 2] = Math.sin(angle) * radius;
      }
      trailGeometry.attributes.position.needsUpdate = true;

      camera.position.x = mouseX * 5;
      camera.position.y = mouseY * 3;
      camera.lookAt(0, 0, 0);

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
      container.removeEventListener("mousemove", handleMouseMove);
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
