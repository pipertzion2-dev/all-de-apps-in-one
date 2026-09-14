import * as THREE from "three";
import {
  BALOON8_BLUEPRINT_URL,
  cropBlueprintTexture,
  type Baloon8BlueprintQuadrant,
} from "./baloon8-textures";

/** Real-world mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

export const BALOON8_SCENE_SCALE = 0.42;
/** Runner fill-frame scale (~1.6 m long). Homepage viewer uses BALOON8_SCENE_SCALE (0.42). */
export const BALOON8_WALKER_SCALE = 0.36;
export const BALOON8_WALKER_SCALE_MOBILE = 0.32;

const IRIDESCENCE = [0x2a9d8f, 0x5b8da8, 0x7b4397, 0x3d9970, 0x4cc9c0];

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

function drawBLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#ffffff";
  ctx.font = `italic ${size}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("B", 0, -size * 0.05);
  ctx.font = `600 ${size * 0.18}px monospace`;
  ctx.fillText("i6Pw", 0, size * 0.42);
  ctx.restore();
}

function hubcapTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.48);
    g.addColorStop(0, "#eef6ff");
    g.addColorStop(0.55, "#c8d8e8");
    g.addColorStop(1, "#8aa4bc");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
    ctx.fill();
    drawBLogo(ctx, w / 2, h / 2, w * 0.28);
  });
}

function blueprintPanel(
  blueprint: THREE.Texture,
  quadrant: Baloon8BlueprintQuadrant,
  w: number,
  h: number,
): THREE.Mesh {
  const tex = cropBlueprintTexture(blueprint, quadrant);
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.02,
    metalness: 0.35,
    roughness: 0.45,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

function createBubbleInstances(
  width: number,
  height: number,
  depth: number,
  count: number,
  scaleMul = 1,
): THREE.InstancedMesh {
  const bubbleGeo = new THREE.SphereGeometry(0.022 * scaleMul, 8, 8);
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.95,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [100, 800],
    envMapIntensity: 1.6,
    transparent: true,
    opacity: 0.85,
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
  return mesh;
}

function createWheel(xSign: number, zSign: number, scale = BALOON8_SCENE_SCALE): THREE.Group {
  const wheel = new THREE.Group();
  const radius = scaledDim(0.34, scale);
  const y = scaledDim(0.34, scale);
  const x = xSign * scaledDim(BALOON8_DIMS.length * 0.22, scale);

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(radius, scaledDim(0.07, scale), 12, 36),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a2530,
      metalness: 0.4,
      roughness: 0.65,
      transparent: true,
      opacity: 0.9,
    }),
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, scaledDim(0.06, scale), 24),
    new THREE.MeshPhysicalMaterial({
      color: 0xd8e8f8,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.55,
      transmission: 0.35,
    }),
  );
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.55, 24),
    new THREE.MeshStandardMaterial({ map: hubcapTexture(), metalness: 0.6, roughness: 0.25 }),
  );
  hub.rotation.y = Math.PI / 2;
  hub.position.x = scaledDim(0.04, scale);
  wheel.add(hub);

  wheel.position.set(x, y, zSign * scaledDim(BALOON8_DIMS.width * 0.38, scale));
  return wheel;
}

export type Baloon8ShoeCore = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh;
  hullMat: THREE.MeshPhysicalMaterial;
  glowMeshes: THREE.Mesh[];
  wheels: THREE.Group[];
  disposables: Array<{ dispose: () => void }>;
};

export type Baloon8WalkerShoe = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh;
  hullMat: THREE.MeshPhysicalMaterial;
  glowMeshes: THREE.Mesh[];
  wheels: THREE.Group[];
};

export type Baloon8ShoeModel = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh;
  glowMeshes: THREE.Mesh[];
  dispose: () => void;
};

function assembleFromBlueprint(
  blueprint: THREE.Texture,
  bubbleCount: number,
  scale = BALOON8_SCENE_SCALE,
): Baloon8ShoeCore {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const L = scaledDim(BALOON8_DIMS.length, scale);
  const W = scaledDim(BALOON8_DIMS.width, scale);
  const H = scaledDim(BALOON8_DIMS.height, scale);

  const body = new THREE.Group();

  const sidePanel = blueprintPanel(blueprint, "side", L, H);
  sidePanel.position.set(0, H / 2, W / 2 + 0.002);
  body.add(sidePanel);

  const sidePanelBack = blueprintPanel(blueprint, "side", L, H);
  sidePanelBack.position.set(0, H / 2, -W / 2 - 0.002);
  sidePanelBack.rotation.y = Math.PI;
  body.add(sidePanelBack);

  const frontPanel = blueprintPanel(blueprint, "front", W, H);
  frontPanel.position.set(L / 2 + 0.002, H / 2, 0);
  frontPanel.rotation.y = Math.PI / 2;
  body.add(frontPanel);

  const rearPanel = blueprintPanel(blueprint, "rear", W, H);
  rearPanel.position.set(-L / 2 - 0.002, H / 2, 0);
  rearPanel.rotation.y = -Math.PI / 2;
  body.add(rearPanel);

  const topPanel = blueprintPanel(blueprint, "top", L, W);
  topPanel.position.set(0, H + 0.002, 0);
  topPanel.rotation.x = -Math.PI / 2;
  body.add(topPanel);

  root.add(body);

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a6080,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    iridescence: 0.85,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [200, 900],
    envMapIntensity: 1.4,
  });
  disposables.push(hullMat);

  const bubbles = createBubbleInstances(L, H, W, bubbleCount, scale);
  root.add(bubbles);
  disposables.push(bubbles.geometry, bubbles.material as THREE.Material);

  const wheels = [
    createWheel(1, 1, scale),
    createWheel(1, -1, scale),
    createWheel(-1, 1, scale),
    createWheel(-1, -1, scale),
  ];
  for (const w of wheels) root.add(w);

  const glowMeshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity && mat.emissiveIntensity > 0.5) glowMeshes.push(obj);
    }
  });

  return { root, bubbles, hullMat, glowMeshes, wheels, disposables };
}

/** Homepage / orbit viewer — user's four-view mockup as textured panels. */
export function buildBaloon8Shoe(blueprint: THREE.Texture, bubbleCount = 1600): Baloon8ShoeModel {
  const core = assembleFromBlueprint(blueprint, bubbleCount);
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
            m.dispose();
          });
          obj.geometry.dispose();
        }
      });
    },
  };
}

/** Keep blueprint panels + bubbles readable on dark asphalt (especially mobile). */
export function ensureBaloon8RunnerVisible(shoe: Baloon8WalkerShoe, mobile: boolean): void {
  shoe.root.frustumCulled = false;
  shoe.bubbles.frustumCulled = false;

  shoe.hullMat.color.setHex(0x3a7898);
  shoe.hullMat.iridescence = mobile ? 0.35 : 0.65;
  shoe.hullMat.envMapIntensity = mobile ? 0.9 : 1.35;
  shoe.hullMat.emissive = new THREE.Color(0x286080);
  shoe.hullMat.emissiveIntensity = mobile ? 0.65 : 0.45;

  const bubbleMat = shoe.bubbles.material as THREE.MeshPhysicalMaterial;
  bubbleMat.iridescence = mobile ? 0.4 : 0.85;
  bubbleMat.envMapIntensity = mobile ? 0.95 : 1.5;
  bubbleMat.emissive = new THREE.Color(0x1a3040);
  bubbleMat.emissiveIntensity = mobile ? 0.35 : 0.2;

  for (const mesh of shoe.glowMeshes) {
    mesh.frustumCulled = false;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, 1.1);
  }
}

/** In-game Temple Run player — same Baloon8 blueprint, scaled for sideline camera. */
export function buildBaloon8RunnerShoe(
  blueprint: THREE.Texture,
  bubbleCount = 900,
  opts?: { mobile?: boolean },
): Baloon8WalkerShoe {
  const mobile = opts?.mobile ?? false;
  const scale = mobile ? BALOON8_WALKER_SCALE_MOBILE : BALOON8_WALKER_SCALE;
  const core = assembleFromBlueprint(blueprint, bubbleCount, scale);
  core.root.rotation.y = -Math.PI / 2;

  const mount = new THREE.Group();
  mount.add(core.root);
  mount.position.y = scaledDim(0.02, scale);
  mount.frustumCulled = false;

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
  bubbleCount = 900,
): Baloon8WalkerShoe {
  return buildBaloon8RunnerShoe(blueprint, bubbleCount);
}

export { BALOON8_BLUEPRINT_URL };
