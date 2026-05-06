"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

interface HeroBloomAnimationProps {
  onComplete: () => void;
}

const VIVVA_COLORS = {
  teal: new THREE.Color(0x5BA8A0),
  tealLight: new THREE.Color(0x8FCFC7),
  burgundy: new THREE.Color(0x6B2C4A),
  burgundyLight: new THREE.Color(0x8B4C6A),
  dustyPink: new THREE.Color(0xD4A5A5),
  mint: new THREE.Color(0x98D4BB),
  lavender: new THREE.Color(0xB8A9C9),
  accent: new THREE.Color(0x7BA3AC),
  cream: new THREE.Color(0xF5E6D3),
};

const CRT_FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    float aberration = 0.0008;
    vec4 colorR = texture2D(tDiffuse, uv + vec2(aberration, 0.0));
    vec4 colorG = texture2D(tDiffuse, uv);
    vec4 colorB = texture2D(tDiffuse, uv - vec2(aberration, 0.0));
    vec4 color = vec4(colorR.r, colorG.g, colorB.b, 1.0);
    
    float scanline = sin(uv.y * uResolution.y * 0.6) * 0.5 + 0.5;
    scanline = pow(scanline, 1.3) * 0.03;
    color.rgb -= scanline;
    
    vec2 vignetteUv = uv * (1.0 - uv.yx);
    float vignette = vignetteUv.x * vignetteUv.y * 15.0;
    vignette = pow(vignette, 0.15);
    color.rgb *= mix(1.0, vignette, 0.15);
    
    gl_FragColor = color;
  }
`;

const CRT_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const REALISTIC_MIRROR_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const REALISTIC_MIRROR_FRAGMENT = `
  uniform float uTime;
  uniform vec3 uColorTeal;
  uniform vec3 uColorBurgundy;
  uniform vec3 uColorMint;
  
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 reflectDir = reflect(-viewDir, vNormal);
    
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 4.0);
    
    float envY = reflectDir.y * 0.5 + 0.5;
    vec3 envColor = mix(vec3(0.15, 0.15, 0.18), vec3(0.5, 0.5, 0.55), envY);
    envColor = mix(envColor, vec3(0.9, 0.92, 0.95), smoothstep(0.7, 0.95, envY));
    
    float tealInfluence = sin(vWorldPosition.y * 2.0 + uTime * 0.2) * 0.5 + 0.5;
    float burgundyInfluence = cos(vWorldPosition.x * 3.0 + uTime * 0.15) * 0.5 + 0.5;
    
    vec3 tint = mix(uColorTeal, uColorMint, tealInfluence) * 0.08;
    tint += uColorBurgundy * burgundyInfluence * 0.04;
    
    vec3 baseChrome = vec3(0.88, 0.89, 0.91);
    
    float specular1 = pow(max(0.0, dot(reflectDir, normalize(vec3(1.0, 1.0, 0.5)))), 120.0);
    float specular2 = pow(max(0.0, dot(reflectDir, normalize(vec3(-0.5, 0.8, 0.3)))), 80.0);
    float specular3 = pow(max(0.0, dot(reflectDir, normalize(vec3(0.0, 1.0, -0.5)))), 150.0);
    
    vec3 color = baseChrome * 0.5;
    color += envColor * 0.35;
    color += tint;
    color += specular1 * vec3(1.0) * 0.8;
    color += specular2 * vec3(0.95, 0.97, 1.0) * 0.5;
    color += specular3 * vec3(1.0) * 0.6;
    
    color += fresnel * 0.25 * vec3(0.95, 0.97, 1.0);
    
    float gradient = smoothstep(-0.3, 1.0, vWorldPosition.y);
    color *= 0.9 + gradient * 0.12;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const CAMO_WATER_VERTEX = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vec3 pos = position;
    
    float wave1 = sin(uTime * 1.5 + position.x * 3.0) * 0.015;
    float wave2 = cos(uTime * 1.2 + position.z * 2.5) * 0.012;
    float ripple = sin(length(position.xz) * 4.0 - uTime * 2.0) * 0.008;
    pos.y += wave1 + wave2 + ripple;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const CAMO_WATER_FRAGMENT = `
  uniform float uTime;
  uniform vec3 uColorTeal;
  uniform vec3 uColorTealLight;
  uniform vec3 uColorMint;
  uniform vec3 uColorBurgundy;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    float pattern1 = sin(vPosition.x * 10.0 + uTime * 1.2) * sin(vPosition.z * 8.0 + uTime * 0.9);
    float pattern2 = cos(vPosition.x * 5.0 - vPosition.z * 7.0 + uTime * 0.6);
    float pattern3 = sin((vPosition.x + vPosition.z) * 4.0 + uTime * 0.8);
    
    vec3 color = mix(uColorTeal, uColorTealLight, pattern1 * 0.5 + 0.5);
    color = mix(color, uColorMint, smoothstep(0.3, 0.7, pattern2 * 0.5 + 0.5) * 0.4);
    color = mix(color, uColorBurgundy, smoothstep(0.5, 0.8, pattern3 * 0.5 + 0.5) * 0.25);
    
    float shimmer = sin(vPosition.x * 25.0 + uTime * 3.0) * sin(vPosition.z * 20.0 + uTime * 2.5);
    shimmer = pow(shimmer * 0.5 + 0.5, 4.0) * 0.1;
    color += shimmer * uColorMint;
    
    float dist = length(vPosition.xz);
    float edgeFade = 1.0 - smoothstep(1.2, 2.0, dist);
    
    float noise = fract(sin(dot(vPosition.xz, vec2(12.9898, 78.233))) * 43758.5453);
    float irregularEdge = smoothstep(0.3, 0.7, noise);
    edgeFade *= mix(0.7, 1.0, irregularEdge);
    
    gl_FragColor = vec4(color, uOpacity * edgeFade);
  }
`;

