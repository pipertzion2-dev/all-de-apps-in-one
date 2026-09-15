/**
 * Procedural 3D Baloon8 car-shoe — volumetric puffer body matching the user's
 * hero reference (abalone metallic pods, green grille, claw feet, disc wheels,
 * ornate rear crest). One car → mirrored pair for Clean Sneaks runner.
 */
import * as THREE from "three";

/** Real-world mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

const ABALONE = [0x1a6650, 0x2a8090, 0x3a5080, 0x5a3888, 0x2a9878, 0x6a48a0, 0x4cc9c0];

export type Baloon8CarBuild = {
  root: THREE.Group;
  puffer: THREE.InstancedMesh | null;
  hullMat: THREE.MeshPhysicalMaterial;
  glowMeshes: THREE.Mesh[];
  wheels: THREE.Group[];
  disposables: Array<{ dispose: () => void }>;
};

export type Baloon8CarOptions = {
  scale: number;
  mobile?: boolean;
  portrait?: boolean;
  podBudget?: number;
};

function s(value: number, scale: number): number {
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
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function drawEbLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#ffffff";
  ctx.font = `italic bold ${size}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("e", -size * 0.18, -size * 0.05);
  ctx.fillText("B", size * 0.12, -size * 0.05);
  ctx.font = `600 ${size * 0.16}px monospace`;
  ctx.fillStyle = "#dce8f0";
  ctx.fillText("i6Pw", 0, size * 0.38);
  ctx.restore();
}

function hubcapTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.48);
    g.addColorStop(0, "#f4faff");
    g.addColorStop(0.55, "#c0d4e8");
    g.addColorStop(1, "#7894ac");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
    ctx.fill();
    drawEbLogo(ctx, w / 2, h / 2, w * 0.24);
  });
}

function grilleTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 640, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#1a9850");
    bg.addColorStop(0.5, "#28c868");
    bg.addColorStop(1, "#148040");
    ctx.fillStyle = bg;
    ctx.fillRect(w * 0.12, h * 0.08, w * 0.76, h * 0.84);

    ctx.strokeStyle = "#eef8ff";
    ctx.lineWidth = w * 0.018;
    const pad = w * 0.1;
    ctx.strokeRect(pad, h * 0.06, w - pad * 2, h * 0.88);
    ctx.strokeRect(pad + w * 0.04, h * 0.1, w - (pad + w * 0.04) * 2, h * 0.8);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const cx = w / 2 + Math.cos(a) * w * 0.38;
      const cy = h / 2 + Math.sin(a) * h * 0.38;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.04, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawEbLogo(ctx, w / 2, h / 2, w * 0.22);
  });
}

function crestTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#d8e8f4";
    ctx.lineWidth = w * 0.022;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.85);
    ctx.lineTo(w * 0.08, h * 0.5);
    ctx.quadraticCurveTo(w * 0.05, h * 0.15, w * 0.5, h * 0.08);
    ctx.quadraticCurveTo(w * 0.95, h * 0.15, w * 0.92, h * 0.5);
    ctx.lineTo(w * 0.85, h * 0.85);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeRect(w * 0.22, h * 0.22, w * 0.56, h * 0.56);
    drawEbLogo(ctx, w / 2, h / 2, w * 0.2);
  });
}

function abaloneMat(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.94,
    roughness: 0.11,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 1,
    iridescenceIOR: 1.36,
    iridescenceThicknessRange: [100, 880],
    envMapIntensity: 1.8,
  });
}

/** Coupe silhouette half-width at normalized height 0..1 and length position -1..1. */
function bodyRadiusAt(xNorm: number, yNorm: number): number {
  const lengthT = (xNorm + 1) / 2;
  const nose = Math.exp(-Math.pow((lengthT - 0.92) / 0.12, 2));
  const tail = Math.exp(-Math.pow((lengthT - 0.06) / 0.14, 2));
  const belt = Math.sin(lengthT * Math.PI) * 0.85 + 0.15;
  const heightBulge = Math.sin(yNorm * Math.PI) * 0.92 + 0.08;
  const waist = 1 - 0.22 * Math.pow(Math.abs(lengthT - 0.48), 1.4);
  return belt * heightBulge * waist * (0.55 + nose * 0.25 + tail * 0.2);
}

