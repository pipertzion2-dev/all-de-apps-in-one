/**
 * Procedural 3D Baloon8 puffer coupe — volumetric quilted pods matching the
 * Tripo / hero references: dark iridescent abalone body, neon-green ornate
 * grille, chrome disc wheels with logo, claw feet, rear crest.
 * Real mesh geometry — not a presence-image thumbnail.
 */
import * as THREE from "three";

/** Real-world mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

/** Dark iridescent abalone / hematite palette from Tripo + hero refs. */
const ABALONE = [
  0x1a1e28, 0x2a3040, 0x1a4858, 0x2a6878, 0x3a4080, 0x4a2888, 0x1a8068, 0x5a48a0, 0x2a9878,
  0x4cc9c0,
];

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

/** Stacked stylized eB monogram from the references. */
function drawEbLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill = "#f4f8fc",
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fill;
  ctx.font = `italic 900 ${size * 0.72}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("e", -size * 0.12, -size * 0.22);
  ctx.fillText("B", size * 0.1, size * 0.08);
  ctx.font = `600 ${size * 0.16}px monospace`;
  ctx.fillStyle = fill === "#f4f8fc" ? "#d0dce8" : "#1a2030";
  ctx.fillText("i6Pw", 0, size * 0.42);
  ctx.restore();
}

function hubcapTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.48);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.45, "#e8eef4");
    g.addColorStop(0.85, "#b8c4d0");
    g.addColorStop(1, "#8898a8");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#a0aebc";
    ctx.lineWidth = w * 0.014;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    drawEbLogo(ctx, w / 2, h / 2, w * 0.36, "#0a1018");
  });
}

function grilleTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 640, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#18a050");
    bg.addColorStop(0.4, "#36f078");
    bg.addColorStop(0.7, "#22d060");
    bg.addColorStop(1, "#108040");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55);
    glow.addColorStop(0, "rgba(180,255,200,0.45)");
    glow.addColorStop(1, "rgba(20,120,60,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#f0fff4";
    ctx.lineWidth = w * 0.018;
    const pad = w * 0.09;
    ctx.strokeRect(pad, h * 0.06, w - pad * 2, h * 0.88);
    ctx.strokeRect(pad + w * 0.05, h * 0.1, w - (pad + w * 0.05) * 2, h * 0.8);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const cx = w / 2 + Math.cos(a) * w * 0.36;
      const cy = h / 2 + Math.sin(a) * h * 0.36;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.045, 0, Math.PI * 2);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h * 0.48;
    const r = w * 0.2;
    ctx.fillStyle = "#f6faf8";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0a2010";
    ctx.lineWidth = w * 0.01;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.85);
    ctx.quadraticCurveTo(cx + r * 0.85, cy - r * 0.3, cx + r * 0.7, cy + r * 0.35);
    ctx.lineTo(cx, cy + r * 0.9);
    ctx.lineTo(cx - r * 0.7, cy + r * 0.35);
    ctx.quadraticCurveTo(cx - r * 0.85, cy - r * 0.3, cx, cy - r * 0.85);
    ctx.closePath();
    ctx.strokeStyle = "#1a3028";
    ctx.lineWidth = w * 0.012;
    ctx.stroke();

    drawEbLogo(ctx, cx, cy, w * 0.26, "#0a1810");
  });
}

function crestTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "#d8e8f4";
    ctx.lineWidth = w * 0.024;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.85);
    ctx.lineTo(w * 0.08, h * 0.5);
    ctx.quadraticCurveTo(w * 0.05, h * 0.15, w * 0.5, h * 0.08);
    ctx.quadraticCurveTo(w * 0.95, h * 0.15, w * 0.92, h * 0.5);
    ctx.lineTo(w * 0.85, h * 0.85);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "rgba(244,248,252,0.92)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.48, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a2430";
    ctx.lineWidth = w * 0.012;
    ctx.stroke();

    ctx.strokeStyle = "#e8f0f8";
    ctx.lineWidth = w * 0.016;
    ctx.beginPath();
    ctx.arc(w * 0.38, h * 0.12, w * 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.12, w * 0.08, 0, Math.PI * 2);
    ctx.stroke();

    drawEbLogo(ctx, w / 2, h * 0.48, w * 0.28, "#0a1018");
  });
}

function abaloneMat(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.92,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [120, 920],
    envMapIntensity: 1.75,
  });
}

/**
 * Luxury coupe half-width at normalized length (-1 rear .. +1 nose)
 * and height (0 belly .. 1 roof). Window band returns smaller radius.
 */
function bodyRadiusAt(xNorm: number, yNorm: number): { rad: number; windowCut: boolean } {
  const lengthT = (xNorm + 1) / 2;
  const nose = Math.exp(-Math.pow((lengthT - 0.9) / 0.11, 2));
  const tail = Math.exp(-Math.pow((lengthT - 0.08) / 0.13, 2));
  const belt = 0.55 + 0.45 * Math.sin(lengthT * Math.PI);
  const heightBulge = 0.18 + 0.82 * Math.sin(Math.min(1, yNorm * 1.05) * Math.PI);
  const waist = 1 - 0.16 * Math.pow(Math.abs(lengthT - 0.45), 1.35);
  let rad = belt * heightBulge * waist * (0.62 + nose * 0.22 + tail * 0.18);

  const inCabinX = lengthT > 0.28 && lengthT < 0.62;
  const inCabinY = yNorm > 0.52 && yNorm < 0.88;
  const windowCut = inCabinX && inCabinY;
  if (windowCut) rad *= 0.4;
  if (yNorm > 0.84) rad *= 0.9;

  return { rad, windowCut };
}

/** Quilted puffer shell — dense horizontal pill pods (Tripo quilt look). */
function createPufferShell(scale: number, budget: number, mobile: boolean): THREE.InstancedMesh {
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const rows = mobile ? 18 : 32;
  const maxCols = mobile ? 30 : 48;
  const geo = new THREE.SphereGeometry(s(0.034, scale), mobile ? 6 : 8, mobile ? 5 : 7);
  const mat = abaloneMat();
  const mesh = new THREE.InstancedMesh(geo, mat, budget);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let idx = 0;

  const place = (
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    colorHex: number,
  ): boolean => {
    if (idx >= budget) return false;
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(((idx * 17) % 7) * 0.03, ((idx * 11) % 5) * 0.04, ((idx * 7) % 6) * 0.03);
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
    color.setHex(colorHex);
    mesh.setColorAt(idx, color);
    idx++;
    return true;
  };

  // Side shell + mid rings so the body reads as a solid quilted coupe
  for (let row = 0; row < rows && idx < budget; row++) {
    const yNorm = row / Math.max(1, rows - 1);
    const y = s(0.04, scale) + yNorm * H * 0.97;
    const cols = Math.floor(maxCols * (0.6 + 0.4 * Math.sin(yNorm * Math.PI)));
    for (let col = 0; col < cols && idx < budget; col++) {
      const u = col / Math.max(1, cols - 1);
      const xNorm = u * 2 - 1;
      const { rad, windowCut } = bodyRadiusAt(xNorm, yNorm);
      if (rad < 0.1) continue;

      const x = xNorm * L * 0.48;
      const halfW = rad * W * 0.52;
      const base = (0.95 + ((row * 7 + col * 3) % 11) / 18) * (windowCut ? 0.55 : 1);
      const sx = base * 1.55;
      const sy = base * 0.78;
      const sz = base * 1.05;

      // Outer sides + staggered mid-depth pods (fills silhouette like Tripo)
      const depths = windowCut ? [0.96] : [0.98, 0.72, 0.42];
      for (const side of [-1, 1] as const) {
        for (const depth of depths) {
          if (idx >= budget) break;
          if (windowCut && depth < 0.9) continue;
          const z = side * halfW * depth * (0.96 + ((row + col) % 5) * 0.01);
          const hex =
            ABALONE[(row + col + (side > 0 ? 0 : 3) + Math.round(depth * 5)) % ABALONE.length]!;
          place(x, y, z, sx, sy, sz, hex);
        }
      }
    }
  }

  const topRows = mobile ? 8 : 14;
  const topCols = mobile ? 22 : 36;
  for (let r = 0; r < topRows && idx < budget; r++) {
    for (let c = 0; c < topCols && idx < budget; c++) {
      const u = c / Math.max(1, topCols - 1);
      const v = r / Math.max(1, topRows - 1);
      const xNorm = u * 2 - 1;
      const zNorm = (v - 0.5) * 2;
      const { rad, windowCut } = bodyRadiusAt(xNorm, 0.76 + v * 0.14);
      if (windowCut || rad < 0.18) continue;
      const x = xNorm * L * 0.47;
      const z = zNorm * rad * W * 0.46;
      const y = s(0.04, scale) + H * (0.76 + Math.sin(u * Math.PI) * 0.18);
      const base = 1.05 + (c % 4) * 0.06;
      place(x, y, z, base * 1.45, base * 0.75, base, ABALONE[(r * 3 + c) % ABALONE.length]!);
    }
  }

  const noseCount = mobile ? 60 : 110;
  for (let i = 0; i < noseCount && idx < budget; i++) {
    const a = (i / noseCount) * Math.PI * 2;
    const ring = 0.5 + (i % 4) * 0.14;
    const y = H * (0.22 + (i % 6) * 0.09);
    const z = Math.sin(a) * W * 0.3 * ring;
    const x = L * 0.47 + Math.cos(a) * s(0.05, scale);
    const base = 0.95 + (i % 4) * 0.06;
    place(x, y, z, base * 1.35, base * 0.75, base, ABALONE[i % ABALONE.length]!);
  }

  const rearCount = mobile ? 50 : 90;
  for (let i = 0; i < rearCount && idx < budget; i++) {
    const a = (i / rearCount) * Math.PI * 2;
    const y = H * (0.2 + (i % 7) * 0.09);
    const z = Math.sin(a) * W * 0.34;
    const x = -L * 0.47 + Math.cos(a) * s(0.04, scale);
    const base = 0.9 + (i % 5) * 0.06;
    place(x, y, z, base * 1.4, base * 0.75, base, ABALONE[(i + 3) % ABALONE.length]!);
  }

  mesh.count = idx;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createInnerHull(scale: number): THREE.Mesh {
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const hull = new THREE.Mesh(
    new THREE.CapsuleGeometry(W * 0.28, L * 0.55, 6, 12),
    new THREE.MeshStandardMaterial({
      color: 0x080a10,
      roughness: 0.9,
      metalness: 0.2,
    }),
  );
  hull.rotation.z = Math.PI / 2;
  hull.position.set(0, H * 0.42, 0);
  hull.scale.set(1, 0.85, 1.05);
  hull.frustumCulled = false;
  return hull;
}

function createGrille(scale: number, mobile: boolean): THREE.Group {
  const g = new THREE.Group();
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const L = s(BALOON8_DIMS.length, scale);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(s(0.05, scale), H * 0.55, W * 0.6),
    new THREE.MeshPhysicalMaterial({
      map: grilleTexture(),
      emissive: new THREE.Color(0x28e868),
      emissiveIntensity: mobile ? 1.55 : 2.1,
      metalness: 0.25,
      roughness: 0.22,
      envMapIntensity: 1.1,
    }),
  );
  frame.position.set(L * 0.485, H * 0.48, 0);
  g.add(frame);

  const glow = new THREE.PointLight(0x36f078, mobile ? 0.8 : 1.4, s(2.2, scale), 2);
  glow.position.set(L * 0.52, H * 0.48, 0);
  g.add(glow);

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
    const t = (i - (toeCount - 1) / 2) / Math.max(1, toeCount - 1);
    const toe = new THREE.Mesh(
      new THREE.CapsuleGeometry(s(0.032, scale), s(0.09, scale), mobile ? 4 : 6, 8),
      mat.clone(),
    );
    (toe.material as THREE.MeshPhysicalMaterial).color.setHex(ABALONE[(i + 2) % ABALONE.length]!);
    toe.rotation.z = -Math.PI / 2 + t * 0.35;
    toe.rotation.y = t * 0.25;
    toe.position.set(baseX + s(0.04, scale), baseY + s(0.02, scale), baseZ + t * spread);
    foot.add(toe);
  }

  const palm = new THREE.Mesh(
    new THREE.SphereGeometry(s(0.065, scale), mobile ? 8 : 12, mobile ? 8 : 12),
    mat.clone(),
  );
  (palm.material as THREE.MeshPhysicalMaterial).color.setHex(0x2a6878);
  palm.scale.set(1.15, 0.72, 1);
  palm.position.set(baseX - s(0.02, scale), baseY + s(0.035, scale), baseZ);
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
  const segs = mobile ? 10 : 16;

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(r, s(0.048, scale), segs, mobile ? 24 : 40),
    new THREE.MeshPhysicalMaterial({
      color: 0x0c1018,
      metalness: 0.35,
      roughness: 0.55,
    }),
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.9, r * 0.9, s(0.028, scale), mobile ? 24 : 36),
    new THREE.MeshPhysicalMaterial({
      map: hubcapTexture(),
      metalness: 0.88,
      roughness: 0.12,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.5,
    }),
  );
  disc.rotation.z = Math.PI / 2;
  wheel.add(disc);

  wheel.position.set(xNorm * L * 0.48, s(0.32, scale), zSign * W * 0.44);
  wheel.frustumCulled = false;
  return wheel;
}

function createCabinVoid(scale: number): THREE.Group {
  const cabin = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);

  const voidMat = new THREE.MeshStandardMaterial({
    color: 0x04060a,
    roughness: 1,
    metalness: 0,
  });

  const cabinBox = new THREE.Mesh(new THREE.BoxGeometry(L * 0.34, H * 0.28, W * 0.48), voidMat);
  cabinBox.position.set(-L * 0.02, H * 0.72, 0);
  cabin.add(cabinBox);

  for (const side of [-1, 1] as const) {
    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(L * 0.28, H * 0.22),
      new THREE.MeshPhysicalMaterial({
        color: 0x0a1018,
        metalness: 0.85,
        roughness: 0.08,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
      }),
    );
    pane.position.set(-L * 0.02, H * 0.72, side * W * 0.26);
    pane.rotation.y = side > 0 ? 0 : Math.PI;
    cabin.add(pane);
  }

  return cabin;
}

function createRearCrest(scale: number): THREE.Group {
  const crest = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const W = s(BALOON8_DIMS.width, scale);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.48, H * 0.48),
    new THREE.MeshPhysicalMaterial({
      map: crestTexture(),
      transparent: true,
      metalness: 0.7,
      roughness: 0.2,
      emissive: new THREE.Color(0x284858),
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
      envMapIntensity: 1.3,
    }),
  );
  plate.position.set(-L * 0.42, H * 1.02, 0);
  plate.rotation.y = Math.PI / 2;
  crest.add(plate);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(s(0.04, scale), s(0.06, scale), W * 0.42),
    abaloneMat(),
  );
  (wing.material as THREE.MeshPhysicalMaterial).color.setHex(0x2a3040);
  wing.position.set(-L * 0.4, H * 0.88, 0);
  crest.add(wing);

  crest.frustumCulled = false;
  return crest;
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
  const pipeMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8d4dc,
    metalness: 0.94,
    roughness: 0.14,
    clearcoat: 0.85,
  });
  for (let i = 0; i < 6; i++) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(s(0.03, scale), s(0.03, scale), s(0.08, scale), mobile ? 6 : 10),
      pipeMat,
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(-L * 0.48, s(0.1, scale), (i - 2.5) * s(0.085, scale));
    row.add(pipe);
  }
  row.frustumCulled = false;
  return row;
}

/** Build one full Baloon8 puffer coupe (+X front, +Y up, +Z left). */
export function buildBaloon8Car(opts: Baloon8CarOptions): Baloon8CarBuild {
  const { scale, mobile = false, portrait = false } = opts;
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];
  const wheels: THREE.Group[] = [];

  const podBudget = opts.podBudget ?? (mobile ? (portrait ? 700 : 950) : portrait ? 1400 : 2200);

  root.add(createInnerHull(scale));

  const puffer = createPufferShell(scale, podBudget, mobile);
  root.add(puffer);
  disposables.push(puffer.geometry);
  const pufferMat = puffer.material;
  if (Array.isArray(pufferMat)) pufferMat.forEach((m) => disposables.push(m));
  else disposables.push(pufferMat);

  root.add(createGrille(scale, mobile));
  root.add(createClawFoot(scale, 1, mobile));
  root.add(createClawFoot(scale, -1, mobile));

  const wheelFL = createDiscWheel(scale, 0.28, 1, mobile);
  const wheelRL = createDiscWheel(scale, -0.32, 1, mobile);
  const wheelFR = createDiscWheel(scale, 0.28, -1, mobile);
  const wheelRR = createDiscWheel(scale, -0.32, -1, mobile);
  wheels.push(wheelFL, wheelRL, wheelFR, wheelRR);
  root.add(wheelFL, wheelRL, wheelFR, wheelRR);

  root.add(createCabinVoid(scale));
  root.add(createRearCrest(scale));
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

  root.name = "Baloon8PufferCar";
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
