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

type ScenePreset = "hero" | "features" | "howItWorks" | "evals" | "pricing" | "checkout";

interface PresetConfig {
  flowerCount: number;
  particleCount: number;
  waterSize: number;
  cameraZ: number;
  cameraY: number;
  cameraX: number;
  lookAtY: number;
  bloomSpeed: number;
  crtIntensity: number;
  pixelSize: number;
  scanlineIntensity: number;
  interactionStrength: number;
  spreadX: number;
  spreadZ: number;
}

const PRESETS: Record<ScenePreset, PresetConfig> = {
  hero: {
    flowerCount: 180,
    particleCount: 0,
    waterSize: 30,
    cameraZ: 9,
    cameraY: 4.5,
    cameraX: 0,
    lookAtY: 0,
    bloomSpeed: 0.025,
    crtIntensity: 0.3,
    pixelSize: 1,
    scanlineIntensity: 0.02,
    interactionStrength: 0.8,
    spreadX: 0.8,
    spreadZ: 0.85,
  },
  features: {
    flowerCount: 140,
    particleCount: 80,
    waterSize: 22,
    cameraZ: 7,
    cameraY: 3.5,
    cameraX: 0,
    lookAtY: 0,
    bloomSpeed: 0.018,
    crtIntensity: 0.12,
    pixelSize: 1,
    scanlineIntensity: 0.008,
    interactionStrength: 0.5,
    spreadX: 0.75,
    spreadZ: 0.8,
  },
  howItWorks: {
    flowerCount: 130,
    particleCount: 75,
    waterSize: 22,
    cameraZ: 7.5,
    cameraY: 3.5,
    cameraX: 0,
    lookAtY: 0,
    bloomSpeed: 0.02,
    crtIntensity: 0.15,
    pixelSize: 1,
    scanlineIntensity: 0.008,
    interactionStrength: 0.6,
    spreadX: 0.75,
    spreadZ: 0.8,
  },
  evals: {
    flowerCount: 120,
    particleCount: 70,
    waterSize: 20,
    cameraZ: 7,
    cameraY: 3.5,
    cameraX: 0,
    lookAtY: 0,
    bloomSpeed: 0.018,
    crtIntensity: 0.15,
    pixelSize: 1,
    scanlineIntensity: 0.008,
    interactionStrength: 0.6,
    spreadX: 0.75,
    spreadZ: 0.8,
  },
  pricing: {
    flowerCount: 120,
    particleCount: 70,
    waterSize: 20,
    cameraZ: 7,
    cameraY: 3.5,
    cameraX: 0,
    lookAtY: 0,
    bloomSpeed: 0.016,
    crtIntensity: 0.12,
    pixelSize: 1,
    scanlineIntensity: 0.006,
    interactionStrength: 0.5,
    spreadX: 0.75,
    spreadZ: 0.8,
  },
  checkout: {
    flowerCount: 35,
    particleCount: 0,
    waterSize: 14,
    cameraZ: 7.5,
    cameraY: 3.8,
    cameraX: 0,
    lookAtY: 0,
    bloomSpeed: 0.018,
    crtIntensity: 0.06,
    pixelSize: 1,
    scanlineIntensity: 0.003,
    interactionStrength: 0.25,
    spreadX: 0.7,
    spreadZ: 0.75,
  },
};

// Svivva brand colors from reference art
const VIVVA_COLORS = {
  teal: new THREE.Color(0x5b7faa), // Steel blue (from ref background)
  tealLight: new THREE.Color(0x6b9b58), // Vivid leaf green
  tealDark: new THREE.Color(0x3a5a30), // Deep forest green
  burgundy: new THREE.Color(0x8b1830), // Rich crimson red
  burgundyLight: new THREE.Color(0x8b5ea0), // Medium purple/violet
  maroon: new THREE.Color(0x7a4530), // Warm brown/umber
  dustyPink: new THREE.Color(0xd8a0b8), // Dusty rose pink
  paleRose: new THREE.Color(0xe8c0d0), // Pale blush
  mint: new THREE.Color(0x90b858), // Yellow-green (from ref leaves)
  lavender: new THREE.Color(0x9580c0), // True lavender-purple
  cream: new THREE.Color(0xc8b898), // Warm sand/beige
};

