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
const DEFAULT_BALLOON_PODS = [
  0x0e2a32, 0x164848, 0x1a6068, 0x0e3850, 0x2a4878, 0x1a7058, 0x3a3888, 0x228878, 0x4a58a0,
  0x2ab898, 0x185868, 0x245070,
];

/** Active pod palette for the current build (set by buildBaloon8Car). */
let BALLOON = DEFAULT_BALLOON_PODS;

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
  /** Balloon pod hex colors — BALOON8 colorway only */
  podPalette?: number[];
  /** Hull base hex */
  hullColor?: number;
  /** Grille / plate accent hex */
  accentColor?: number;
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
    drawE8Logo(ctx, w / 2, h / 2 - h * 0.04, w * 0.36, "#0a1018");
    ctx.fillStyle = "#3a4450";
    ctx.font = `600 ${w * 0.055}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("i6Pw", w / 2, h * 0.72);
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
    metalness: 0.82,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 1,
    iridescenceIOR: 1.55,
    iridescenceThicknessRange: [160, 1100],
    sheen: 0.45,
    sheenColor: new THREE.Color(0x6dffc0),
    sheenRoughness: 0.3,
    envMapIntensity: 1.95,
  });
}

/**
 * Slip-on loafer silhouette from the BALOON8 orthographic sheet.
 * xNorm: -1 heel … +1 toe   |   yNorm: 0 sole … 1 collar top
 */
function sneakerProfile(
  xNorm: number,
  yNorm: number,
): {
  halfW: number;
  opening: boolean;
  inside: boolean;
  heightEnv: number;
} {
  const t = THREE.MathUtils.clamp((xNorm + 1) / 2, 0, 1); // 0 heel → 1 toe

  // Side-view roof line: low rounded toe → rising vamp → tall ankle collar → heel drop
  const toeDome = Math.exp(-Math.pow((t - 0.94) / 0.11, 2));
  const collar = Math.exp(-Math.pow((t - 0.3) / 0.2, 2));
  const vamp = Math.sin(THREE.MathUtils.clamp((t - 0.08) / 0.78, 0, 1) * Math.PI);
  const heelDrop = t < 0.14 ? THREE.MathUtils.smoothstep(t, 0, 0.14) : 1;
  const heightEnv = (0.26 + 0.2 * vamp + 0.52 * collar + 0.2 * toeDome) * (0.72 + 0.28 * heelDrop);

  if (yNorm > heightEnv * 1.02 || yNorm < 0.02) {
    return { halfW: 0, opening: false, inside: false, heightEnv };
  }

  // Top-view plan: wide midfoot, tapered toe, rounded heel (blueprint)
  const plan =
    0.5 +
    0.38 * Math.sin(t * Math.PI) +
    0.1 * Math.exp(-Math.pow((t - 0.9) / 0.12, 2)) -
    0.1 * Math.exp(-Math.pow((t - 0.06) / 0.12, 2));

  // Foot opening — large oval over mid/rear upper (top + side views)
  const openX = (t - 0.36) / 0.3;
  const openY = (yNorm - 0.7) / 0.26;
  const opening = openX * openX + openY * openY < 1 && yNorm > 0.52 && t > 0.14 && t < 0.64;

  // Width vs height: fuller near sole, pinches at collar rim
  const hFrac = THREE.MathUtils.clamp(yNorm / Math.max(0.08, heightEnv), 0, 1);
  const section = 0.42 + 0.58 * Math.sin(hFrac * Math.PI);
  const pinch = yNorm > 0.5 ? 1 - (yNorm - 0.5) * 0.7 : 1;
  const flare = yNorm < 0.16 ? 1.1 : 1;
  let halfW = plan * section * pinch * flare;
  if (opening) halfW *= 0.28;

  return { halfW: Math.max(0, halfW), opening, inside: true, heightEnv };
}

/** Densely packed balloon shell following the slip-on sneaker SDF. */
function createBalloonShell(scale: number, budget: number, mobile: boolean): THREE.InstancedMesh {
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const rows = mobile ? 24 : 42;
  const maxCols = mobile ? 40 : 64;
  // Slightly oblong pods read as the packed "balloon grapes" in the blueprint
  const geo = new THREE.SphereGeometry(s(0.03, scale), mobile ? 8 : 11, mobile ? 6 : 9);
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
    dummy.rotation.set(((idx * 19) % 9) * 0.06, ((idx * 13) % 7) * 0.08, ((idx * 11) % 5) * 0.05);
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
    color.setHex(hex);
    mesh.setColorAt(idx, color);
    idx++;
    return true;
  };

  for (let row = 0; row < rows && idx < budget; row++) {
    const yNorm = 0.04 + (row / Math.max(1, rows - 1)) * 0.94;
    const y = yNorm * H;
    const cols = Math.floor(maxCols * (0.62 + 0.38 * Math.sin(yNorm * Math.PI)));
    for (let col = 0; col < cols && idx < budget; col++) {
      const u = col / Math.max(1, cols - 1);
      const xNorm = u * 2 - 1;
      const { halfW, opening, inside, heightEnv } = sneakerProfile(xNorm, yNorm);
      if (!inside || halfW < 0.07) continue;
      // Keep pods under the side roof line so the silhouette stays shoe-shaped
      if (yNorm > heightEnv * 0.98) continue;

      const x = xNorm * L * 0.485;
      const radius = halfW * W * 0.98;
      const jitter = ((row * 7 + col * 3) % 5) * 0.004;
      const base = (0.82 + ((row * 5 + col * 3) % 9) / 18) * (opening ? 0.5 : 1);
      const sx = base * 1.12;
      const sy = base * 0.88;
      const sz = base * 1.1;

      for (const side of [-1, 1] as const) {
        if (idx >= budget) break;
        if (opening && halfW < 0.18) continue;
        const z = side * radius * (0.9 + ((row + col) % 5) * 0.018 + jitter);
        place(x, y, z, sx, sy, sz, BALLOON[(row + col + (side > 0 ? 0 : 4)) % BALLOON.length]!);
      }

      // Solid fill so the body reads as a packed volume (not a hollow shell)
      if (!opening && yNorm > 0.1 && yNorm < heightEnv * 0.9) {
        for (const f of [0.62, 0.32, 0.08] as const) {
          if (idx >= budget) break;
          if (f < 0.15 && Math.abs(xNorm) > 0.7) continue;
          for (const side of [-1, 1] as const) {
            if (idx >= budget) break;
            if (f < 0.15 && side < 0) {
              place(
                x,
                y,
                0,
                sx * 0.85,
                sy * 0.85,
                sz * 0.85,
                BALLOON[(row + col) % BALLOON.length]!,
              );
              break;
            }
            const z = side * radius * f;
            const shrink = 0.8 + f * 0.15;
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

  // Bulbous toe box (front / grille end)
  const toeN = mobile ? 90 : 180;
  for (let i = 0; i < toeN && idx < budget; i++) {
    const a = (i / toeN) * Math.PI * 2;
    const ring = 0.25 + (i % 6) * 0.11;
    const y = H * (0.1 + (i % 9) * 0.055);
    const z = Math.sin(a) * W * 0.3 * ring;
    const x = L * 0.455 + Math.cos(a) * s(0.07, scale) * ring;
    const { inside, heightEnv } = sneakerProfile(0.92, y / H);
    if (!inside || y / H > heightEnv) continue;
    const base = 0.92 + (i % 4) * 0.05;
    place(x, y, z, base * 1.1, base * 0.9, base * 1.05, BALLOON[i % BALLOON.length]!);
  }

  // Rounded heel wrap (rear / plate end)
  const heelN = mobile ? 70 : 140;
  for (let i = 0; i < heelN && idx < budget; i++) {
    const a = (i / heelN) * Math.PI * 2;
    const y = H * (0.08 + (i % 10) * 0.06);
    const z = Math.sin(a) * W * 0.3;
    const x = -L * 0.455 + Math.cos(a) * s(0.055, scale);
    const base = 0.9 + (i % 5) * 0.04;
    place(x, y, z, base * 1.08, base * 0.88, base, BALLOON[(i + 3) % BALLOON.length]!);
  }

  // Raised ankle collar — dense balloon ring around the foot opening
  const rimN = mobile ? 70 : 140;
  for (let i = 0; i < rimN && idx < budget; i++) {
    const a = (i / rimN) * Math.PI * 2;
    const cx = -L * 0.04;
    const cy = H * 0.76;
    const rx = L * 0.18;
    const rz = W * 0.24;
    const x = cx + Math.cos(a) * rx;
    const z = Math.sin(a) * rz;
    const y = cy + Math.sin(a * 2) * s(0.025, scale) + ((i % 3) - 1) * s(0.02, scale);
    place(x, y, z, 0.82, 0.72, 0.82, BALLOON[(i + 1) % BALLOON.length]!);
  }

  // Extra collar crown so the side view reads as a slip-on ankle
  const crownN = mobile ? 35 : 70;
  for (let i = 0; i < crownN && idx < budget; i++) {
    const u = i / Math.max(1, crownN - 1);
    const x = L * (-0.22 + u * 0.28);
    const y = H * (0.82 + Math.sin(u * Math.PI) * 0.1);
    for (const side of [-1, 1] as const) {
      if (idx >= budget) break;
      const z = side * W * (0.16 + (i % 3) * 0.02);
      place(x, y, z, 0.78, 0.7, 0.78, BALLOON[(i + side + 5) % BALLOON.length]!);
    }
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

  // Black padded collar liner (matte neoprene / leather from top view)
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x0a0b0e,
    roughness: 0.92,
    metalness: 0.04,
  });
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(W * 0.24, s(0.055, scale), 12, 36),
    collarMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(-L * 0.04, H * 0.76, 0);
  collar.scale.set(1.2, 0.78, 1);
  g.add(collar);

  const throat = new THREE.Mesh(
    new THREE.CylinderGeometry(W * 0.2, W * 0.22, H * 0.16, 28, 1, true),
    collarMat,
  );
  throat.position.set(-L * 0.04, H * 0.68, 0);
  throat.scale.set(1.15, 1, 0.85);
  g.add(throat);

  // Insole with e8 mandala (heel area of footbed)
  const insole = new THREE.Mesh(
    new THREE.CircleGeometry(W * 0.18, 32),
    new THREE.MeshPhysicalMaterial({
      map: insoleTexture(),
      metalness: 0.45,
      roughness: 0.4,
      envMapIntensity: 0.85,
    }),
  );
  insole.rotation.x = -Math.PI / 2;
  insole.position.set(-L * 0.08, H * 0.58, 0);
  g.add(insole);

  return g;
}

function createGrille(scale: number, mobile: boolean, accentHex = 0x28e868): THREE.Group {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const accent = new THREE.Color(accentHex);

  // Circular neon face (blueprint) on a shallow disc
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(W * 0.22, 48),
    new THREE.MeshPhysicalMaterial({
      map: grilleTexture(),
      emissive: accent.clone(),
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
      emissive: accent.clone().multiplyScalar(0.55),
      emissiveIntensity: 0.55,
      metalness: 0.4,
      roughness: 0.35,
    }),
  );
  frame.position.set(L * 0.47, H * 0.42, 0);
  g.add(frame);

  const glow = new THREE.PointLight(accentHex, mobile ? 1.1 : 1.8, s(2.8, scale), 2);
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
  const r = s(0.32, scale);
  const segs = mobile ? 12 : 20;

  // Crystal / glass tire with chunky radial ribs (side-view blueprint)
  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(r, s(0.062, scale), segs, mobile ? 28 : 48),
    new THREE.MeshPhysicalMaterial({
      map: crystalTreadTexture(),
      color: 0xd8eef8,
      metalness: 0.08,
      roughness: 0.1,
      transmission: 0.72,
      thickness: s(0.05, scale),
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.5,
      ior: 1.45,
    }),
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  const ribGeo = new THREE.BoxGeometry(s(0.02, scale), r * 1.55, s(0.045, scale));
  const ribMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8f4fc,
    metalness: 0.1,
    roughness: 0.12,
    transmission: 0.5,
    transparent: true,
    opacity: 0.75,
  });
  const ribCount = mobile ? 10 : 16;
  for (let i = 0; i < ribCount; i++) {
    const rib = new THREE.Mesh(ribGeo, ribMat);
    const a = (i / ribCount) * Math.PI * 2;
    rib.position.set(0, Math.sin(a) * r * 0.15, Math.cos(a) * r * 0.15);
    rib.rotation.x = a;
    wheel.add(rib);
  }

  // Flat white hub disc with e8 (blueprint hubcaps)
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.78, r * 0.78, s(0.028, scale), mobile ? 28 : 48),
    new THREE.MeshPhysicalMaterial({
      map: hubcapTexture(),
      metalness: 0.88,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.55,
    }),
  );
  disc.rotation.z = Math.PI / 2;
  wheel.add(disc);

  // Sit low under the sneaker sole like the side orthographic
  wheel.position.set(xNorm * L * 0.4, r * 0.95, zSign * W * 0.44);
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
  BALLOON = opts.podPalette && opts.podPalette.length > 0 ? opts.podPalette : DEFAULT_BALLOON_PODS;
  const accent = opts.accentColor ?? 0x28e868;
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

  root.add(createGrille(scale, mobile, accent));
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
  if (opts.hullColor != null) hullMat.color.setHex(opts.hullColor);
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
