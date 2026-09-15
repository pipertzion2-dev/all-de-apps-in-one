/**
 * Advanced procedural BALOON8 car-sneaker (Three.js).
 *
 * Matches the orthographic brand blueprint + Tripo / Meshy references:
 * slip-on sneaker silhouette, densely packed iridescent balloon pods,
 * neon-green e8 grille, crystalline tread wheels, BALOON8 plate, 6 exhausts.
 * Real instanced volumetric mesh — not a presence-image thumbnail.
 */
import * as THREE from "three";

/** Brand mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

/** Iridescent abalone / oil-slick balloon palette (teal → violet → emerald). */
const BALLOON = [
  0x0e2a32, 0x164848, 0x1a6068, 0x0e3850, 0x2a4878, 0x1a7058, 0x3a3888, 0x228878, 0x4a58a0,
  0x2ab898, 0x185868, 0x245070,
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

function s(v: number, scale: number): number {
  return v * scale;
}

function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Stacked stylized e8 / eB monogram from the blueprint. */
function drawE8Logo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill = "#0a1018",
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fill;
  ctx.font = `italic 900 ${size * 0.7}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("e", -size * 0.14, -size * 0.18);
  ctx.fillText("8", size * 0.12, size * 0.1);
  ctx.restore();
}

function hubcapTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.48);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.55, "#e8eef4");
    g.addColorStop(1, "#9aacbc");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c0ccd8";
    ctx.lineWidth = w * 0.02;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    drawE8Logo(ctx, w / 2, h / 2, w * 0.38, "#0a1018");
  });
}

function grilleTexture(): THREE.CanvasTexture {
  return canvasTexture(640, 640, (ctx, w, h) => {
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55);
    bg.addColorStop(0, "#6aff9a");
    bg.addColorStop(0.35, "#28e868");
    bg.addColorStop(0.75, "#14a848");
    bg.addColorStop(1, "#0a6030");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Soft LED / sunburst dots (Tripo + blueprint)
    ctx.fillStyle = "rgba(220,255,230,0.55)";
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r = w * (0.18 + (i % 5) * 0.05);
      ctx.beginPath();
      ctx.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, w * 0.012, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#f0fff4";
    ctx.lineWidth = w * 0.028;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = w * 0.014;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#f6faf8";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    drawE8Logo(ctx, w / 2, h / 2, w * 0.28, "#0a1810");
  });
}

function plateTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 160, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#36f078");
    bg.addColorStop(1, "#14a848");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#e8fff0";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = "#061810";
    ctx.font = `bold ${h * 0.48}px "Arial Narrow", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BALOON8", w / 2, h / 2 + 2);
  });
}

function insoleTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#0a0c10";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c8d0d8";
    ctx.lineWidth = w * 0.018;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * (0.12 + i * 0.06), 0, Math.PI * 2);
      ctx.stroke();
    }
    drawE8Logo(ctx, w / 2, h / 2, w * 0.32, "#e8eef4");
  });
}

function crystalTreadTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#d8e8f4";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(40,60,80,0.35)";
    ctx.lineWidth = 2;
    const step = 18;
    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        ctx.strokeRect(x + 2, y + 2, step - 4, step - 4);
      }
    }
  });
}

function balloonMat(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.88,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 1,
    iridescenceIOR: 1.4,
    iridescenceThicknessRange: [140, 980],
    envMapIntensity: 1.85,
  });
}

/**
 * Slip-on sneaker silhouette SDF helpers (normalized).
 * xNorm: -1 heel … +1 toe
 * yNorm: 0 sole … 1 collar
 * Returns half-width scale and whether point is in the foot opening.
 */
function sneakerProfile(
  xNorm: number,
  yNorm: number,
): {
  halfW: number;
  opening: boolean;
  inside: boolean;
} {
  const t = (xNorm + 1) / 2; // 0 heel → 1 toe

  // Side outline: thicker midfoot, tapered toe, rounded heel
  const soleCurve =
    0.55 +
    0.35 * Math.sin(t * Math.PI) +
    0.12 * Math.exp(-Math.pow((t - 0.88) / 0.12, 2)) -
    0.08 * Math.exp(-Math.pow((t - 0.08) / 0.14, 2));

  // Height envelope — low toe, tall collar mid-rear, heel drop
  const heightEnv =
    0.22 +
    0.55 * Math.sin(Math.min(1, Math.max(0, (t - 0.05) / 0.75)) * Math.PI) +
    0.18 * Math.exp(-Math.pow((t - 0.35) / 0.28, 2));

  if (yNorm > heightEnv * 1.05) {
    return { halfW: 0, opening: false, inside: false };
  }

  // Collar / foot opening (top view oval) — mid-car, upper height
  const openX = (t - 0.38) / 0.28;
  const openY = (yNorm - 0.72) / 0.22;
  const opening = openX * openX + openY * openY < 1 && yNorm > 0.58 && t > 0.18 && t < 0.62;

  // Upper pinches inward near collar
  const pinch = yNorm > 0.55 ? 1 - (yNorm - 0.55) * 0.55 : 1;
  // Sole flare
  const flare = yNorm < 0.18 ? 1.08 : 1;
  let halfW =
    soleCurve * pinch * flare * (0.35 + 0.65 * Math.sin(Math.min(1, yNorm / heightEnv) * Math.PI));

  if (opening) halfW *= 0.35;

  return { halfW: Math.max(0, halfW), opening, inside: true };
}