const WATER_VERTEX_SHADER = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uInteraction;
  varying vec2 vUv;
  varying float vElevation;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    float wave1 = sin(pos.x * 1.8 + uTime * 1.2) * 0.15;
    float wave2 = sin(pos.z * 2.5 + uTime * 1.6) * 0.10;
    float wave3 = cos(pos.x * 1.2 + pos.z * 1.8 + uTime * 0.8) * 0.08;
    
    float dist = length(pos.xz - uMouse * 6.0);
    float ripple = sin(dist * 3.5 - uTime * 4.5) * 0.3 * exp(-dist * 0.35) * uInteraction;
    
    pos.y += wave1 + wave2 + wave3 + ripple;
    vElevation = pos.y;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WATER_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColorTeal;
  uniform vec3 uColorTealLight;
  uniform vec3 uColorBurgundy;
  uniform vec3 uColorMint;
  varying vec2 vUv;
  varying float vElevation;
  
  void main() {
    float t = vElevation * 1.5 + 0.5;
    t += sin(vUv.x * 8.0 + uTime * 0.4) * 0.12;
    t += cos(vUv.y * 6.0 + uTime * 0.25) * 0.12;
    
    // Metallic teal base with burgundy accents
    vec3 color = mix(uColorTeal, uColorTealLight, t);
    
    // Add burgundy organic patterns
    float pattern = sin(vUv.x * 15.0 + uTime * 0.3) * sin(vUv.y * 12.0 + uTime * 0.4);
    pattern += sin(vUv.x * 8.0 - vUv.y * 10.0 + uTime * 0.5) * 0.5;
    pattern = smoothstep(0.3, 0.7, pattern * 0.5 + 0.5);
    color = mix(color, uColorBurgundy, pattern * 0.35);
    
    // Metallic shimmer
    float shimmer = sin(vUv.x * 40.0 + uTime * 2.0) * sin(vUv.y * 40.0 + uTime * 1.5) * 0.08;
    color += shimmer * uColorMint;
    
    // Fresnel-like edge highlight
    float fresnel = pow(1.0 - abs(vElevation), 2.5) * 0.2;
    color += fresnel * uColorTealLight;
    
    gl_FragColor = vec4(color, 0.85);
  }
`;

const CRT_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CRT_FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uScanlineIntensity;
  uniform float uCrtIntensity;
  uniform float uPixelSize;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Pixelation effect
    vec2 pixelatedUv = uv;
    if (uPixelSize > 1.0) {
      float pxSize = uPixelSize / uResolution.y;
      pixelatedUv = floor(uv / pxSize) * pxSize + pxSize * 0.5;
    }
    
    // Chromatic aberration
    float aberration = 0.0015 * uCrtIntensity;
    vec4 colorR = texture2D(tDiffuse, pixelatedUv + vec2(aberration, 0.0));
    vec4 colorG = texture2D(tDiffuse, pixelatedUv);
    vec4 colorB = texture2D(tDiffuse, pixelatedUv - vec2(aberration, 0.0));
    vec4 color = vec4(colorR.r, colorG.g, colorB.b, 1.0);
    
    // Scanlines
    float scanline = sin(uv.y * uResolution.y * 1.2) * 0.5 + 0.5;
    scanline = pow(scanline, 1.8) * uScanlineIntensity;
    color.rgb -= scanline * uCrtIntensity;
    
    // Subtle vignette
    vec2 vignetteUv = uv * (1.0 - uv.yx);
    float vignette = vignetteUv.x * vignetteUv.y * 18.0;
    vignette = pow(vignette, 0.2 * uCrtIntensity);
    color.rgb *= mix(1.0, vignette, 0.25 * uCrtIntensity);
    
    // Very subtle flicker
    float flicker = 1.0 - (sin(uTime * 6.0) * 0.008 * uCrtIntensity);
    color.rgb *= flicker;
    
    gl_FragColor = color;
  }
`;

type FlowerType = "tulip" | "lily" | "orchid" | "rose" | "lotus" | "dahlia";

interface FlowerConfig {
  type: FlowerType;
  petalCount: number;
  petalShape: "pointed" | "rounded" | "curved" | "layered" | "star" | "teardrop";
  colors: THREE.Color[];
  scale: number;
  petalWidth: number;
  petalLength: number;
  openAngle: number;
}

const FLOWER_CONFIGS: FlowerConfig[] = [
  {
    type: "tulip",
    petalCount: 5,
    petalShape: "pointed",
    colors: [VIVVA_COLORS.dustyPink, VIVVA_COLORS.paleRose, VIVVA_COLORS.lavender],
    scale: 1.4,
    petalWidth: 0.32,
    petalLength: 0.8,
    openAngle: 0.65,
  },
  {
    type: "lily",
    petalCount: 6,
    petalShape: "curved",
    colors: [VIVVA_COLORS.mint, VIVVA_COLORS.tealLight, VIVVA_COLORS.cream],
    scale: 1.5,
    petalWidth: 0.24,
    petalLength: 0.9,
    openAngle: 0.5,
  },
  {
    type: "orchid",
    petalCount: 5,
    petalShape: "teardrop",
    colors: [VIVVA_COLORS.lavender, VIVVA_COLORS.burgundyLight, VIVVA_COLORS.paleRose],
    scale: 1.3,
    petalWidth: 0.4,
    petalLength: 0.7,
    openAngle: 0.55,
  },
  {
    type: "rose",
    petalCount: 10,
    petalShape: "layered",
    colors: [VIVVA_COLORS.paleRose, VIVVA_COLORS.dustyPink, VIVVA_COLORS.maroon],
    scale: 1.1,
    petalWidth: 0.28,
    petalLength: 0.45,
    openAngle: 0.4,
  },
  {
    type: "lotus",
    petalCount: 8,
    petalShape: "rounded",
    colors: [VIVVA_COLORS.tealLight, VIVVA_COLORS.mint, VIVVA_COLORS.teal],
    scale: 1.4,
    petalWidth: 0.32,
    petalLength: 0.7,
    openAngle: 0.45,
  },
  {
    type: "dahlia",
    petalCount: 12,
    petalShape: "star",
    colors: [VIVVA_COLORS.burgundyLight, VIVVA_COLORS.dustyPink, VIVVA_COLORS.lavender],
    scale: 1.0,
    petalWidth: 0.15,
    petalLength: 0.55,
    openAngle: 0.35,
  },
];