function createPufferShell(scale: number, budget: number, mobile: boolean): THREE.InstancedMesh {
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const rows = mobile ? 14 : 24;
  const maxCols = mobile ? 22 : 36;
  const geo = new THREE.SphereGeometry(s(0.028, scale), mobile ? 6 : 8, mobile ? 6 : 8);
  const mat = abaloneMat();
  const mesh = new THREE.InstancedMesh(geo, mat, budget);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let idx = 0;

  for (let row = 0; row < rows && idx < budget; row++) {
    const yNorm = row / Math.max(1, rows - 1);
    const y = s(0.06, scale) + yNorm * H * 0.94;
    const cols = Math.floor(maxCols * (0.55 + 0.45 * Math.sin(yNorm * Math.PI)));
    for (let col = 0; col < cols && idx < budget; col++) {
      const u = col / Math.max(1, cols - 1);
      const xNorm = u * 2 - 1;
      const rad = bodyRadiusAt(xNorm, yNorm);
      if (rad < 0.12) continue;

      const x = xNorm * L * 0.48;
      const halfW = rad * W * 0.48;
      const pod = s(0.022, scale) * (0.75 + ((row * 7 + col * 3) % 10) / 22);

      for (const side of [-1, 1] as const) {
        if (idx >= budget) break;
        const z = side * halfW * (0.92 + ((row + col) % 4) * 0.02);
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(pod / s(0.028, scale));
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        color.setHex(ABALONE[(row + col + (side > 0 ? 0 : 3)) % ABALONE.length]!);
        mesh.setColorAt(idx, color);
        idx++;
      }
    }
  }

  mesh.count = idx;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

function createGrille(scale: number, mobile: boolean): THREE.Group {
  const g = new THREE.Group();
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const L = s(BALOON8_DIMS.length, scale);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(s(0.04, scale), H * 0.55, W * 0.62),
    new THREE.MeshPhysicalMaterial({
      map: grilleTexture(),
      emissive: new THREE.Color(0x28c060),
      emissiveIntensity: mobile ? 1.1 : 1.45,
      metalness: 0.35,
      roughness: 0.25,
      envMapIntensity: 1.2,
    }),
  );
  frame.position.set(L * 0.48, H * 0.48, 0);
  g.add(frame);
  return g;
}

function createClawFoot(scale: number, zSign: number, mobile: boolean): THREE.Group {
  const foot = new THREE.Group();
  const mat = abaloneMat();
  const toeCount = mobile ? 4 : 5;
  const spread = s(0.09, scale);
  const baseX = s(BALOON8_DIMS.length, scale) * 0.42;
  const baseY = s(0.05, scale);
  const baseZ = zSign * s(BALOON8_DIMS.width, scale) * 0.34;

  for (let i = 0; i < toeCount; i++) {
    const t = (i - (toeCount - 1) / 2) / (toeCount - 1);
    const toe = new THREE.Mesh(
      new THREE.CapsuleGeometry(s(0.035, scale), s(0.09, scale), mobile ? 4 : 6, 8),
      mat.clone(),
    );
    toe.rotation.z = -Math.PI / 2 + t * 0.35;
    toe.rotation.y = t * 0.25;
    toe.position.set(baseX + s(0.04, scale), baseY + s(0.02, scale), baseZ + t * spread);
    foot.add(toe);
  }

  const palm = new THREE.Mesh(
    new THREE.SphereGeometry(s(0.07, scale), mobile ? 8 : 12, mobile ? 8 : 12),
    mat.clone(),
  );
  palm.position.set(baseX - s(0.02, scale), baseY + s(0.04, scale), baseZ);
  foot.add(palm);
  foot.frustumCulled = false;
  return foot;
}

function createDiscWheel(
  scale: number,
  xNorm: number,
  zSign: number,
  mobile: boolean,
): THREE.Group {
  const wheel = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const r = s(0.32, scale);
  const segs = mobile ? 8 : 12;

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(r, s(0.055, scale), segs, mobile ? 24 : 36),
    new THREE.MeshPhysicalMaterial({
      color: 0x101820,
      metalness: 0.6,
      roughness: 0.45,
      clearcoat: 0.4,
    }),
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.88, r * 0.88, s(0.025, scale), mobile ? 20 : 32),
    new THREE.MeshPhysicalMaterial({
      map: hubcapTexture(),
      metalness: 0.92,
      roughness: 0.1,
      envMapIntensity: 1.6,
    }),
  );
  disc.rotation.z = Math.PI / 2;
  wheel.add(disc);

  wheel.position.set(xNorm * L * 0.48, s(0.32, scale), zSign * W * 0.44);
  wheel.frustumCulled = false;
  return wheel;
}