/** Densely packed balloon shell following the sneaker SDF. */
function createBalloonShell(scale: number, budget: number, mobile: boolean): THREE.InstancedMesh {
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const rows = mobile ? 20 : 36;
  const maxCols = mobile ? 34 : 56;
  const geo = new THREE.SphereGeometry(s(0.032, scale), mobile ? 7 : 10, mobile ? 6 : 8);
  const mat = balloonMat();
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
    hex: number,
  ): boolean => {
    if (idx >= budget) return false;
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(((idx * 19) % 9) * 0.05, ((idx * 13) % 7) * 0.07, ((idx * 11) % 5) * 0.05);
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
    color.setHex(hex);
    mesh.setColorAt(idx, color);
    idx++;
    return true;
  };

  // Surface shell — rows along height, columns along length, both sides + fill rings
  for (let row = 0; row < rows && idx < budget; row++) {
    const yNorm = row / Math.max(1, rows - 1);
    const y = s(0.03, scale) + yNorm * H * 0.98;
    const cols = Math.floor(maxCols * (0.55 + 0.45 * Math.sin(yNorm * Math.PI)));
    for (let col = 0; col < cols && idx < budget; col++) {
      const u = col / Math.max(1, cols - 1);
      const xNorm = u * 2 - 1;
      const { halfW, opening, inside } = sneakerProfile(xNorm, yNorm);
      if (!inside || halfW < 0.08) continue;

      const x = xNorm * L * 0.48;
      const radius = halfW * W;
      const base = (0.85 + ((row * 5 + col * 3) % 9) / 16) * (opening ? 0.55 : 1);
      const sx = base * 1.05;
      const sy = base * 0.95;
      const sz = base * 1.05;

      // Outer shell both sides
      for (const side of [-1, 1] as const) {
        if (idx >= budget) break;
        if (opening && halfW < 0.2) continue;
        const z = side * radius * (0.92 + ((row + col) % 4) * 0.02);
        place(x, y, z, sx, sy, sz, BALLOON[(row + col + (side > 0 ? 0 : 4)) % BALLOON.length]!);
      }

      // Mid-fill rings so the body reads solid (not hollow silhouette)
      if (!opening && yNorm > 0.08 && yNorm < 0.85) {
        for (const f of [0.55, 0.25] as const) {
          if (idx >= budget) break;
          for (const side of [-1, 1] as const) {
            if (idx >= budget) break;
            const z = side * radius * f;
            const shrink = 0.85 + f * 0.1;
            place(
              x,
              y,
              z,
              sx * shrink,
              sy * shrink,
              sz * shrink,
              BALLOON[(row * 2 + col + Math.round(f * 10)) % BALLOON.length]!,
            );
          }
        }
      }
    }
  }

  // Toe cap dome
  const toeN = mobile ? 70 : 140;
  for (let i = 0; i < toeN && idx < budget; i++) {
    const a = (i / toeN) * Math.PI * 2;
    const ring = 0.35 + (i % 5) * 0.12;
    const y = H * (0.12 + (i % 7) * 0.07);
    const z = Math.sin(a) * W * 0.28 * ring;
    const x = L * 0.46 + Math.cos(a) * s(0.06, scale) * ring;
    const base = 0.9 + (i % 4) * 0.05;
    place(x, y, z, base, base * 0.9, base, BALLOON[i % BALLOON.length]!);
  }

  // Heel wrap
  const heelN = mobile ? 55 : 110;
  for (let i = 0; i < heelN && idx < budget; i++) {
    const a = (i / heelN) * Math.PI * 2;
    const y = H * (0.1 + (i % 8) * 0.08);
    const z = Math.sin(a) * W * 0.32;
    const x = -L * 0.46 + Math.cos(a) * s(0.05, scale);
    const base = 0.88 + (i % 5) * 0.05;
    place(x, y, z, base, base * 0.9, base, BALLOON[(i + 3) % BALLOON.length]!);
  }

  // Collar rim around foot opening
  const rimN = mobile ? 40 : 80;
  for (let i = 0; i < rimN && idx < budget; i++) {
    const a = (i / rimN) * Math.PI * 2;
    const cx = -L * 0.02;
    const cy = H * 0.78;
    const rx = L * 0.16;
    const rz = W * 0.22;
    const x = cx + Math.cos(a) * rx;
    const z = Math.sin(a) * rz;
    const y = cy + Math.sin(a * 2) * s(0.02, scale);
    place(x, y, z, 0.75, 0.7, 0.75, BALLOON[(i + 1) % BALLOON.length]!);
  }

  mesh.count = idx;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createInnerHull(scale: number): THREE.Group {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);

  // Dark sole / chassis
  const sole = new THREE.Mesh(
    new THREE.CapsuleGeometry(W * 0.32, L * 0.62, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x06080c, roughness: 0.92, metalness: 0.15 }),
  );
  sole.rotation.z = Math.PI / 2;
  sole.position.set(0, H * 0.28, 0);
  sole.scale.set(1, 0.55, 0.95);
  g.add(sole);

  // Black padded collar liner
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(W * 0.22, s(0.045, scale), 10, 28),
    new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.85, metalness: 0.05 }),
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(-L * 0.02, H * 0.78, 0);
  collar.scale.set(1.15, 0.85, 1);
  g.add(collar);

  // Insole with e8 mandala
  const insole = new THREE.Mesh(
    new THREE.CircleGeometry(W * 0.2, 32),
    new THREE.MeshPhysicalMaterial({
      map: insoleTexture(),
      metalness: 0.4,
      roughness: 0.45,
      envMapIntensity: 0.8,
    }),
  );
  insole.rotation.x = -Math.PI / 2;
  insole.position.set(-L * 0.04, H * 0.62, 0);
  g.add(insole);

  return g;
}

