import * as THREE from "three";
import {
  BALOON8_BLUEPRINT_URL,
  cropBlueprintTexture,
  prepareBlueprint,
  type Baloon8BlueprintQuadrant,
  type PreparedQuadrant,
} from "./baloon8-textures";

/** Real-world mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

export const BALOON8_SCENE_SCALE = 0.42;
export const BALOON8_WALKER_SCALE = 0.42;
export const BALOON8_WALKER_SCALE_MOBILE = 0.36;
/** Smaller per-foot scale so a left/right pair fits the lane. */
export const BALOON8_PAIR_SCALE = 0.26;
export const BALOON8_PAIR_SCALE_MOBILE = 0.34;
export const BALOON8_PAIR_SCALE_PORTRAIT = 0.31;

/** Abalone shell palette — deep teal, emerald, navy, violet (reference mockup). */
const IRIDESCENCE = [0x1a6650, 0x2a8090, 0x3a5080, 0x5a3888, 0x2a9878, 0x4cc9c0];

function scaledDim(value: number, scale = BALOON8_SCENE_SCALE): number {
  return value * scale;
}

function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function drawBLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#ffffff";
  ctx.font = `italic bold ${size}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("8", 0, -size * 0.08);
  ctx.font = `600 ${size * 0.17}px monospace`;
  ctx.fillStyle = "#e8f0f8";
  ctx.fillText("i6Pw", 0, size * 0.4);
  ctx.restore();
}

function hubcapTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.48);
    g.addColorStop(0, "#f0f8ff");
    g.addColorStop(0.5, "#c8d8e8");
    g.addColorStop(1, "#7a94ac");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
    ctx.fill();
    drawBLogo(ctx, w / 2, h / 2, w * 0.26);
  });
}

/** Shared abalone PBR for blueprint panels — lets the mockup art read through. */
function abalonePanelMaterial(
  map: THREE.Texture,
  alphaMap?: THREE.Texture,
  glow?: { emissive: number; intensity: number },
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map,
    alphaMap,
    transparent: true,
    alphaTest: alphaMap ? 0.1 : 0.04,
    metalness: 0.58,
    roughness: 0.26,
    clearcoat: 0.92,
    clearcoatRoughness: 0.06,
    iridescence: 0.72,
    iridescenceIOR: 1.33,
    iridescenceThicknessRange: [120, 820],
    envMapIntensity: 1.85,
    side: THREE.DoubleSide,
    depthWrite: true,
    emissive: new THREE.Color(glow?.emissive ?? 0x081820),
    emissiveIntensity: glow?.intensity ?? 0.12,
  });
}

function legacyPanel(
  blueprint: THREE.Texture,
  quadrant: Baloon8BlueprintQuadrant,
  w: number,
  h: number,
): THREE.Mesh {
  const tex = cropBlueprintTexture(blueprint, quadrant);
  const mat = abalonePanelMaterial(tex);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.renderOrder = 2;
  return mesh;
}

function preparedPanel(
  prep: PreparedQuadrant,
  w: number,
  h: number,
  glow?: { emissive: number; intensity: number },
): THREE.Mesh {
  const mat = abalonePanelMaterial(prep.map, prep.alphaMap, glow);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.renderOrder = 2;
  return mesh;
}

function panelForQuadrant(
  blueprint: THREE.Texture,
  prepared: PreparedQuadrant | null,
  quadrant: Baloon8BlueprintQuadrant,
  w: number,
  h: number,
  glow?: { emissive: number; intensity: number },
): THREE.Mesh {
  if (prepared) {
    try {
      return preparedPanel(prepared, w, h, glow);
    } catch {
      /* fall through */
    }
  }
  return legacyPanel(blueprint, quadrant, w, h);
}

/** Iridescent pod rim — subtle 3D depth over the blueprint bubble texture. */
function createBubbleInstances(
  width: number,
  height: number,
  depth: number,
  count: number,
  scaleMul = 1,
  overlayOpacity = 0.32,
): THREE.InstancedMesh | null {
  if (count <= 0) return null;
  const bubbleGeo = new THREE.SphereGeometry(0.018 * scaleMul, 6, 6);
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.96,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 1,
    iridescenceIOR: 1.38,
    iridescenceThicknessRange: [100, 900],
    envMapIntensity: 1.75,
    transparent: true,
    opacity: overlayOpacity,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(bubbleGeo, bubbleMat, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;

  for (let i = 0; i < count; i++) {
    const face = i % 6;
    let x = 0;
    let y = 0;
    let z = 0;
    let nx = 0;
    let ny = 0;
    let nz = 0;
    const u = Math.random();
    const v = Math.random();

    switch (face) {
      case 0:
        x = -hw + u * width;
        y = v * height;
        z = hd;
        nz = 1;
        break;
      case 1:
        x = hw - u * width;
        y = v * height;
        z = -hd;
        nz = -1;
        break;
      case 2:
        x = -hw + u * width;
        y = hh;
        z = -hd + v * depth;
        ny = 1;
        break;
      case 3:
        x = -hw + u * width;
        y = 0;
        z = -hd + v * depth;
        ny = -1;
        break;
      case 4:
        x = -hw;
        y = v * height;
        z = -hd + u * depth;
        nx = -1;
        break;
      default:
        x = hw;
        y = v * height;
        z = -hd + u * depth;
        nx = 1;
        break;
    }

    const s = 0.55 + Math.random() * 0.75;
    const push = 0.035 * scaleMul * s;
    dummy.position.set(x + nx * push, y + ny * push + hh * 0.5, z + nz * push);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.setHex(IRIDESCENCE[i % IRIDESCENCE.length]!);
    mesh.setColorAt(i, color);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.renderOrder = 3;
  return mesh;
}

function createWheel(xSign: number, zSign: number, scale: number, mobile: boolean): THREE.Group {
  const wheel = new THREE.Group();
  const radius = scaledDim(0.34, scale);
  const y = scaledDim(0.34, scale);
  const x = xSign * scaledDim(BALOON8_DIMS.length * 0.22, scale);
  const segs = mobile ? 8 : 12;

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(radius, scaledDim(0.07, scale), segs, mobile ? 24 : 36),
    new THREE.MeshPhysicalMaterial({
      color: 0xe8f4ff,
      metalness: 0.15,
      roughness: 0.08,
      transparent: true,
      opacity: 0.42,
      transmission: 0.55,
      thickness: scaledDim(0.04, scale),
      clearcoat: 0.9,
      envMapIntensity: 1.4,
    }),
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius * 0.78,
      radius * 0.78,
      scaledDim(0.05, scale),
      mobile ? 16 : 24,
    ),
    new THREE.MeshPhysicalMaterial({
      color: 0xd0e4f8,
      metalness: 0.88,
      roughness: 0.12,
      transparent: true,
      opacity: 0.5,
      transmission: 0.4,
    }),
  );
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.52, mobile ? 16 : 24),
    new THREE.MeshStandardMaterial({
      map: hubcapTexture(),
      metalness: 0.72,
      roughness: 0.2,
      envMapIntensity: 1.3,
    }),
  );
  hub.rotation.y = Math.PI / 2;
  hub.position.x = scaledDim(0.035, scale) * xSign;
  wheel.add(hub);

  wheel.position.set(x, y, zSign * scaledDim(BALOON8_DIMS.width * 0.38, scale));
  wheel.frustumCulled = false;
  return wheel;
}

function createExhaustRow(L: number, W: number, scale: number, mobile: boolean): THREE.Group {
  const row = new THREE.Group();
  const pipeR = scaledDim(0.038, scale);
  const pipeLen = scaledDim(0.1, scale);
  const spacing = scaledDim(0.095, scale);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xc8d4dc,
    metalness: 0.94,
    roughness: 0.14,
    clearcoat: 0.85,
    envMapIntensity: 1.5,
  });
  for (let i = 0; i < 6; i++) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(pipeR, pipeR, pipeLen, mobile ? 6 : 10),
      mat,
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set((i - 2.5) * spacing, scaledDim(0.1, scale), W * 0.44);
    row.add(pipe);
  }
  row.position.set(-L / 2 - scaledDim(0.02, scale), 0, 0);
  row.frustumCulled = false;
  return row;
}

function createGlowLight(color: number, intensity: number, scale: number): THREE.Mesh {
  const r = scaledDim(0.05, scale);
  return new THREE.Mesh(
    new THREE.SphereGeometry(r, 10, 10),
    new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      metalness: 0.35,
      roughness: 0.18,
      transparent: true,
      opacity: 0.92,
    }),
  );
}

export type Baloon8ShoeCore = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh | null;
  hullMat: THREE.MeshPhysicalMaterial;
  glowMeshes: THREE.Mesh[];
  wheels: THREE.Group[];
  disposables: Array<{ dispose: () => void }>;
};

export type Baloon8WalkerShoe = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh | null;
  hullMat: THREE.MeshPhysicalMaterial;
  glowMeshes: THREE.Mesh[];
  wheels: THREE.Group[];
};

export type Baloon8ShoeModel = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh | null;
  glowMeshes: THREE.Mesh[];
  dispose: () => void;
};

function assembleFromBlueprint(
  blueprint: THREE.Texture,
  bubbleCount: number,
  scale = BALOON8_SCENE_SCALE,
  opts?: { legacyPanels?: boolean; mobile?: boolean; bubbleOverlay?: number },
): Baloon8ShoeCore {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];

  let prepared: ReturnType<typeof prepareBlueprint> | null = null;
  if (!opts?.legacyPanels) {
    try {
      const img = blueprint.image as CanvasImageSource & { width?: number };
      if (img && ("naturalWidth" in img ? img.naturalWidth : img.width)) {
        prepared = prepareBlueprint(blueprint);
      }
    } catch (err) {
      console.warn("[Baloon8] prepareBlueprint failed, using UV crops", err);
    }
  }

  const L = scaledDim(BALOON8_DIMS.length, scale);
  const W = scaledDim(BALOON8_DIMS.width, scale);
  const H = scaledDim(BALOON8_DIMS.height, scale);

  const body = new THREE.Group();

  const side = panelForQuadrant(blueprint, prepared?.side ?? null, "side", L, H);
  side.position.set(0, H / 2, W / 2 + 0.003);
  body.add(side);

  const sideBack = panelForQuadrant(blueprint, prepared?.side ?? null, "side", L, H);
  sideBack.position.set(0, H / 2, -W / 2 - 0.003);
  sideBack.rotation.y = Math.PI;
  body.add(sideBack);

  const front = panelForQuadrant(blueprint, prepared?.front ?? null, "front", W, H, {
    emissive: 0x28c060,
    intensity: 0.55,
  });
  front.position.set(L / 2 + 0.003, H / 2, 0);
  front.rotation.y = Math.PI / 2;
  body.add(front);

  const rear = panelForQuadrant(blueprint, prepared?.rear ?? null, "rear", W, H, {
    emissive: 0x1a4030,
    intensity: 0.22,
  });
  rear.position.set(-L / 2 - 0.003, H / 2, 0);
  rear.rotation.y = -Math.PI / 2;
  body.add(rear);

  const top = panelForQuadrant(blueprint, prepared?.top ?? null, "top", L, W);
  top.position.set(0, H + 0.003, 0);
  top.rotation.x = -Math.PI / 2;
  body.add(top);

  root.add(body);

  const mobile = opts?.mobile ?? false;
  const overlayOpacity = opts?.bubbleOverlay ?? (mobile ? 0.28 : 0.38);

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a6080,
    metalness: 0.82,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.88,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [150, 900],
    envMapIntensity: 1.5,
  });
  disposables.push(hullMat);

  const bubbles = createBubbleInstances(L, H, W, bubbleCount, scale, overlayOpacity);
  if (bubbles) {
    root.add(bubbles);
    disposables.push(bubbles.geometry, bubbles.material as THREE.Material);
  }

  const wheels = [
    createWheel(1, 1, scale, mobile),
    createWheel(1, -1, scale, mobile),
    createWheel(-1, 1, scale, mobile),
    createWheel(-1, -1, scale, mobile),
  ];
  for (const w of wheels) root.add(w);

  const exhaust = createExhaustRow(L, W, scale, mobile);
  root.add(exhaust);

  const headL = createGlowLight(0x5ec8a8, 1.4, scale);
  headL.position.set(L / 2 + scaledDim(0.02, scale), H * 0.72, W * 0.46);
  body.add(headL);

  const headR = createGlowLight(0x5ec8a8, 1.4, scale);
  headR.position.set(L / 2 + scaledDim(0.02, scale), H * 0.72, -W * 0.46);
  body.add(headR);

  const tailL = createGlowLight(0x4a98c8, 1.2, scale);
  tailL.position.set(-L / 2 - scaledDim(0.02, scale), H * 0.68, W * 0.42);
  body.add(tailL);

  const tailR = createGlowLight(0x4a98c8, 1.2, scale);
  tailR.position.set(-L / 2 - scaledDim(0.02, scale), H * 0.68, -W * 0.42);
  body.add(tailR);

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = false;
      const mat = obj.material as THREE.MeshStandardMaterial;
      if ((mat.emissiveIntensity ?? 0) > 0.35) glowMeshes.push(obj);
    }
  });

  return { root, bubbles, hullMat, glowMeshes, wheels, disposables };
}

export function buildBaloon8Shoe(blueprint: THREE.Texture, bubbleCount = 1200): Baloon8ShoeModel {
  const core = assembleFromBlueprint(blueprint, bubbleCount, BALOON8_SCENE_SCALE, {
    bubbleOverlay: 0.42,
  });
  core.root.position.y = scaledDim(0.02);

  return {
    root: core.root,
    bubbles: core.bubbles,
    glowMeshes: core.glowMeshes,
    dispose: () => {
      core.disposables.forEach((d) => d.dispose());
      core.root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            const std = m as THREE.MeshStandardMaterial;
            if (std.map && std.map !== blueprint) std.map.dispose();
            if (std.alphaMap) std.alphaMap.dispose();
            m.dispose();
          });
          obj.geometry.dispose();
        }
      });
    },
  };
}

export function ensureBaloon8RunnerVisible(shoe: Baloon8WalkerShoe, mobile: boolean): void {
  shoe.root.frustumCulled = false;
  if (shoe.bubbles) {
    shoe.bubbles.frustumCulled = false;
    const bubbleMat = shoe.bubbles.material as THREE.MeshPhysicalMaterial;
    bubbleMat.opacity = mobile ? 0.28 : 0.38;
  }

  shoe.hullMat.emissive = new THREE.Color(0x142830);
  shoe.hullMat.emissiveIntensity = mobile ? 0.22 : 0.28;

  shoe.root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshPhysicalMaterial;
    if (mat.map) {
      mat.envMapIntensity = mobile ? 1.75 : 1.85;
      if (mat.iridescence !== undefined && mat.iridescence < 0.5) {
        mat.iridescence = 0.68;
        mat.iridescenceIOR = 1.32;
      }
    }
    if (mobile && mat.alphaTest !== undefined) {
      mat.alphaTest = 0.02;
    }
  });

  for (const mesh of shoe.glowMeshes) {
    mesh.frustumCulled = false;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, mobile ? 1.25 : 1.1);
  }
}

export function buildBaloon8RunnerShoe(
  blueprint: THREE.Texture,
  bubbleCount = 160,
  opts?: { mobile?: boolean; portrait?: boolean; pair?: boolean; mirror?: boolean },
): Baloon8WalkerShoe {
  const mobile = opts?.mobile ?? false;
  const portrait = opts?.portrait ?? false;
  const pair = opts?.pair ?? false;
  const scale = pair
    ? portrait
      ? BALOON8_PAIR_SCALE_PORTRAIT
      : mobile
        ? BALOON8_PAIR_SCALE_MOBILE
        : BALOON8_PAIR_SCALE
    : mobile
      ? BALOON8_WALKER_SCALE_MOBILE
      : BALOON8_WALKER_SCALE;
  const perShoeCap = mobile ? (pair ? 70 : 100) : bubbleCount;
  const count = Math.min(bubbleCount, perShoeCap);
  const core = assembleFromBlueprint(blueprint, count, scale, {
    mobile,
    bubbleOverlay: mobile ? 0.26 : 0.34,
  });
  core.root.rotation.y = -Math.PI / 2;

  const mount = new THREE.Group();
  mount.add(core.root);
  mount.position.y = scaledDim(0.04, scale);
  mount.frustumCulled = false;
  if (opts?.mirror) {
    mount.scale.x = -1;
  }

  const shoe: Baloon8WalkerShoe = {
    root: mount,
    bubbles: core.bubbles,
    hullMat: core.hullMat,
    glowMeshes: core.glowMeshes,
    wheels: core.wheels,
  };
  ensureBaloon8RunnerVisible(shoe, mobile);
  return shoe;
}

/** @deprecated */
export function buildBaloon8WalkerShoe(
  blueprint: THREE.Texture,
  _side: -1 | 1,
  bubbleCount = 160,
): Baloon8WalkerShoe {
  return buildBaloon8RunnerShoe(blueprint, bubbleCount);
}

export { BALOON8_BLUEPRINT_URL };
