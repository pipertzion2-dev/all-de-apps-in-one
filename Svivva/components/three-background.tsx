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

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebGLAvailable(false);
      return;
    }
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Flower-matched color palette
    const colors = [
      new THREE.Color(0x3f2a2c), // espresso brown
      new THREE.Color(0x7a4f3a), // copper
      new THREE.Color(0x6b3a67), // plum purple
      new THREE.Color(0x425884), // indigo blue
      new THREE.Color(0xd782b2), // orchid pink
      new THREE.Color(0xf3afc4), // blush pink
      new THREE.Color(0x63b3a6), // mint green
      new THREE.Color(0x96a9ab), // sage
    ];

    // Central breathing glow
    const glowGeometry = new THREE.CircleGeometry(12, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x96a9ab) },
        uColor2: { value: new THREE.Color(0xd782b2) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float alpha = smoothstep(0.5, 0.0, dist);
          float pulse = sin(uTime * 0.5) * 0.15 + 0.85;
          vec3 color = mix(uColor1, uColor2, sin(uTime * 0.3) * 0.5 + 0.5);
          gl_FragColor = vec4(color, alpha * 0.12 * pulse);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.z = -30;
    scene.add(glowMesh);

    // GPU Particle System with curl noise
    const particleCount = 12000;
    const positions = new Float32Array(particleCount * 3);
    const colorAttrib = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 15 + Math.random() * 55;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = (Math.random() - 0.5) * 70 - 15;

      const color = colors[Math.floor(Math.random() * colors.length)];
      colorAttrib[i3] = color.r;
      colorAttrib[i3 + 1] = color.g;
      colorAttrib[i3 + 2] = color.b;

      sizes[i] = 0.5 + Math.random() * 2.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("aColor", new THREE.BufferAttribute(colorAttrib, 3));
    particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uPixelRatio;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        // Simplex noise for organic motion
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vColor = aColor;
          
          vec3 pos = position;
          float t = uTime * 0.12;
          
          // Organic flow with noise
          float noiseX = snoise(pos * 0.02 + vec3(t, 0.0, 0.0));
          float noiseY = snoise(pos * 0.02 + vec3(0.0, t, 0.0));
          float noiseZ = snoise(pos * 0.02 + vec3(0.0, 0.0, t));
          
          pos.x += noiseX * 4.0 * sin(t + aPhase);
          pos.y += noiseY * 4.0 * cos(t + aPhase * 0.7);
          pos.z += noiseZ * 2.0;
          
          // Gentle spiral
          float angle = atan(pos.y, pos.x) + t * 0.08;
          float radius = length(pos.xy);
          pos.x = cos(angle) * radius;
          pos.y = sin(angle) * radius;
          
          // Mouse interaction
          vec2 mouseOffset = uMouse * 40.0;
          float mouseDist = length(pos.xy - mouseOffset);
          float mouseInfluence = smoothstep(25.0, 0.0, mouseDist);
          vec2 mouseDir = normalize(pos.xy - mouseOffset + 0.001);
          pos.xy += mouseDir * mouseInfluence * 6.0;
          
          // Breathing
          float breathe = sin(t * 0.6 + aPhase) * 0.15 + 1.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          float sizeScale = aSize * breathe * (1.0 + mouseInfluence * 0.4);
          gl_PointSize = sizeScale * uPixelRatio * (280.0 / -mvPosition.z);
          
          float depthFade = smoothstep(-70.0, -8.0, mvPosition.z);
          float centerDist = length(pos.xy) / 55.0;
          vAlpha = depthFade * (0.7 - centerDist * 0.35) * (0.85 + sin(t + aPhase) * 0.15);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          
          float core = smoothstep(0.5, 0.1, dist);
          float glow = smoothstep(0.5, 0.0, dist) * 0.4;
          
          float alpha = (core + glow) * vAlpha;
          vec3 finalColor = vColor + vec3(0.08) * (1.0 - dist);
          
          gl_FragColor = vec4(finalColor, alpha * 0.65);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Flowing ribbons
    const ribbonMeshes: THREE.Mesh[] = [];
    for (let r = 0; r < 6; r++) {
      const points: THREE.Vector3[] = [];
      const segments = 60;
      const baseRadius = 20 + r * 7;
      const phase = (r / 6) * Math.PI * 2;

      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            Math.cos(t + phase) * baseRadius + Math.sin(t * 3) * 3,
            Math.sin(t + phase) * baseRadius * 0.5 + Math.cos(t * 2) * 4,
            Math.sin(t * 2 + phase) * 8 - 18,
          ),
        );
      }

      const curve = new THREE.CatmullRomCurve3(points, true);
      const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.15 + r * 0.04, 6, true);

      const ribbonMaterial = new THREE.MeshBasicMaterial({
        color: colors[r % colors.length],
        transparent: true,
        opacity: 0.06 + r * 0.008,
        blending: THREE.AdditiveBlending,
      });

      const ribbon = new THREE.Mesh(tubeGeometry, ribbonMaterial);
      ribbon.userData = { phase, speed: 0.08 + r * 0.015 };
      scene.add(ribbon);
      ribbonMeshes.push(ribbon);
    }

    // Bokeh lights
    const bokehCount = 35;
    const bokehPositions = new Float32Array(bokehCount * 3);
    const bokehSizes = new Float32Array(bokehCount);
    const bokehColors = new Float32Array(bokehCount * 3);

    for (let i = 0; i < bokehCount; i++) {
      bokehPositions[i * 3] = (Math.random() - 0.5) * 100;
      bokehPositions[i * 3 + 1] = (Math.random() - 0.5) * 70;
      bokehPositions[i * 3 + 2] = -35 - Math.random() * 25;
      bokehSizes[i] = 4 + Math.random() * 12;
      const color = colors[Math.floor(Math.random() * colors.length)];
      bokehColors[i * 3] = color.r;
      bokehColors[i * 3 + 1] = color.g;
      bokehColors[i * 3 + 2] = color.b;
    }

    const bokehGeometry = new THREE.BufferGeometry();
    bokehGeometry.setAttribute("position", new THREE.BufferAttribute(bokehPositions, 3));
    bokehGeometry.setAttribute("aSize", new THREE.BufferAttribute(bokehSizes, 1));
    bokehGeometry.setAttribute("aColor", new THREE.BufferAttribute(bokehColors, 3));

    const bokehMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = aColor;
          
          vec3 pos = position;
          pos.y += sin(uTime * 0.18 + position.x * 0.04) * 2.5;
          pos.x += cos(uTime * 0.12 + position.y * 0.03) * 1.8;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          float pulse = sin(uTime * 0.25 + position.x + position.y) * 0.25 + 1.0;
          gl_PointSize = aSize * pulse * uPixelRatio * (180.0 / -mvPosition.z);
          
          vAlpha = smoothstep(-65.0, -35.0, mvPosition.z) * 0.35;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          
          float ring = smoothstep(0.5, 0.38, dist) * smoothstep(0.0, 0.32, dist);
          float fill = smoothstep(0.5, 0.0, dist) * 0.25;
          
          float alpha = (ring + fill) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const bokeh = new THREE.Points(bokehGeometry, bokehMaterial);
    scene.add(bokeh);

    // Mouse tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Update uniforms
      glowMaterial.uniforms.uTime.value = elapsed;
      particleMaterial.uniforms.uTime.value = elapsed;
      particleMaterial.uniforms.uMouse.value.set(mouseX, mouseY);
      bokehMaterial.uniforms.uTime.value = elapsed;

      // Rotate ribbons
      ribbonMeshes.forEach((ribbon) => {
        ribbon.rotation.z += ribbon.userData.speed * 0.01;
        ribbon.rotation.x = Math.sin(elapsed * 0.1 + ribbon.userData.phase) * 0.03;
      });

      // Subtle camera sway
      camera.position.x = mouseX * 2.5;
      camera.position.y = mouseY * 1.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize
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
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  if (!webGLAvailable) {
    return null;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 -z-10" style={{ pointerEvents: "none" }} />
  );
}