const INTRO_FLOWER_CONFIGS: FlowerConfig[] = [
  {
    type: "tulip",
    petalCount: 5,
    petalShape: "pointed",
    colors: [VIVVA_COLORS.cream, VIVVA_COLORS.paleRose, VIVVA_COLORS.mint],
    scale: 1.4,
    petalWidth: 0.32,
    petalLength: 0.8,
    openAngle: 0.65,
  },
  {
    type: "lily",
    petalCount: 6,
    petalShape: "curved",
    colors: [VIVVA_COLORS.burgundy, VIVVA_COLORS.maroon, VIVVA_COLORS.cream],
    scale: 1.5,
    petalWidth: 0.24,
    petalLength: 0.9,
    openAngle: 0.5,
  },
  {
    type: "orchid",
    petalCount: 5,
    petalShape: "teardrop",
    colors: [VIVVA_COLORS.lavender, VIVVA_COLORS.teal, VIVVA_COLORS.cream],
    scale: 1.3,
    petalWidth: 0.4,
    petalLength: 0.7,
    openAngle: 0.55,
  },
  {
    type: "rose",
    petalCount: 10,
    petalShape: "layered",
    colors: [VIVVA_COLORS.burgundy, VIVVA_COLORS.maroon, VIVVA_COLORS.dustyPink],
    scale: 1.1,
    petalWidth: 0.28,
    petalLength: 0.45,
    openAngle: 0.4,
  },
  {
    type: "lotus",
    petalCount: 8,
    petalShape: "rounded",
    colors: [VIVVA_COLORS.teal, VIVVA_COLORS.tealLight, VIVVA_COLORS.cream],
    scale: 1.4,
    petalWidth: 0.32,
    petalLength: 0.7,
    openAngle: 0.45,
  },
  {
    type: "dahlia",
    petalCount: 12,
    petalShape: "star",
    colors: [VIVVA_COLORS.maroon, VIVVA_COLORS.burgundy, VIVVA_COLORS.tealLight],
    scale: 1.0,
    petalWidth: 0.15,
    petalLength: 0.55,
    openAngle: 0.35,
  },
];

const CHECKOUT_COLORS = {
  blushPink: new THREE.Color(0xd8a0b0),
  paleChartreuse: new THREE.Color(0xc8c870),
  sageGreen: new THREE.Color(0x8ba868),
  softLavender: new THREE.Color(0xb8a0c8),
  warmCream: new THREE.Color(0xe0d8c0),
  roseMauve: new THREE.Color(0xc8909a),
};

const CHECKOUT_FLOWER_CONFIGS: FlowerConfig[] = [
  {
    type: "tulip",
    petalCount: 5,
    petalShape: "pointed",
    colors: [CHECKOUT_COLORS.blushPink, CHECKOUT_COLORS.warmCream, CHECKOUT_COLORS.roseMauve],
    scale: 1.4,
    petalWidth: 0.32,
    petalLength: 0.8,
    openAngle: 0.65,
  },
  {
    type: "lily",
    petalCount: 6,
    petalShape: "curved",
    colors: [CHECKOUT_COLORS.paleChartreuse, CHECKOUT_COLORS.warmCream, CHECKOUT_COLORS.sageGreen],
    scale: 1.5,
    petalWidth: 0.24,
    petalLength: 0.9,
    openAngle: 0.5,
  },
  {
    type: "orchid",
    petalCount: 5,
    petalShape: "teardrop",
    colors: [CHECKOUT_COLORS.softLavender, CHECKOUT_COLORS.blushPink, CHECKOUT_COLORS.warmCream],
    scale: 1.3,
    petalWidth: 0.4,
    petalLength: 0.7,
    openAngle: 0.55,
  },
  {
    type: "rose",
    petalCount: 10,
    petalShape: "layered",
    colors: [CHECKOUT_COLORS.blushPink, CHECKOUT_COLORS.roseMauve, CHECKOUT_COLORS.softLavender],
    scale: 1.1,
    petalWidth: 0.28,
    petalLength: 0.45,
    openAngle: 0.4,
  },
  {
    type: "lotus",
    petalCount: 8,
    petalShape: "rounded",
    colors: [CHECKOUT_COLORS.sageGreen, CHECKOUT_COLORS.paleChartreuse, CHECKOUT_COLORS.warmCream],
    scale: 1.4,
    petalWidth: 0.32,
    petalLength: 0.7,
    openAngle: 0.45,
  },
  {
    type: "dahlia",
    petalCount: 12,
    petalShape: "star",
    colors: [
      CHECKOUT_COLORS.softLavender,
      CHECKOUT_COLORS.blushPink,
      CHECKOUT_COLORS.paleChartreuse,
    ],
    scale: 1.0,
    petalWidth: 0.15,
    petalLength: 0.55,
    openAngle: 0.35,
  },
];

function createVivvaTextTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  const sColors = ["#5B9BD5", "#4ECDC4", "#6CB4EE", "#48D1CC", "#7EC8E3", "#3CB6CE"];
  const vivvaColors = [
    "#E8607A",
    "#D64D78",
    "#CC5588",
    "#F06090",
    "#C84B80",
    "#DA5A90",
    "#88CC66",
    "#70B858",
    "#A0D870",
    "#6BBA54",
    "#99DD77",
    "#82C462",
    "#DD80DD",
    "#C870D0",
    "#B868C8",
    "#E088E8",
    "#D060C0",
    "#CC78D8",
  ];

  ctx.font = 'bold 180px "Arial", sans-serif';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  for (let pass = 0; pass < 3; pass++) {
    const offsetX = (Math.random() - 0.5) * 12;
    const offsetY = (Math.random() - 0.5) * 12;
    ctx.fillStyle = sColors[pass % sColors.length];
    ctx.globalAlpha = 0.5;
    ctx.fillText("S", size / 2 + offsetX, size / 2 + offsetY);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const vivvaSize = 30;
  ctx.font = `bold ${vivvaSize}px "Arial", sans-serif`;

  let row = 0;
  for (let y = 8; y < size; y += vivvaSize + 4) {
    let x = row % 2 === 0 ? 4 : -18;
    let col = 0;
    while (x < size) {
      const cIdx = (row * 7 + col * 3) % vivvaColors.length;
      ctx.fillStyle = vivvaColors[cIdx];
      ctx.globalAlpha = 0.65;
      ctx.fillText("VIVVA", x, y);
      x += 88;
      col++;
    }
    row++;
  }
  ctx.globalAlpha = 1;

  const imageData = ctx.getImageData(0, 0, size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 0) {
      if (Math.random() > 0.42) {
        d[i + 3] = 0;
      } else {
        d[i] = Math.min(255, Math.max(0, d[i] + (Math.random() * 80 - 40)));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + (Math.random() * 80 - 40)));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + (Math.random() * 80 - 40)));
        d[i + 3] = Math.min(255, Math.floor(d[i + 3] * (0.5 + Math.random() * 0.5)));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createExoticFlower(
  scene: THREE.Scene,
  position: THREE.Vector3,
  flowerConfig: FlowerConfig,
  baseScale: number,
  disposables: { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }[],
  noiseLevel: number = 0.12,
  textTexture: THREE.CanvasTexture | null = null,
) {
  const flowerGroup = new THREE.Group();
  flowerGroup.position.copy(position);

  const scale = baseScale * flowerConfig.scale;
  const { petalCount, petalShape, colors, petalWidth, petalLength, openAngle } = flowerConfig;

  // Create petals based on flower type
  for (let p = 0; p < petalCount; p++) {
    const angle = (p / petalCount) * Math.PI * 2;
    const layer = Math.floor(p / 4);
    const layerOffset = petalShape === "layered" ? layer * 0.06 : 0;

    // Different petal geometries based on shape - using varied THREE.js primitives
    let petalGeometry: THREE.BufferGeometry;
    const w = petalWidth * scale;
    const l = petalLength * scale;
    const h = 0.05 * scale;

    switch (petalShape) {
      case "pointed":
        // Sharp tulip-like petals using tapered box
        petalGeometry = new THREE.ConeGeometry(w * 0.6, l, 4, 1);
        petalGeometry.rotateX(Math.PI / 2);
        break;
      case "rounded":
        // Soft lotus-like petals using elongated sphere segment
        petalGeometry = new THREE.SphereGeometry(w * 0.8, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.6);
        petalGeometry.scale(1, 0.3, l / (w * 0.8));
        break;
      case "curved":
        // Elegant lily petals - thin and long
        petalGeometry = new THREE.BoxGeometry(w * 0.7, h, l * 1.2);
        break;
      case "layered":
        // Rose petals in concentric layers
        const layerScale = 1 - layer * 0.2;
        petalGeometry = new THREE.CircleGeometry(w * layerScale, 6);
        petalGeometry.rotateX(-Math.PI / 2.5);
        break;
      case "star":
        // Dahlia spiky petals
        petalGeometry = new THREE.ConeGeometry(w * 0.4, l * 0.9, 3, 1);
        petalGeometry.rotateX(Math.PI / 2);
        break;
      case "teardrop":
        // Orchid teardrop petals
        petalGeometry = new THREE.SphereGeometry(w * 0.5, 5, 4, 0, Math.PI * 2, 0, Math.PI * 0.7);
        petalGeometry.scale(1.2, 0.25, l / (w * 0.5));
        break;
      default:
        petalGeometry = new THREE.BoxGeometry(w, h, l);
    }

    // Multi-color gradient material
    const colorIndex = p % colors.length;
    const nextColorIndex = (p + 1) % colors.length;

    const petalUniforms: Record<string, { value: unknown }> = {
      uTime: { value: 0 },
      uBloom: { value: 0 },
      uColor1: { value: colors[colorIndex] },
      uColor2: { value: colors[nextColorIndex] },
      uColor3: { value: colors[(colorIndex + 2) % colors.length] },
      uHover: { value: 0 },
      uNoiseLevel: { value: noiseLevel },
      uHasText: { value: textTexture ? 1.0 : 0.0 },
    };
    if (textTexture) {
      petalUniforms.uTextMap = { value: textTexture };
    }

    const petalMaterial = new THREE.ShaderMaterial({
      uniforms: petalUniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uBloom;
        uniform float uHover;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vPosition = position;
          vUv = uv;
          vec3 pos = position;
          float bloomFactor = uBloom * 0.55 + 0.45;
          pos.xz *= bloomFactor + uHover * 0.08;
          pos.y += uHover * 0.04;
          pos.x += sin(uTime * 1.5 + position.y * 2.0) * 0.012;
          pos.z += cos(uTime * 1.2 + position.x * 2.0) * 0.008;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform float uTime;
        uniform float uHover;
        uniform float uNoiseLevel;
        uniform float uHasText;
        ${textTexture ? "uniform sampler2D uTextMap;" : ""}
        varying vec3 vPosition;
        varying vec2 vUv;

        float hash(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        float grain(vec2 uv, float t) {
          float n1 = hash(uv * 320.0 + t * 1.7);
          float n2 = hash(uv * 480.0 - t * 2.3);
          return mix(n1, n2, 0.5);
        }

        void main() {
          float tipGradient = smoothstep(-0.3, 0.4, vPosition.z);
          float sideGradient = smoothstep(-0.15, 0.15, vPosition.x) * 0.6;
          
          vec3 color = mix(uColor1, uColor2, tipGradient);
          color = mix(color, uColor3, sideGradient);
          
          float shimmer = sin(uTime * 3.0 + vPosition.z * 8.0) * 0.08 + 0.92;
          color *= shimmer;
          
          float rim = pow(1.0 - abs(vPosition.x) * 4.0, 2.0) * 0.15;
          color += rim;
          
          color += uHover * 0.1;

          float n = grain(vUv + vPosition.xz * 2.0, uTime * 0.4);
          float n2 = grain(vUv * 1.5 + vPosition.yz * 3.0, uTime * 0.6 + 7.0);
          float n3 = grain(vUv * 0.8 - vPosition.xy * 1.5, uTime * 0.3 + 13.0);
          float combinedNoise = mix(n, mix(n2, n3, 0.4), 0.5);
          vec3 noiseTint = mix(
            vec3(combinedNoise * 0.65, combinedNoise * 0.8, combinedNoise),
            vec3(combinedNoise, combinedNoise * 0.7, combinedNoise * 0.85),
            step(0.5, hash(vUv * 50.0))
          );
          float fineGrain = hash(vUv * 600.0 + uTime * 0.2) * uNoiseLevel * 0.3;
          color = mix(color, color + (noiseTint - 0.5) * 2.0, uNoiseLevel);
          color += (fineGrain - uNoiseLevel * 0.15) * 0.8;

          ${
            textTexture
              ? `
          if (uHasText > 0.5) {
            vec2 textUv = fract(vUv * 1.8);
            vec4 textSample = texture2D(uTextMap, textUv);
            if (textSample.a > 0.05) {
              float sparkle = hash(vUv * 200.0 + uTime * 0.5) * 0.4 + 0.6;
              float shimmerShift = sin(uTime * 2.5 + vPosition.z * 6.0 + vPosition.x * 4.0) * 0.15;
              vec3 textColor = textSample.rgb + shimmerShift;
              textColor *= sparkle;
              float blendAlpha = textSample.a * 0.65;
              color = mix(color, textColor * 1.2, blendAlpha);
            }
          }
          `
              : ""
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
    });
    disposables.push({ geometry: petalGeometry, material: petalMaterial });

    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    const radius = 0.15 * scale * (petalShape === "layered" ? 1 - layer * 0.15 : 1);
    petal.position.x = Math.cos(angle) * radius;
    petal.position.z = Math.sin(angle) * radius;
    petal.position.y = 0.25 * scale + layerOffset;
    petal.rotation.y = angle;
    petal.rotation.z = openAngle + (petalShape === "layered" ? layer * 0.15 : 0);
    petal.userData = { material: petalMaterial, phase: p };
    flowerGroup.add(petal);
  }

  // Flower center
  const centerGeometry = new THREE.BoxGeometry(0.14 * scale, 0.1 * scale, 0.14 * scale);
  const centerColor =
    flowerConfig.type === "tulip" || flowerConfig.type === "rose"
      ? new THREE.Color(0xe8d060)
      : new THREE.Color(0xc4a058);
  const centerMaterial = new THREE.MeshBasicMaterial({
    color: centerColor,
    transparent: true,
    opacity: 0.92,
  });
  disposables.push({ geometry: centerGeometry, material: centerMaterial });

  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  center.position.y = 0.28 * scale;
  flowerGroup.add(center);

  // Stem with natural color
  const stemGeometry = new THREE.BoxGeometry(0.05 * scale, 1.0 * scale, 0.05 * scale);
  const stemMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x2d5a32),
    transparent: true,
    opacity: 0.88,
  });
  disposables.push({ geometry: stemGeometry, material: stemMaterial });

  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = -0.35 * scale;
  flowerGroup.add(stem);

  // Optional leaf for some flower types
  if (
    flowerConfig.type === "lily" ||
    flowerConfig.type === "lotus" ||
    flowerConfig.type === "dahlia"
  ) {
    const leafGeometry = new THREE.BoxGeometry(0.08 * scale, 0.02 * scale, 0.35 * scale);
    const leafMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x3a6b40),
      transparent: true,
      opacity: 0.85,
    });
    disposables.push({ geometry: leafGeometry, material: leafMaterial });

    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.y = -0.5 * scale;
    leaf.position.x = 0.15 * scale;
    leaf.rotation.z = 0.4;
    leaf.rotation.y = Math.random() * Math.PI * 2;
    flowerGroup.add(leaf);
  }

  scene.add(flowerGroup);
  return flowerGroup;
}