function createGrille(scale: number, mobile: boolean): THREE.Group {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);

  // Circular neon face (blueprint) on a shallow disc
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(W * 0.22, 48),
    new THREE.MeshPhysicalMaterial({
      map: grilleTexture(),
      emissive: new THREE.Color(0x28e868),
      emissiveIntensity: mobile ? 1.6 : 2.2,
      metalness: 0.2,
      roughness: 0.25,
      side: THREE.DoubleSide,
    }),
  );
  disc.position.set(L * 0.495, H * 0.42, 0);
  disc.rotation.y = Math.PI / 2;
  g.add(disc);

  // Soft rectangular frame around it (Tripo vertical grille cue)
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(s(0.03, scale), H * 0.42, W * 0.38),
    new THREE.MeshPhysicalMaterial({
      color: 0x0a2014,
      emissive: new THREE.Color(0x14c858),
      emissiveIntensity: 0.55,
      metalness: 0.4,
      roughness: 0.35,
    }),
  );
  frame.position.set(L * 0.47, H * 0.42, 0);
  g.add(frame);

  const glow = new THREE.PointLight(0x36f078, mobile ? 1.1 : 1.8, s(2.8, scale), 2);
  glow.position.set(L * 0.55, H * 0.42, 0);
  g.add(glow);

  return g;
}

function createCrystalWheel(
  scale: number,
  xNorm: number,
  zSign: number,
  mobile: boolean,
): THREE.Group {
  const wheel = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const r = s(0.3, scale);
  const segs = mobile ? 12 : 20;

  // Translucent crystalline tire with tread
  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(r, s(0.055, scale), segs, mobile ? 28 : 48),
    new THREE.MeshPhysicalMaterial({
      map: crystalTreadTexture(),
      color: 0xc8dce8,
      metalness: 0.05,
      roughness: 0.15,
      transmission: 0.65,
      thickness: s(0.04, scale),
      transparent: true,
      opacity: 0.92,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.4,
    }),
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  // White / chrome disc hub with e8
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.72, r * 0.72, s(0.032, scale), mobile ? 28 : 40),
    new THREE.MeshPhysicalMaterial({
      map: hubcapTexture(),
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.6,
    }),
  );
  disc.rotation.z = Math.PI / 2;
  wheel.add(disc);

  wheel.position.set(xNorm * L * 0.42, s(0.3, scale), zSign * W * 0.42);
  wheel.frustumCulled = false;
  return wheel;
}