const SUBTLE_SPARKLE_VERTEX = `
  attribute float size;
  attribute vec3 sparkleColor;
  attribute float delay;
  uniform float uTime;
  uniform float uWaterStart;
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vColor = sparkleColor;
    
    float activeTime = uTime - uWaterStart - delay;
    float fadeIn = smoothstep(0.0, 0.3, activeTime);
    float fadeOut = 1.0 - smoothstep(1.5, 2.0, activeTime);
    float visibility = fadeIn * fadeOut * step(0.0, activeTime);
    
    vec3 pos = position;
    pos.y += sin(uTime * 2.0 + position.x * 3.0) * 0.02;
    
    float twinkle = sin(uTime * 5.0 + position.x * 10.0 + position.z * 8.0) * 0.5 + 0.5;
    twinkle = pow(twinkle, 1.5);
    vAlpha = twinkle * 0.7 * visibility;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (120.0 / -mvPosition.z) * twinkle * visibility;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SUBTLE_SPARKLE_FRAGMENT = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    
    float cross1 = smoothstep(0.05, 0.0, abs(uv.x)) * smoothstep(0.45, 0.0, abs(uv.y));
    float cross2 = smoothstep(0.05, 0.0, abs(uv.y)) * smoothstep(0.45, 0.0, abs(uv.x));
    float star = max(cross1, cross2);
    
    float glow = exp(-dist * 6.0) * 0.3;
    star = max(star, glow);
    
    float alpha = star * vAlpha;
    
    if (alpha < 0.01) discard;
    
    vec3 finalColor = vColor + vec3(0.2) * (1.0 - dist * 1.8);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const SEED_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SEED_FRAGMENT = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlow;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vec3 color = uColor;
    
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    
    float shimmer = sin(uTime * 4.0 + vPosition.x * 12.0) * 
                    sin(uTime * 5.0 + vPosition.y * 10.0);
    shimmer = shimmer * 0.5 + 0.5;
    shimmer = pow(shimmer, 3.0);
    
    color += fresnel * 0.3 * vec3(1.0);
    color += shimmer * uGlow * vec3(1.0, 0.98, 0.92) * 0.2;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function HeroBloomAnimation({ onComplete }: HeroBloomAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    pitcher: THREE.Group;
    waterDrops: THREE.Mesh[];
    waterSurface: THREE.Mesh;
    seeds: THREE.Mesh[];
    flowers: THREE.Group[];
    sparkles: THREE.Points;
    animationId: number;
    startTime: number;
    crtPass: ShaderPass;
    waterMaterial: THREE.ShaderMaterial;
    sparkleMaterial: THREE.ShaderMaterial;
  } | null>(null);
  const [phase, setPhase] = useState<string>('watering');
  const completedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 6);
    camera.lookAt(0, -0.3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const crtPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
      },
      vertexShader: CRT_VERTEX_SHADER,
      fragmentShader: CRT_FRAGMENT_SHADER,
    });
    composer.addPass(crtPass);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(3, 5, 4);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 0.35, 10);
    pointLight1.position.set(-2, 3, 3);
    scene.add(pointLight1);

    const groundGeo = new THREE.PlaneGeometry(12, 6);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.0;
    scene.add(ground);

    const waterShape = new THREE.Shape();
    waterShape.moveTo(0, 0);
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const radius = 1.8 + Math.sin(angle * 3) * 0.3 + Math.cos(angle * 5) * 0.15;
      waterShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    const waterGeo = new THREE.ShapeGeometry(waterShape, 32);
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorTeal: { value: VIVVA_COLORS.teal },
        uColorTealLight: { value: VIVVA_COLORS.tealLight },
        uColorMint: { value: VIVVA_COLORS.mint },
        uColorBurgundy: { value: VIVVA_COLORS.burgundy },
        uOpacity: { value: 0 },
      },
      vertexShader: CAMO_WATER_VERTEX,
      fragmentShader: CAMO_WATER_FRAGMENT,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const waterSurface = new THREE.Mesh(waterGeo, waterMaterial);
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.y = -0.99;
    scene.add(waterSurface);

    const pitcher = createRealisticPitcher();
    pitcher.position.set(2.0, 2.0, 0.15);
    pitcher.rotation.z = -0.08;
    scene.add(pitcher);

    const waterDrops: THREE.Mesh[] = [];
    const dropMat = new THREE.MeshStandardMaterial({
      color: VIVVA_COLORS.teal.getHex(),
      transparent: true,
      opacity: 0.75,
      metalness: 0.1,
      roughness: 0.2,
    });
    
    for (let i = 0; i < 25; i++) {
      const dropGeo = new THREE.SphereGeometry(0.035 + Math.random() * 0.02, 8, 8);
      dropGeo.scale(1, 1.5, 1);
      const drop = new THREE.Mesh(dropGeo, dropMat);
      drop.visible = false;
      drop.userData = {
        delay: i * 0.045,
        offsetX: (Math.random() - 0.5) * 0.25,
        offsetZ: (Math.random() - 0.5) * 0.15,
      };
      scene.add(drop);
      waterDrops.push(drop);
    }

    const seeds: THREE.Mesh[] = [];
    const seedColors = [VIVVA_COLORS.burgundy, VIVVA_COLORS.teal, VIVVA_COLORS.dustyPink, VIVVA_COLORS.lavender, VIVVA_COLORS.mint, VIVVA_COLORS.tealLight];
    const seedPositions = [
      [-1.2, -0.95, 0.15], [-0.55, -0.95, 0.35], [0.1, -0.95, 0.25], [0.65, -0.95, 0.35], [1.2, -0.95, 0.15],
      [-0.85, -0.95, -0.1], [0.35, -0.95, -0.05], [0.9, -0.95, -0.12]
    ];
    
    seedPositions.forEach((pos, i) => {
      const seedGeo = new THREE.SphereGeometry(0.08, 10, 10);
      seedGeo.scale(1.1, 0.5, 0.7);
      const seedMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: seedColors[i % seedColors.length] },
          uGlow: { value: 1.0 },
        },
        vertexShader: SEED_VERTEX,
        fragmentShader: SEED_FRAGMENT,
      });
      const seed = new THREE.Mesh(seedGeo, seedMat);
      seed.position.set(pos[0], pos[1], pos[2]);
      seed.rotation.x = Math.random() * 0.2;
      seed.rotation.z = Math.random() * 0.2;
      seed.userData = { material: seedMat, index: i };
      scene.add(seed);
      seeds.push(seed);
    });

    const sparkleCount = 25;
    const sparklePositions = new Float32Array(sparkleCount * 3);
    const sparkleSizes = new Float32Array(sparkleCount);
    const sparkleColors = new Float32Array(sparkleCount * 3);
    const sparkleDelays = new Float32Array(sparkleCount);
    
    const colorOptions = [VIVVA_COLORS.cream, VIVVA_COLORS.tealLight, VIVVA_COLORS.mint];
    
    for (let i = 0; i < sparkleCount; i++) {
      const seedIdx = Math.floor(Math.random() * seedPositions.length);
      const seedPos = seedPositions[seedIdx];
      sparklePositions[i * 3] = seedPos[0] + (Math.random() - 0.5) * 0.3;
      sparklePositions[i * 3 + 1] = seedPos[1] + Math.random() * 0.25 + 0.02;
      sparklePositions[i * 3 + 2] = seedPos[2] + (Math.random() - 0.5) * 0.3;
      sparkleSizes[i] = Math.random() * 2.5 + 1.5;
      sparkleDelays[i] = Math.random() * 0.8;
      
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      sparkleColors[i * 3] = color.r;
      sparkleColors[i * 3 + 1] = color.g;
      sparkleColors[i * 3 + 2] = color.b;
    }
    
    const sparkleGeo = new THREE.BufferGeometry();
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    sparkleGeo.setAttribute('size', new THREE.BufferAttribute(sparkleSizes, 1));
    sparkleGeo.setAttribute('sparkleColor', new THREE.BufferAttribute(sparkleColors, 3));
    sparkleGeo.setAttribute('delay', new THREE.BufferAttribute(sparkleDelays, 1));
    
    const sparkleMaterial = new THREE.ShaderMaterial({
      uniforms: { 
        uTime: { value: 0 },
        uWaterStart: { value: 1.0 },
      },
      vertexShader: SUBTLE_SPARKLE_VERTEX,
      fragmentShader: SUBTLE_SPARKLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparkles = new THREE.Points(sparkleGeo, sparkleMaterial);
    scene.add(sparkles);

    const flowers: THREE.Group[] = [];
    const flowerConfigs = [
      { colors: [VIVVA_COLORS.burgundy, VIVVA_COLORS.tealLight, VIVVA_COLORS.dustyPink], petals: 5 },
      { colors: [VIVVA_COLORS.teal, VIVVA_COLORS.mint, VIVVA_COLORS.lavender], petals: 6 },
      { colors: [VIVVA_COLORS.lavender, VIVVA_COLORS.burgundyLight, VIVVA_COLORS.cream], petals: 5 },
      { colors: [VIVVA_COLORS.dustyPink, VIVVA_COLORS.teal, VIVVA_COLORS.mint], petals: 7 },
      { colors: [VIVVA_COLORS.mint, VIVVA_COLORS.lavender, VIVVA_COLORS.tealLight], petals: 6 },
      { colors: [VIVVA_COLORS.burgundyLight, VIVVA_COLORS.dustyPink, VIVVA_COLORS.cream], petals: 8 },
      { colors: [VIVVA_COLORS.tealLight, VIVVA_COLORS.burgundy, VIVVA_COLORS.lavender], petals: 5 },
      { colors: [VIVVA_COLORS.cream, VIVVA_COLORS.mint, VIVVA_COLORS.dustyPink], petals: 6 },
    ];
    
    seedPositions.forEach((pos, i) => {
      const flower = createFlower(flowerConfigs[i % flowerConfigs.length]);
      flower.position.set(pos[0], pos[1], pos[2]);
      flower.scale.setScalar(0);
      flower.userData = { index: i };
      scene.add(flower);
      flowers.push(flower);
    });

    const startTime = Date.now();
    
    sceneRef.current = {
      scene, camera, renderer, composer, pitcher,
      waterDrops, waterSurface, waterMaterial, seeds, flowers, sparkles, sparkleMaterial, crtPass,
      animationId: 0, startTime
    };

    const animate = () => {
      const s = sceneRef.current;
      if (!s) return;
      
      s.animationId = requestAnimationFrame(animate);
      const elapsed = (Date.now() - s.startTime) / 1000;
      
      s.crtPass.uniforms.uTime.value = elapsed;
      s.waterMaterial.uniforms.uTime.value = elapsed;
      s.sparkleMaterial.uniforms.uTime.value = elapsed;

      const pitcherStartY = 2.0;
      const pitcherEndY = 0.9;
      const pitcherMoveTime = 0.8;
      
      if (elapsed < pitcherMoveTime) {
        const t = elapsed / pitcherMoveTime;
        const eased = 1 - Math.pow(1 - t, 3);
        s.pitcher.position.y = pitcherStartY - (pitcherStartY - pitcherEndY) * eased;
        s.pitcher.position.x = 2.0 - eased * 0.7;
      } else if (elapsed < 2.5) {
        const tiltTime = Math.min((elapsed - pitcherMoveTime) / 0.3, 1);
        s.pitcher.rotation.z = -0.08 - tiltTime * 0.5;
        s.pitcher.position.y = pitcherEndY;
        s.pitcher.position.x = 1.3;
      }

      const waterStart = 0.95;
      const waterEnd = 2.6;
      if (elapsed > waterStart && elapsed < waterEnd) {
        const waterElapsed = elapsed - waterStart;
        s.waterDrops.forEach((drop) => {
          const delay = drop.userData.delay;
          if (waterElapsed > delay) {
            drop.visible = true;
            const cycleTime = 0.45;
            const progress = ((waterElapsed - delay) % cycleTime) / cycleTime;
            
            const spoutX = 0.5;
            const spoutY = 1.1;
            drop.position.x = spoutX + drop.userData.offsetX - progress * 0.5;
            drop.position.y = spoutY - progress * 2.3;
            drop.position.z = drop.userData.offsetZ;
            
            const scale = 1 - progress * 0.4;
            drop.scale.setScalar(Math.max(0.25, scale));
          }
        });
        
        if (elapsed > 1.2) setPhase('growing');
      } else if (elapsed >= waterEnd) {
        s.waterDrops.forEach(drop => drop.visible = false);
      }

      if (elapsed > 1.3) {
        const waterOpacity = Math.min((elapsed - 1.3) / 1.0, 0.7);
        s.waterMaterial.uniforms.uOpacity.value = waterOpacity;
      }

      s.seeds.forEach((seed) => {
        const mat = seed.userData.material as THREE.ShaderMaterial;
        if (mat?.uniforms) {
          mat.uniforms.uTime.value = elapsed;
          
          if (elapsed > 2.0) {
            const fadeStart = 2.0 + seed.userData.index * 0.08;
            const fadeProgress = Math.min((elapsed - fadeStart) / 0.5, 1);
            mat.uniforms.uGlow.value = 1 - fadeProgress * 0.7;
            seed.scale.setScalar(Math.max(0, 1 - fadeProgress));
            if (fadeProgress >= 1) seed.visible = false;
          }
        }
      });

      if (elapsed > 2.8) {
        s.sparkles.visible = false;
      }

      const flowerStart = 2.3;
      s.flowers.forEach((flower, i) => {
        const delayedStart = flowerStart + i * 0.08;
        if (elapsed > delayedStart) {
          const growProgress = Math.min((elapsed - delayedStart) / 0.85, 1);
          const eased = 1 - Math.pow(1 - growProgress, 3);
          
          flower.scale.setScalar(eased * 0.4);
          flower.position.y = -0.95 + eased * 0.95;
          
          flower.rotation.y = Math.sin(elapsed * 0.5 + i) * 0.05;
          
          flower.children.forEach((child) => {
            const mesh = child as THREE.Mesh;
            const mat = mesh.userData?.material as THREE.ShaderMaterial;
            if (mat?.uniforms) {
              mat.uniforms.uTime.value = elapsed;
              mat.uniforms.uBloom.value = eased;
            }
          });
        }
      });

      if (elapsed > 2.4) setPhase('blooming');

      if (elapsed > 4.5 && !completedRef.current) {
        completedRef.current = true;
        setTimeout(() => onComplete(), 250);
      }

      s.composer.render();
    };

    animate();

    return () => {
      const s = sceneRef.current;
      if (s) {
        cancelAnimationFrame(s.animationId);
        if (container.contains(s.renderer.domElement)) {
          container.removeChild(s.renderer.domElement);
        }
        s.renderer.dispose();
        s.composer.dispose();
      }
      sceneRef.current = null;
    };
  }, [onComplete]);

  function createRealisticPitcher(): THREE.Group {
    const group = new THREE.Group();
    
    const mirrorMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorTeal: { value: VIVVA_COLORS.teal },
        uColorBurgundy: { value: VIVVA_COLORS.burgundy },
        uColorMint: { value: VIVVA_COLORS.mint },
      },
      vertexShader: REALISTIC_MIRROR_VERTEX,
      fragmentShader: REALISTIC_MIRROR_FRAGMENT,
      side: THREE.DoubleSide,
    });

    const bodyPoints: THREE.Vector2[] = [];
    const segments = 35;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * 1.0;
      
      let x: number;
      if (t < 0.2) {
        x = 0.06 + Math.pow(t / 0.2, 0.7) * 0.22;
      } else if (t < 0.5) {
        const localT = (t - 0.2) / 0.3;
        x = 0.28 + Math.sin(localT * Math.PI * 0.5) * 0.08;
      } else if (t < 0.8) {
        const localT = (t - 0.5) / 0.3;
        x = 0.36 - localT * 0.12;
      } else {
        const localT = (t - 0.8) / 0.2;
        x = 0.24 - localT * 0.04 + Math.sin(localT * Math.PI) * 0.03;
      }
      bodyPoints.push(new THREE.Vector2(x, y));
    }
    const bodyGeo = new THREE.LatheGeometry(bodyPoints, 28);
    const body = new THREE.Mesh(bodyGeo, mirrorMat);
    body.position.y = -0.15;
    group.add(body);

    const spoutCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0.8, 0),
      new THREE.Vector3(-0.38, 0.92, 0),
      new THREE.Vector3(-0.55, 1.05, 0.01),
      new THREE.Vector3(-0.68, 1.12, 0.02),
    ]);
    const spoutGeo = new THREE.TubeGeometry(spoutCurve, 18, 0.045, 10, false);
    const spout = new THREE.Mesh(spoutGeo, mirrorMat);
    group.add(spout);

    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.24, 0.25, 0),
      new THREE.Vector3(0.38, 0.4, 0),
      new THREE.Vector3(0.42, 0.6, 0),
      new THREE.Vector3(0.35, 0.75, 0),
      new THREE.Vector3(0.22, 0.82, 0),
    ]);
    const handleGeo = new THREE.TubeGeometry(handleCurve, 18, 0.025, 8, false);
    const handle = new THREE.Mesh(handleGeo, mirrorMat);
    group.add(handle);

    group.scale.setScalar(0.7);
    return group;
  }

  function createFlower(config: { colors: THREE.Color[], petals: number }): THREE.Group {
    const group = new THREE.Group();
    const { colors, petals } = config;

    const stemGeo = new THREE.CylinderGeometry(0.02, 0.028, 0.8, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x2D5A32 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.4;
    group.add(stem);

    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2;
      const colorIdx = p % colors.length;
      
      const petalGeo = new THREE.ConeGeometry(0.08, 0.25, 5, 1);
      petalGeo.rotateX(Math.PI / 2);
      
      const petalMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uBloom: { value: 0 },
          uColor1: { value: colors[colorIdx] },
          uColor2: { value: colors[(colorIdx + 1) % colors.length] },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uBloom;
          varying vec3 vPos;
          void main() {
            vPos = position;
            vec3 pos = position;
            float bloom = uBloom * 0.5 + 0.5;
            pos.xz *= bloom;
            pos.x += sin(uTime * 1.4 + position.y * 2.0) * 0.01;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform float uTime;
          varying vec3 vPos;
          void main() {
            float grad = smoothstep(-0.1, 0.2, vPos.z);
            vec3 color = mix(uColor1, uColor2, grad);
            float shimmer = sin(uTime * 2.5 + vPos.z * 6.0) * 0.05 + 0.95;
            color *= shimmer;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      });
      
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.05, 0.85, Math.sin(angle) * 0.05);
      petal.rotation.y = angle;
      petal.rotation.z = 0.5;
      petal.userData = { material: petalMat };
      group.add(petal);
    }

    const centerGeo = new THREE.SphereGeometry(0.05, 10, 10);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xE8D060, emissive: 0x443308, emissiveIntensity: 0.2 });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.position.y = 0.85;
    group.add(center);

    return group;
  }

  const phaseLabels: Record<string, string> = {
    watering: 'Initializing...',
    growing: 'Configuring...',
    blooming: 'Ready...',
  };

  return (
    <div className="absolute inset-0 z-50 overflow-hidden rounded-2xl bg-[#0a0a0a]">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-10">
        <p className="text-white/80 text-xs font-medium tracking-wide">
          {phaseLabels[phase] || ''}
        </p>
        <div className="mt-2 flex justify-center gap-1">
          {['watering', 'growing', 'blooming'].map((p, i) => (
            <div
              key={p}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: ['watering', 'growing', 'blooming'].indexOf(phase) >= i 
                  ? '#7BA3AC' 
                  : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