interface ThreeCRTFlowersProps {
  preset?: ScenePreset;
  isIntro?: boolean;
}

export function ThreeCRTFlowers({ preset = "hero", isIntro = false }: ThreeCRTFlowersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Track dimensions with multiple strategies for reliability
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const updateDimensions = () => {
      const w = container.clientWidth || container.offsetWidth;
      const h = container.clientHeight || container.offsetHeight;
      if (w > 0 && h > 0) {
        setDimensions((prev) => {
          if (prev?.width === w && prev?.height === h) return prev;
          return { width: w, height: h };
        });
        return true;
      }
      return false;
    };

    // Try immediately
    if (!updateDimensions()) {
      // Retry with delays for sections that load later
      const retries = [50, 100, 200, 500, 1000, 2000];
      const timeouts = retries.map((delay) => setTimeout(updateDimensions, delay));

      // Also use IntersectionObserver
      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            updateDimensions();
          }
        },
        { threshold: 0, rootMargin: "500px" },
      );
      intersectionObserver.observe(container);

      // ResizeObserver
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(container);

      return () => {
        timeouts.forEach((t) => clearTimeout(t));
        intersectionObserver.disconnect();
        resizeObserver.disconnect();
      };
    }

    // ResizeObserver for ongoing changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [preset]);

  useEffect(() => {
    if (!dimensions) return;
    if (!isWebGLAvailable()) {
      setWebGLAvailable(false);
      return;
    }
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = dimensions.width;
    const height = dimensions.height;

    if (width === 0 || height === 0) return;

    // Detect mobile for performance optimization
    const isMobile = width < 768;

    const baseConfig = PRESETS[preset];
    // Responsive scaling based on viewport width
    const scaleFactor = Math.min(1, width / 1200); // Scale down for smaller screens
    const isSmallMobile = width < 480;
    const isMediumMobile = width < 768;

    const isCheckoutPreset = preset === "checkout";

    const config = isMediumMobile
      ? {
          ...baseConfig,
          flowerCount: isCheckoutPreset
            ? Math.floor(baseConfig.flowerCount * 0.8)
            : isSmallMobile
              ? Math.max(60, Math.floor(baseConfig.flowerCount * 0.9))
              : Math.max(80, Math.floor(baseConfig.flowerCount * 0.95)),
          particleCount: Math.floor(baseConfig.particleCount * 0.3),
          cameraZ: baseConfig.cameraZ * 0.95,
          cameraY: baseConfig.cameraY * 0.9,
          pixelSize: 1,
          crtIntensity: isCheckoutPreset ? 0.06 : 0.2,
          scanlineIntensity: isCheckoutPreset ? 0.003 : 0.012,
          bloomSpeed: baseConfig.bloomSpeed * 1.2,
          mobileScaleBoost: isSmallMobile ? 0.8 : 0.85,
        }
      : {
          ...baseConfig,
          mobileScaleBoost: Math.max(0.85, scaleFactor),
        };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(config.cameraX, config.cameraY, config.cameraZ);
    camera.lookAt(0, config.lookAtY, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Style the canvas to fill container and stay positioned correctly
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create render target for post-processing
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });

    // CRT post-processing setup
    const crtScene = new THREE.Scene();
    const crtCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const crtGeometry = new THREE.PlaneGeometry(2, 2);
    const crtMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: renderTarget.texture },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uScanlineIntensity: { value: config.scanlineIntensity },
        uCrtIntensity: { value: config.crtIntensity },
        uPixelSize: { value: config.pixelSize },
      },
      vertexShader: CRT_VERTEX_SHADER,
      fragmentShader: CRT_FRAGMENT_SHADER,
      transparent: true,
    });
    const crtQuad = new THREE.Mesh(crtGeometry, crtMaterial);
    crtScene.add(crtQuad);

    const disposables: {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    }[] = [];
    disposables.push({ geometry: crtGeometry, material: crtMaterial });

    // Metallic water matching Vivva logo
    const waterGeometry = new THREE.PlaneGeometry(config.waterSize, config.waterSize, 56, 56);
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uInteraction: { value: config.interactionStrength },
        uColorTeal: { value: VIVVA_COLORS.teal },
        uColorTealLight: { value: VIVVA_COLORS.tealLight },
        uColorBurgundy: { value: VIVVA_COLORS.burgundy },
        uColorMint: { value: VIVVA_COLORS.mint },
      },
      vertexShader: WATER_VERTEX_SHADER,
      fragmentShader: WATER_FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
    });
    disposables.push({ geometry: waterGeometry, material: waterMaterial });

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1.4;
    scene.add(water);

    // Create many exotic flowers spread evenly across scene
    const flowers: THREE.Group[] = [];

    // Calculate grid-based distribution for even coverage
    const gridCols = Math.ceil(Math.sqrt(config.flowerCount * 1.5));
    const gridRows = Math.ceil(config.flowerCount / gridCols);

    // Spread flowers across entire scene - expanded for corners and edges
    const spreadX = config.waterSize * config.spreadX * 1.5;
    const spreadZ = config.waterSize * config.spreadZ * 2.0;

    const isCheckout = preset === "checkout";
    const vivvaTextTex = isCheckout ? createVivvaTextTexture() : null;

    const addFlower = (pos: THREE.Vector3, scaleMultiplier: number = 1, flowerIndex: number) => {
      const activeConfigs = isCheckout
        ? CHECKOUT_FLOWER_CONFIGS
        : isIntro
          ? INTRO_FLOWER_CONFIGS
          : FLOWER_CONFIGS;
      const typeIndex = Math.floor(Math.random() * activeConfigs.length);
      const flowerConfig = activeConfigs[typeIndex];

      const sizeVariation = Math.random();
      const sectionBoost = isIntro ? 1 : 1.4;
      const baseScale = sizeVariation < 0.2 ? 0.9 + Math.random() * 0.5 : 0.6 + Math.random() * 0.4;
      const mobileBoost = (config as any).mobileScaleBoost || 1;
      const scale = baseScale * Math.max(mobileBoost, 0.6) * scaleMultiplier * sectionBoost;

      const flowerNoise = isCheckout ? 0.18 : isIntro ? 0.25 : 0.12;
      const flower = createExoticFlower(
        scene,
        pos,
        flowerConfig,
        scale,
        disposables,
        flowerNoise,
        vivvaTextTex,
      );
      const initialGrowth = isIntro
        ? Math.random() < 0.3
          ? 0.3 + Math.random() * 0.3
          : 0.6 + Math.random() * 0.4
        : 0.5 + Math.random() * 0.5;
      flower.userData = {
        baseY: pos.y,
        growthProgress: initialGrowth,
        targetGrowth: 1,
        phase: flowerIndex * 0.15,
        bloomSpeed: config.bloomSpeed + Math.random() * 0.015,
        rotationOffset: (Math.random() - 0.5) * Math.PI * 0.4,
      };
      flower.scale.setScalar(initialGrowth * 1.2);
      flower.rotation.y = Math.random() * Math.PI * 2;
      flowers.push(flower);
    };

    // Main grid flowers
    for (let i = 0; i < config.flowerCount; i++) {
      const gridX = (i % gridCols) / gridCols;
      const gridZ = Math.floor(i / gridCols) / gridRows;

      const jitterX = (Math.random() - 0.5) * (spreadX / gridCols) * 0.8;
      const jitterZ = (Math.random() - 0.5) * (spreadZ / gridRows) * 0.8;

      const pos = new THREE.Vector3(
        (gridX - 0.5) * spreadX + jitterX,
        (Math.random() - 0.5) * 0.5,
        (gridZ - 0.5) * spreadZ + jitterZ,
      );

      addFlower(pos, 1, i);
    }

    // Add extra corner flowers (smaller, growing)
    const cornerCount = Math.floor(config.flowerCount * 0.3);
    const corners = [
      { x: -1, z: -1 },
      { x: 1, z: -1 },
      { x: -1, z: 1 },
      { x: 1, z: 1 },
      { x: -1, z: 0 },
      { x: 1, z: 0 },
      { x: 0, z: -1 },
      { x: 0, z: 1 },
    ];

    for (let i = 0; i < cornerCount; i++) {
      const corner = corners[i % corners.length];
      const pos = new THREE.Vector3(
        corner.x * spreadX * 0.45 + (Math.random() - 0.5) * spreadX * 0.25,
        (Math.random() - 0.5) * 0.4,
        corner.z * spreadZ * 0.45 + (Math.random() - 0.5) * spreadZ * 0.25,
      );

      addFlower(pos, 0.6 + Math.random() * 0.3, config.flowerCount + i);
    }

    let particleGeoRef: THREE.BufferGeometry | null = null;

    if (config.particleCount > 0) {
      const particlePositions = new Float32Array(config.particleCount * 3);
      const particleColors = new Float32Array(config.particleCount * 3);
      const colorOptions = [
        VIVVA_COLORS.teal,
        VIVVA_COLORS.dustyPink,
        VIVVA_COLORS.mint,
        VIVVA_COLORS.burgundyLight,
        VIVVA_COLORS.lavender,
      ];

      for (let i = 0; i < config.particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * config.waterSize;
        particlePositions[i * 3 + 1] = Math.random() * 6 - 1.5;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * config.waterSize * 0.5;

        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        particleColors[i * 3] = color.r;
        particleColors[i * 3 + 1] = color.g;
        particleColors[i * 3 + 2] = color.b;
      }

      particleGeoRef = new THREE.BufferGeometry();
      particleGeoRef.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      particleGeoRef.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

      const dotCanvas = document.createElement("canvas");
      dotCanvas.width = 16;
      dotCanvas.height = 16;
      const dotCtx = dotCanvas.getContext("2d");
      if (dotCtx) {
        dotCtx.beginPath();
        dotCtx.arc(8, 8, 7, 0, Math.PI * 2);
        dotCtx.fillStyle = "#ffffff";
        dotCtx.fill();
      }
      const dotTexture = new THREE.CanvasTexture(dotCanvas);

      const particleMaterial = new THREE.PointsMaterial({
        size: config.pixelSize + 1.5,
        transparent: true,
        opacity: 0.7,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: dotTexture,
        alphaMap: dotTexture,
      });
      disposables.push({ geometry: particleGeoRef, material: particleMaterial });

      const particles = new THREE.Points(particleGeoRef, particleMaterial);
      scene.add(particles);
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleClick = () => {
      flowers.forEach((flower) => {
        if (flower.userData.growthProgress < 0.5) {
          flower.userData.growthProgress = 0;
        }
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("click", handleClick);

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

      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      waterMaterial.uniforms.uTime.value = elapsed;
      waterMaterial.uniforms.uMouse.value.set(mouseX, mouseY);
      crtMaterial.uniforms.uTime.value = elapsed;

      flowers.forEach((flower) => {
        const { phase, baseY, bloomSpeed, rotationOffset } = flower.userData;

        if (flower.userData.growthProgress < flower.userData.targetGrowth) {
          flower.userData.growthProgress += bloomSpeed;
        }

        const growth = Math.min(flower.userData.growthProgress, 1);
        flower.scale.setScalar(growth);
        flower.position.y = baseY + Math.sin(elapsed * 0.7 + phase) * 0.06 * growth;
        flower.rotation.y = rotationOffset + Math.sin(elapsed * 0.3 + phase) * 0.06;

        flower.children.forEach((child) => {
          if (child.userData.material) {
            child.userData.material.uniforms.uTime.value = elapsed;
            child.userData.material.uniforms.uBloom.value = growth;
          }
        });
      });

      if (particleGeoRef) {
        const positions = particleGeoRef.attributes.position.array as Float32Array;
        for (let i = 0; i < config.particleCount; i++) {
          positions[i * 3 + 1] += Math.sin(elapsed * 0.8 + i * 0.12) * 0.0015;
          if (positions[i * 3 + 1] > 6) positions[i * 3 + 1] = -1.5;
        }
        particleGeoRef.attributes.position.needsUpdate = true;
      }

      // Camera with preset-specific offset
      camera.position.x = config.cameraX + mouseX * 1.5 * config.interactionStrength;
      camera.position.y = config.cameraY + mouseY * 0.35 * config.interactionStrength;
      camera.lookAt(0, config.lookAtY, 0);

      // Render scene to texture, then apply CRT post-processing
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(crtScene, crtCamera);
    };

    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderTarget.setSize(newWidth, newHeight);
      crtMaterial.uniforms.uResolution.value.set(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("click", handleClick);
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

      if (vivvaTextTex) {
        vivvaTextTex.dispose();
      }

      renderTarget.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [preset, dimensions, isIntro]);

  if (!webGLAvailable) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: "auto",
        minHeight: "100%",
        minWidth: "100%",
      }}
    />
  );
}