function createClawFeet(scale: number, zSign: number, mobile: boolean): THREE.Group {
  const foot = new THREE.Group();
  const mat = balloonMat();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const toes = mobile ? 4 : 5;
  for (let i = 0; i < toes; i++) {
    const t = (i - (toes - 1) / 2) / Math.max(1, toes - 1);
    const toe = new THREE.Mesh(
      new THREE.CapsuleGeometry(s(0.028, scale), s(0.08, scale), 4, 8),
      mat.clone(),
    );
    (toe.material as THREE.MeshPhysicalMaterial).color.setHex(BALLOON[(i + 2) % BALLOON.length]!);
    toe.rotation.z = -Math.PI / 2 + t * 0.3;
    toe.position.set(L * 0.4, s(0.06, scale), zSign * W * 0.3 + t * s(0.08, scale));
    foot.add(toe);
  }
  return foot;
}

function createRearPlate(scale: number): THREE.Group {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const W = s(BALOON8_DIMS.width, scale);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.42, H * 0.12),
    new THREE.MeshPhysicalMaterial({
      map: plateTexture(),
      emissive: new THREE.Color(0x22c860),
      emissiveIntensity: 0.85,
      metalness: 0.2,
      roughness: 0.35,
      side: THREE.DoubleSide,
    }),
  );
  plate.position.set(-L * 0.495, H * 0.38, 0);
  plate.rotation.y = Math.PI / 2;
  g.add(plate);
  return g;
}

function createExhaustRow(scale: number, mobile: boolean): THREE.Group {
  const row = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xc8d4dc,
    metalness: 0.96,
    roughness: 0.12,
    clearcoat: 0.9,
  });
  for (let i = 0; i < 6; i++) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(s(0.032, scale), s(0.032, scale), s(0.09, scale), mobile ? 8 : 12),
      mat,
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(-L * 0.5, s(0.1, scale), (i - 2.5) * s(0.09, scale));
    row.add(pipe);
  }
  return row;
}

function createMirrorPods(scale: number, zSign: number): THREE.Group {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const mat = balloonMat();
  for (let i = 0; i < 5; i++) {
    const pod = new THREE.Mesh(new THREE.SphereGeometry(s(0.04, scale), 8, 8), mat.clone());
    (pod.material as THREE.MeshPhysicalMaterial).color.setHex(BALLOON[i % BALLOON.length]!);
    pod.position.set(
      L * 0.12 + (i % 2) * s(0.03, scale),
      H * 0.7,
      zSign * (W * 0.48 + (i % 3) * s(0.02, scale)),
    );
    g.add(pod);
  }
  return g;
}

/** Build one full BALOON8 car-sneaker (+X toe/front, +Y up, +Z left). */
export function buildBaloon8Car(opts: Baloon8CarOptions): Baloon8CarBuild {
  const { scale, mobile = false, portrait = false } = opts;
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];
  const wheels: THREE.Group[] = [];

  const podBudget = opts.podBudget ?? (mobile ? (portrait ? 900 : 1300) : portrait ? 2000 : 3200);

  root.add(createInnerHull(scale));

  const puffer = createBalloonShell(scale, podBudget, mobile);
  root.add(puffer);
  disposables.push(puffer.geometry);
  const pufferMat = puffer.material;
  if (Array.isArray(pufferMat)) pufferMat.forEach((m) => disposables.push(m));
  else disposables.push(pufferMat);

  root.add(createGrille(scale, mobile));
  root.add(createClawFeet(scale, 1, mobile));
  root.add(createClawFeet(scale, -1, mobile));

  const wheelFL = createCrystalWheel(scale, 0.32, 1, mobile);
  const wheelRL = createCrystalWheel(scale, -0.36, 1, mobile);
  const wheelFR = createCrystalWheel(scale, 0.32, -1, mobile);
  const wheelRR = createCrystalWheel(scale, -0.36, -1, mobile);
  wheels.push(wheelFL, wheelRL, wheelFR, wheelRR);
  root.add(wheelFL, wheelRL, wheelFR, wheelRR);

  root.add(createRearPlate(scale));
  root.add(createExhaustRow(scale, mobile));
  root.add(createMirrorPods(scale, 1));
  root.add(createMirrorPods(scale, -1));

  const hullMat = balloonMat();
  disposables.push(hullMat);

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshStandardMaterial;
    if ((mat.emissiveIntensity ?? 0) > 0.4) glowMeshes.push(obj);
  });

  root.name = "Baloon8CarSneaker";
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
