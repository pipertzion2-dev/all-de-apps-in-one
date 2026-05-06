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

export function ThreeDataFlow() {
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
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 5;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const colors = {
      prompt: new THREE.Color(0x7BA3AC),
      schema: new THREE.Color(0xD782B2),
      api: new THREE.Color(0x63B3A6),
      particle: new THREE.Color(0x96A9AB),
    };

    const disposables: { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }[] = [];

    const nodes: THREE.Mesh[] = [];
    const nodePositions = [
      new THREE.Vector3(-15, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(15, 0, 0),
    ];
    const nodeColors = [colors.prompt, colors.schema, colors.api];

    nodePositions.forEach((pos, i) => {
      const geometry = new THREE.IcosahedronGeometry(2.5, 2);
      const material = new THREE.MeshBasicMaterial({
        color: nodeColors[i],
        transparent: true,
        opacity: 0.7,
        wireframe: true,
      });
      disposables.push({ geometry, material });
      const node = new THREE.Mesh(geometry, material);
      node.position.copy(pos);
      node.userData = { baseY: pos.y, phase: i * 0.5 };
      scene.add(node);
      nodes.push(node);

      const innerGeometry = new THREE.IcosahedronGeometry(1.8, 1);
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: nodeColors[i],
        transparent: true,
        opacity: 0.3,
      });
      disposables.push({ geometry: innerGeometry, material: innerMaterial });
      const innerNode = new THREE.Mesh(innerGeometry, innerMaterial);
      innerNode.position.copy(pos);
      scene.add(innerNode);
      nodes.push(innerNode);

      const glowGeometry = new THREE.SphereGeometry(3.5, 32, 32);
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: nodeColors[i] },
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
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            float pulse = sin(uTime * 2.0) * 0.2 + 0.8;
            gl_FragColor = vec4(uColor, intensity * 0.4 * pulse);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      disposables.push({ geometry: glowGeometry, material: glowMaterial });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(pos);
      glow.userData = { material: glowMaterial };
      scene.add(glow);
      nodes.push(glow);
    });

    const createConnectionCurve = (start: THREE.Vector3, end: THREE.Vector3) => {
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.y += 5;
      return new THREE.QuadraticBezierCurve3(start, mid, end);
    };

    const connections = [
      createConnectionCurve(nodePositions[0], nodePositions[1]),
      createConnectionCurve(nodePositions[1], nodePositions[2]),
    ];

    connections.forEach((curve) => {
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: colors.particle,
        transparent: true,
        opacity: 0.3,
      });
      disposables.push({ geometry, material });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
    });

    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleProgress = new Float32Array(particleCount);
    const particleSpeeds = new Float32Array(particleCount);
    const particleConnections = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particleProgress[i] = Math.random();
      particleSpeeds[i] = 0.002 + Math.random() * 0.003;
      particleConnections[i] = Math.floor(Math.random() * connections.length);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

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
          gl_PointSize = 4.0 * uPixelRatio * (20.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        void main() {
          float dist = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.1, dist);
          gl_FragColor = vec4(0.48, 0.64, 0.67, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push({ geometry: particleGeometry, material: particleMaterial });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const orbitParticleCount = 200;
    const orbitPositions = new Float32Array(orbitParticleCount * 3);
    const orbitColors = new Float32Array(orbitParticleCount * 3);
    const orbitPhases = new Float32Array(orbitParticleCount);

    for (let i = 0; i < orbitParticleCount; i++) {
      orbitPhases[i] = Math.random() * Math.PI * 2;
      const color = nodeColors[Math.floor(Math.random() * nodeColors.length)];
      orbitColors[i * 3] = color.r;
      orbitColors[i * 3 + 1] = color.g;
      orbitColors[i * 3 + 2] = color.b;
    }

    const orbitGeometry = new THREE.BufferGeometry();
    orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    orbitGeometry.setAttribute('aColor', new THREE.BufferAttribute(orbitColors, 3));
    orbitGeometry.setAttribute('aPhase', new THREE.BufferAttribute(orbitPhases, 1));

    const orbitMaterial = new THREE.ShaderMaterial({
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
          float t = uTime * 0.5 + aPhase;
          float alpha = sin(t * 2.0) * 0.3 + 0.7;
          vAlpha = alpha;
          
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
    disposables.push({ geometry: orbitGeometry, material: orbitMaterial });

    const orbitParticles = new THREE.Points(orbitGeometry, orbitMaterial);
    scene.add(orbitParticles);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    container.addEventListener('mousemove', handleMouseMove);

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

      nodes.forEach((node) => {
        if (node.userData.material) {
          node.userData.material.uniforms.uTime.value = elapsed;
        }
        if (node.userData.baseY !== undefined) {
          node.position.y = node.userData.baseY + Math.sin(elapsed + node.userData.phase) * 0.5;
          node.rotation.y = elapsed * 0.3;
          node.rotation.x = Math.sin(elapsed * 0.5) * 0.1;
        }
      });

      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        particleProgress[i] += particleSpeeds[i];
        if (particleProgress[i] > 1) particleProgress[i] = 0;

        const conn = connections[Math.floor(particleConnections[i])];
        const point = conn.getPoint(particleProgress[i]);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y + Math.sin(elapsed * 3 + i) * 0.3;
        positions[i * 3 + 2] = point.z;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      const orbitPos = orbitGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < orbitParticleCount; i++) {
        const nodeIdx = i % 3;
        const basePos = nodePositions[nodeIdx];
        const phase = orbitPhases[i];
        const radius = 4 + (i % 5) * 0.5;
        const speed = 0.5 + (i % 3) * 0.2;
        
        orbitPos[i * 3] = basePos.x + Math.cos(elapsed * speed + phase) * radius;
        orbitPos[i * 3 + 1] = basePos.y + Math.sin(elapsed * speed * 1.5 + phase) * radius * 0.5;
        orbitPos[i * 3 + 2] = basePos.z + Math.sin(elapsed * speed + phase) * radius * 0.3;
      }
      orbitGeometry.attributes.position.needsUpdate = true;
      orbitMaterial.uniforms.uTime.value = elapsed;
      particleMaterial.uniforms.uTime.value = elapsed;

      camera.position.x = mouseX * 3;
      camera.position.y = 5 + mouseY * 2;
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
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
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
      className="absolute inset-0 pointer-events-none"
    />
  );
}
