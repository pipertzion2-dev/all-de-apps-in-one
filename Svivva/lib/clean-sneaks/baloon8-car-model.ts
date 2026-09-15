/**
 * Procedural 3D Baloon8 stone coupe — dense river-rock / cobblestone body
 * matching the Meshy-style reference (grey pebbles, green grille emblem,
 * white disc wheels with B logo, claw feet). Real volumetric mesh — not a
 * presence-image thumbnail or blueprint billboard.
 */
import * as THREE from "three";

/** Real-world mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

/** River-stone greys — polished cobble / granite. */
const STONE = [
  0x6e7278, 0x80868c, 0x5a5e64, 0x90969c, 0x4a4e54, 0x7a8288, 0x686c72, 0x969aa0, 0x555860,
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

/** Black stylized B monogram (Meshy wheel / grille look). */
function drawBLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill = "#0a0c10",
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fill;
  ctx.font = `italic 900 ${size}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("B", 0, size * 0.04);
  ctx.restore();
}

function hubcapTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#f5f7f8";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
    ctx.fill();

    const rim = ctx.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.48);
    rim.addColorStop(0, "rgba(220,224,228,0)");
    rim.addColorStop(1, "rgba(160,168,176,0.55)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#c8ced4";
    ctx.lineWidth = w * 0.012;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    drawBLogo(ctx, w / 2, h / 2, w * 0.42, "#0a0c10");
  });
}

function grilleTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 640, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#1a7a48");
    bg.addColorStop(0.45, "#2ad068");
    bg.addColorStop(1, "#126038");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Soft stone grain over green plate
    for (let i = 0; i < 80; i++) {
      const x = (i * 37) % w;
      const y = (i * 53) % h;
      ctx.fillStyle = `rgba(255,255,255,${0.02 + (i % 5) * 0.01})`;
      ctx.beginPath();
      ctx.arc(x, y, 4 + (i % 6), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#e8f4ec";
    ctx.lineWidth = w * 0.02;
    const pad = w * 0.08;
    ctx.strokeRect(pad, h * 0.06, w - pad * 2, h * 0.88);

    // Circular white emblem
    const cx = w / 2;
    const cy = h * 0.48;
    const r = w * 0.22;
    ctx.fillStyle = "#f4f8f4";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0a2010";
    ctx.lineWidth = w * 0.012;
    ctx.stroke();

    drawBLogo(ctx, cx, cy, w * 0.28, "#0a2010");
  });
}

function stoneMat(opts?: { emissive?: number; intensity?: number }): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.08,
    roughness: 0.72,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    envMapIntensity: 0.55,
    emissive: new THREE.Color(opts?.emissive ?? 0x000000),
    emissiveIntensity: opts?.intensity ?? 0,
  });
}

/**
 * Classic luxury coupe half-width at normalized length (-1 rear .. +1 nose)
 * and height (0 belly .. 1 roof). Window band returns smaller radius so cabin
 * reads as hollow openings.
 */
function bodyRadiusAt(xNorm: number, yNorm: number): { rad: number; windowCut: boolean } {
  const lengthT = (xNorm + 1) / 2;
  const nose = Math.exp(-Math.pow((lengthT - 0.9) / 0.11, 2));
  const tail = Math.exp(-Math.pow((lengthT - 0.08) / 0.13, 2));
  const belt = 0.55 + 0.45 * Math.sin(lengthT * Math.PI);
  const heightBulge = 0.15 + 0.85 * Math.sin(Math.min(1, yNorm * 1.05) * Math.PI);
  const waist = 1 - 0.18 * Math.pow(Math.abs(lengthT - 0.45), 1.35);
  let rad = belt * heightBulge * waist * (0.62 + nose * 0.22 + tail * 0.18);

  // Cabin window cut — side glass band mid-car, mid-height
  const inCabinX = lengthT > 0.28 && lengthT < 0.62;
  const inCabinY = yNorm > 0.52 && yNorm < 0.88;
  const windowCut = inCabinX && inCabinY;
  if (windowCut) rad *= 0.42;

  // Slightly flatter roof for boxy luxury coupe
  if (yNorm > 0.82) rad *= 0.92;

  return { rad, windowCut };
}

function createStoneShell(scale: number, budget: number, mobile: boolean): THREE.InstancedMesh {
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const rows = mobile ? 16 : 28;
  const maxCols = mobile ? 26 : 42;
  const geo = new THREE.SphereGeometry(s(0.03, scale), mobile ? 6 : 8, mobile ? 5 : 7);
  const mat = stoneMat();
  const mesh = new THREE.InstancedMesh(geo, mat, budget);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let idx = 0;

  const place = (
    x: number,
    y: number,
    z: number,
    podScale: number,
    colorHex: number,
  ): boolean => {
    if (idx >= budget) return false;
    dummy.position.set(x, y, z);
    dummy.scale.setScalar(podScale);
    // Slight squash so cobbles read as river stones, not perfect balls
    dummy.scale.y *= 0.78 + ((idx * 13) % 7) * 0.03;
    dummy.scale.x *= 0.9 + ((idx * 5) % 5) * 0.025;
    dummy.rotation.set(
      ((idx * 17) % 10) * 0.08,
      ((idx * 11) % 10) * 0.12,
      ((idx * 7) % 10) * 0.1,
    );
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
    color.setHex(colorHex);
    mesh.setColorAt(idx, color);
    idx++;
    return true;
  };

  // Side + silhouette shell
  for (let row = 0; row < rows && idx < budget; row++) {
    const yNorm = row / Math.max(1, rows - 1);
    const y = s(0.05, scale) + yNorm * H * 0.96;
    const cols = Math.floor(maxCols * (0.5 + 0.5 * Math.sin(yNorm * Math.PI)));
    for (let col = 0; col < cols && idx < budget; col++) {
      const u = col / Math.max(1, cols - 1);
      const xNorm = u * 2 - 1;
      const { rad, windowCut } = bodyRadiusAt(xNorm, yNorm);
      if (rad < 0.1) continue;

      const x = xNorm * L * 0.48;
      const halfW = rad * W * 0.5;
      const basePod = (0.7 + ((row * 7 + col * 3) % 11) / 18) * (windowCut ? 0.55 : 1);

      for (const side of [-1, 1] as const) {
        if (idx >= budget) break;
        // Skip deep window cavity so openings look hollow
        if (windowCut && Math.abs(side) === 1 && rad < 0.28) continue;
        const z = side * halfW * (0.9 + ((row + col) % 5) * 0.018);
        const hex = STONE[(row + col + (side > 0 ? 0 : 4)) % STONE.length]!;
        place(x, y, z, basePod, hex);
      }
    }
  }

  // Roof / hood / deck fill — top layer of cobbles
  const topRows = mobile ? 6 : 10;
  const topCols = mobile ? 18 : 30;
  for (let r = 0; r < topRows && idx < budget; r++) {
    for (let c = 0; c < topCols && idx < budget; c++) {
      const u = c / Math.max(1, topCols - 1);
      const v = r / Math.max(1, topRows - 1);
      const xNorm = u * 2 - 1;
      const zNorm = (v - 0.5) * 2;
      const { rad, windowCut } = bodyRadiusAt(xNorm, 0.78 + v * 0.12);
      if (windowCut || rad < 0.2) continue;
      const x = xNorm * L * 0.46;
      const z = zNorm * rad * W * 0.42;
      const y = s(0.05, scale) + H * (0.78 + Math.sin(u * Math.PI) * 0.16);
      const hex = STONE[(r * 3 + c) % STONE.length]!;
      place(x, y, z, 0.85 + (c % 4) * 0.05, hex);
    }
  }

  // Nose / grille surround cobbles
  const noseCount = mobile ? 40 : 70;
  for (let i = 0; i < noseCount && idx < budget; i++) {
    const a = (i / noseCount) * Math.PI * 2;
    const ring = 0.55 + (i % 3) * 0.12;
    const y = H * (0.28 + (i % 5) * 0.08);
    const z = Math.sin(a) * W * 0.28 * ring;
    const x = L * 0.46 + Math.cos(a) * s(0.04, scale);
    place(x, y, z, 0.75 + (i % 4) * 0.06, STONE[i % STONE.length]!);
  }

  // Rear bumper / trunk cobbles
  const rearCount = mobile ? 36 : 60;
  for (let i = 0; i < rearCount && idx < budget; i++) {
    const a = (i / rearCount) * Math.PI * 2;
    const y = H * (0.22 + (i % 6) * 0.09);
    const z = Math.sin(a) * W * 0.32;
    const x = -L * 0.46 + Math.cos(a) * s(0.03, scale);
    place(x, y, z, 0.72 + (i % 5) * 0.05, STONE[(i + 2) % STONE.length]!);
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
      color: 0x121418,
      roughness: 0.95,
      metalness: 0.05,
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
    new THREE.BoxGeometry(s(0.045, scale), H * 0.52, W * 0.58),
    new THREE.MeshPhysicalMaterial({
      map: grilleTexture(),
      emissive: new THREE.Color(0x22b858),
      emissiveIntensity: mobile ? 0.85 : 1.15,
      metalness: 0.15,
      roughness: 0.45,
      envMapIntensity: 0.7,
    }),
  );
  frame.position.set(L * 0.485, H * 0.46, 0);
  g.add(frame);
  return g;
}

function createClawFoot(scale: number, zSign: number, mobile: boolean): THREE.Group {
  const foot = new THREE.Group();
  const mat = stoneMat();
  const toeCount = mobile ? 4 : 5;
  const spread = s(0.09, scale);
  const baseX = s(BALOON8_DIMS.length, scale) * 0.42;
  const baseY = s(0.05, scale);
  const baseZ = zSign * s(BALOON8_DIMS.width, scale) * 0.34;

  for (let i = 0; i < toeCount; i++) {
    const t = (i - (toeCount - 1) / 2) / Math.max(1, toeCount - 1);
    const toe = new THREE.Mesh(
      new THREE.CapsuleGeometry(s(0.032, scale), s(0.085, scale), mobile ? 4 : 6, 8),
      mat.clone(),
    );
    (toe.material as THREE.MeshPhysicalMaterial).color.setHex(STONE[(i + 3) % STONE.length]!);
    toe.rotation.z = -Math.PI / 2 + t * 0.35;
    toe.rotation.y = t * 0.25;
    toe.position.set(baseX + s(0.04, scale), baseY + s(0.02, scale), baseZ + t * spread);
    foot.add(toe);
  }

  const palm = new THREE.Mesh(
    new THREE.SphereGeometry(s(0.065, scale), mobile ? 8 : 12, mobile ? 8 : 12),
    mat.clone(),
  );
  (palm.material as THREE.MeshPhysicalMaterial).color.setHex(0x5c6066);
  palm.scale.set(1.1, 0.75, 1);
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
      color: 0x0c0e12,
      metalness: 0.15,
      roughness: 0.7,
    }),
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  // Flat white disc — Meshy reference look
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.9, r * 0.9, s(0.028, scale), mobile ? 24 : 36),
    new THREE.MeshPhysicalMaterial({
      map: hubcapTexture(),
      metalness: 0.05,
      roughness: 0.35,
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.6,
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

  // Dark hollow interior visible through stone window cuts
  const voidMat = new THREE.MeshStandardMaterial({
    color: 0x050608,
    roughness: 1,
    metalness: 0,
  });

  const cabinBox = new THREE.Mesh(
    new THREE.BoxGeometry(L * 0.34, H * 0.28, W * 0.48),
    voidMat,
  );
  cabinBox.position.set(-L * 0.02, H * 0.72, 0);
  cabin.add(cabinBox);

  // Side window openings (slightly inset dark planes)
  for (const side of [-1, 1] as const) {
    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(L * 0.28, H * 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x020304,
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    );
    pane.position.set(-L * 0.02, H * 0.72, side * W * 0.26);
    pane.rotation.y = side > 0 ? 0 : Math.PI;
    cabin.add(pane);
  }

  return cabin;
}

function createExhaustRow(scale: number, mobile: boolean): THREE.Group {
  const row = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const pipeMat = new THREE.MeshPhysicalMaterial({
    color: 0xa8b0b8,
    metalness: 0.55,
    roughness: 0.35,
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

/** Build one full stone Baloon8 coupe in local space (+X front, +Y up, +Z left). */
export function buildBaloon8Car(opts: Baloon8CarOptions): Baloon8CarBuild {
  const { scale, mobile = false, portrait = false } = opts;
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];
  const wheels: THREE.Group[] = [];

  const podBudget = opts.podBudget ?? (mobile ? (portrait ? 480 : 640) : portrait ? 900 : 1400);

  root.add(createInnerHull(scale));

  const puffer = createStoneShell(scale, podBudget, mobile);
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
  root.add(createExhaustRow(scale, mobile));

  const hullMat = stoneMat();
  disposables.push(hullMat);

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshStandardMaterial;
    if ((mat.emissiveIntensity ?? 0) > 0.3) glowMeshes.push(obj);
  });

  root.name = "Baloon8StoneCar";
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