function createRearCrest(scale: number, mobile: boolean): THREE.Group {
  const crest = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const W = s(BALOON8_DIMS.width, scale);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.55, H * 0.55),
    new THREE.MeshPhysicalMaterial({
      map: crestTexture(),
      transparent: true,
      metalness: 0.75,
      roughness: 0.2,
      emissive: new THREE.Color(0x304860),
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
      envMapIntensity: 1.4,
    }),
  );
  plate.position.set(-L * 0.46, H * 1.05, 0);
  plate.rotation.y = Math.PI / 2;
  crest.add(plate);

  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.38, s(0.08, scale)),
    new THREE.MeshPhysicalMaterial({
      color: 0xc8e8c8,
      emissive: new THREE.Color(0x208040),
      emissiveIntensity: 0.25,
      metalness: 0.4,
      roughness: 0.35,
    }),
  );
  badge.position.set(-L * 0.49, H * 0.42, 0);
  badge.rotation.y = Math.PI / 2;
  crest.add(badge);
  crest.frustumCulled = false;
  return crest;
}

function createCabin(scale: number): THREE.Group {
  const cabin = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(L * 0.38, H * 0.22, W * 0.52),
    new THREE.MeshPhysicalMaterial({
      color: 0x0a1018,
      metalness: 0.85,
      roughness: 0.08,
      transparent: true,
      opacity: 0.72,
      transmission: 0.35,
      thickness: s(0.02, scale),
    }),
  );
  glass.position.set(-L * 0.02, H * 0.82, 0);
  cabin.add(glass);

  const footwell = new THREE.Mesh(
    new THREE.BoxGeometry(L * 0.32, s(0.04, scale), W * 0.42),
    new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 }),
  );
  footwell.position.set(-L * 0.04, H * 0.96, 0);
  cabin.add(footwell);
  return cabin;
}

function createMirror(scale: number, zSign: number): THREE.Group {
  const m = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const mat = abaloneMat();

  const stalk = new THREE.Mesh(
    new THREE.CapsuleGeometry(s(0.018, scale), s(0.06, scale), 4, 6),
    mat.clone(),
  );
  stalk.position.set(L * 0.08, H * 0.72, zSign * W * 0.52);
  m.add(stalk);

  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(s(0.045, scale), 8, 8),
    new THREE.MeshPhysicalMaterial({
      color: 0x88a8c0,
      metalness: 0.9,
      roughness: 0.12,
      clearcoat: 1,
    }),
  );
  glass.position.set(L * 0.1, H * 0.76, zSign * W * 0.56);
  m.add(glass);
  return m;
}

function createExhaustRow(scale: number, mobile: boolean): THREE.Group {
  const row = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xc8d4dc,
    metalness: 0.94,
    roughness: 0.14,
    clearcoat: 0.85,
  });
  for (let i = 0; i < 6; i++) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(s(0.032, scale), s(0.032, scale), s(0.09, scale), mobile ? 6 : 10),
      mat,
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(-L * 0.48, s(0.1, scale), (i - 2.5) * s(0.088, scale));
    row.add(pipe);
  }
  row.frustumCulled = false;
  return row;
}

/** Build one full Baloon8 car-shoe in local space (+X front, +Y up, +Z left). */
export function buildBaloon8Car(opts: Baloon8CarOptions): Baloon8CarBuild {
  const { scale, mobile = false, portrait = false } = opts;
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];
  const wheels: THREE.Group[] = [];

  const podBudget = opts.podBudget ?? (mobile ? (portrait ? 320 : 420) : portrait ? 520 : 900);

  const puffer = createPufferShell(scale, podBudget, mobile);
  root.add(puffer);
  disposables.push(puffer.geometry);
  const pufferMat = puffer.material;
  if (Array.isArray(pufferMat)) pufferMat.forEach((m) => disposables.push(m));
  else disposables.push(pufferMat);

  root.add(createGrille(scale, mobile));
  root.add(createClawFoot(scale, 1, mobile));
  root.add(createClawFoot(scale, -1, mobile));

  const wheelFL = createDiscWheel(scale, 0.22, 1, mobile);
  const wheelRL = createDiscWheel(scale, -0.28, 1, mobile);
  wheels.push(wheelFL, wheelRL);
  root.add(wheelFL);
  root.add(createDiscWheel(scale, 0.22, -1, mobile));
  root.add(createDiscWheel(scale, -0.28, -1, mobile));

  root.add(createRearCrest(scale, mobile));
  root.add(createCabin(scale));
  root.add(createMirror(scale, 1));
  root.add(createMirror(scale, -1));
  root.add(createExhaustRow(scale, mobile));

  const hullMat = abaloneMat();
  disposables.push(hullMat);

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshStandardMaterial;
    if ((mat.emissiveIntensity ?? 0) > 0.3) glowMeshes.push(obj);
  });

  return { root, puffer, hullMat, glowMeshes, wheels, disposables };
}

export function disposeBaloon8Car(build: Baloon8CarBuild): void {
  build.disposables.forEach((d) => d.dispose());
  build.root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        if (std.map) std.map.dispose();
        m.dispose();
      });
      obj.geometry.dispose();
    }
  });
}
