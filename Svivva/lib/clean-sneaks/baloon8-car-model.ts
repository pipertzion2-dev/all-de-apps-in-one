/**
 * Procedural BALOON8 Tripo-style puffer coupe (Three.js).
 *
 * Matches the studio.tripo3d.ai futuristic-car reference:
 * low sports-coupe silhouette, densely quilted iridescent balloon pods,
 * tall neon-green rectangular grille with ornate e8 emblem, solid chrome
 * disc wheels, roof spoiler, front claw toes, rear BALOON8 plate + exhausts.
 */
import * as THREE from "three";

/** Brand mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

/** Iridescent abalone / oil-slick balloon palette — bright enough to read at night. */
const BALLOON = [
  0x1a3a42, 0x245858, 0x2a7078, 0x1e4860, 0x3a5890, 0x2a8068, 0x4a4898, 0x329888, 0x5a68b0,
  0x3ac8a8, 0x286878, 0x346080, 0x5a4a88, 0x2e6870,
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

/** Stacked stylized e8 / eB monogram from the Tripo hub + grille. */
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
    g.addColorStop(0.45, "#e8eef4");
    g.addColorStop(0.78, "#b8c4d0");
    g.addColorStop(1, "#6a7888");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d0d8e0";
    ctx.lineWidth = w * 0.035;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#90a0b0";
    ctx.lineWidth = w * 0.012;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    drawE8Logo(ctx, w / 2, h / 2, w * 0.42, "#0a1018");
  });
}

/** Tall rectangular neon grille face matching Tripo reference. */
function grilleTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 640, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#7aff9e");
    bg.addColorStop(0.35, "#36f078");
    bg.addColorStop(0.7, "#18c858");
    bg.addColorStop(1, "#0a8040");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Soft LED / sunburst dots
    ctx.fillStyle = "rgba(230,255,240,0.5)";
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      const r = w * (0.12 + (i % 6) * 0.045);
      ctx.beginPath();
      ctx.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r * 1.15, w * 0.011, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ornate oval emblem
    ctx.fillStyle = "#f4f8f6";
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.22, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0a1810";
    ctx.lineWidth = w * 0.018;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.16, h * 0.145, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawE8Logo(ctx, w / 2, h / 2, w * 0.32, "#0a1810");
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

function balloonMat(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.82,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    iridescence: 1,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [120, 920],
    envMapIntensity: 2.1,
    emissive: new THREE.Color(0x0a1820),
    emissiveIntensity: 0.18,
  });
}

/**
 * Sports-coupe side profile (Tripo reference).
 * xNorm: -1 rear … +1 front
 * yNorm: 0 rocker … 1 roof
 */
function coupeProfile(
  xNorm: number,
  yNorm: number,
): { halfW: number; cabin: boolean; inside: boolean; archCut: boolean } {
  const t = (xNorm + 1) / 2; // 0 rear → 1 front

  // Side plan: wide mid, slight taper at nose / tail
  const plan =
    0.72 +
    0.22 * Math.sin(t * Math.PI) -
    0.1 * Math.exp(-Math.pow((t - 0.92) / 0.1, 2)) -
    0.08 * Math.exp(-Math.pow((t - 0.06) / 0.12, 2));

  // Roof line: low hood → greenhouse → short deck
  let roof: number;
  if (t < 0.18) {
    // Rear deck / spoiler shelf
    roof = 0.62 + t * 0.6;
  } else if (t < 0.52) {
    // Cabin greenhouse
    roof = 0.88 + 0.12 * Math.sin(((t - 0.18) / 0.34) * Math.PI);
  } else if (t < 0.78) {
    // Windscreen rake into hood
    const u = (t - 0.52) / 0.26;
    roof = 0.95 - u * 0.42;
  } else {
    // Long hood taper
    const u = (t - 0.78) / 0.22;
    roof = 0.53 - u * 0.18;
  }

  if (yNorm > roof * 1.02) {
    return { halfW: 0, cabin: false, inside: false, archCut: false };
  }

  // Wheel-arch cutouts so chrome discs read clearly
  const archY = yNorm < 0.34;
  const frontArch = Math.abs(t - 0.78) < 0.11 && archY;
  const rearArch = Math.abs(t - 0.22) < 0.11 && archY;
  const archCut = frontArch || rearArch;

  const cabin = t > 0.22 && t < 0.58 && yNorm > 0.55;
  const pinch = cabin ? 0.82 : 1;
  const flare = yNorm < 0.2 ? 1.06 : 1;
  const halfW = plan * pinch * flare * (0.55 + 0.45 * Math.sin(Math.min(1, yNorm / roof) * Math.PI));

  return {
    halfW: Math.max(0, halfW),
    cabin,
    inside: !archCut,
    archCut,
  };
}

/** Solid coupe body so the silhouette always reads as a car (not a sphere pile). */
function createCoupeHull(scale: number, mobile: boolean): {
  group: THREE.Group;
  hullMat: THREE.MeshPhysicalMaterial;
} {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const segs = mobile ? 10 : 16;

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a3848,
    metalness: 0.75,
    roughness: 0.28,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    iridescence: 0.85,
    iridescenceIOR: 1.4,
    iridescenceThicknessRange: [160, 700],
    envMapIntensity: 1.6,
    emissive: new THREE.Color(0x0c2030),
    emissiveIntensity: 0.22,
  });

  // Main body — slightly flattened coupe volume (not a fat capsule blob)
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(W * 0.34, L * 0.58, segs, segs * 2), hullMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, H * 0.36, 0);
  body.scale.set(1, 0.62, 0.98);
  g.add(body);

  // Cabin greenhouse — distinct roof hump like Tripo
  const cabin = new THREE.Mesh(
    new THREE.SphereGeometry(W * 0.34, segs, segs),
    hullMat.clone(),
  );
  cabin.position.set(-L * 0.08, H * 0.68, 0);
  cabin.scale.set(1.2, 0.62, 0.88);
  g.add(cabin);

  // Hood slab — long nose
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(L * 0.36, H * 0.14, W * 0.7),
    hullMat.clone(),
  );
  hood.position.set(L * 0.28, H * 0.3, 0);
  g.add(hood);

  // Rear haunches — wider rear like Tripo coupe
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(L * 0.24, H * 0.22, W * 0.78),
    hullMat.clone(),
  );
  deck.position.set(-L * 0.34, H * 0.38, 0);
  g.add(deck);

  // Dark rocker / chassis
  const rocker = new THREE.Mesh(
    new THREE.BoxGeometry(L * 0.78, H * 0.12, W * 0.78),
    new THREE.MeshStandardMaterial({ color: 0x06080c, roughness: 0.9, metalness: 0.2 }),
  );
  rocker.position.set(0, H * 0.12, 0);
  g.add(rocker);

  return { group: g, hullMat };
}

/** Densely quilted balloon pods following the coupe surface (Tripo puffer look). */
function createBalloonShell(scale: number, budget: number, mobile: boolean): THREE.InstancedMesh {
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const rows = mobile ? 26 : 42;
  const maxCols = mobile ? 40 : 64;
  // Larger pods so quilt cells read like Tripo pillows, not dust
  const podR = s(mobile ? 0.048 : 0.042, scale);
  const geo = new THREE.SphereGeometry(podR, mobile ? 8 : 12, mobile ? 6 : 10);
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
    dummy.rotation.set(((idx * 19) % 9) * 0.04, ((idx * 13) % 7) * 0.05, ((idx * 11) % 5) * 0.04);
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
    color.setHex(hex);
    mesh.setColorAt(idx, color);
    idx++;
    return true;
  };

  for (let row = 0; row < rows && idx < budget; row++) {
    const yNorm = row / Math.max(1, rows - 1);
    const y = s(0.04, scale) + yNorm * H * 0.96;
    const cols = Math.floor(maxCols * (0.6 + 0.4 * Math.sin(yNorm * Math.PI)));
    for (let col = 0; col < cols && idx < budget; col++) {
      const u = col / Math.max(1, cols - 1);
      const xNorm = u * 2 - 1;
      const { halfW, cabin, inside, archCut } = coupeProfile(xNorm, yNorm);
      if (archCut || !inside || halfW < 0.12) continue;

      const x = xNorm * L * 0.48;
      const radius = halfW * W * 0.52;
      const base = (0.95 + ((row * 5 + col * 3) % 7) / 18) * (cabin ? 0.88 : 1);
      const sx = base * 1.15;
      const sy = base * 0.95;
      const sz = base * 1.15;

      for (const side of [-1, 1] as const) {
        if (idx >= budget) break;
        const z = side * radius * (0.95 + ((row + col) % 3) * 0.015);
        place(x, y, z, sx, sy, sz, BALLOON[(row + col + (side > 0 ? 0 : 5)) % BALLOON.length]!);
      }

      // Roof / hood top fill so the coupe reads solid from chase cam
      if (yNorm > 0.35 && yNorm < 0.92 && Math.abs(xNorm) < 0.85) {
        for (const f of [0.35, 0.0] as const) {
          if (idx >= budget) break;
          const z = f === 0 ? 0 : ((col % 2) * 2 - 1) * radius * f;
          place(
            x,
            y + s(0.01, scale),
            z,
            sx * 0.95,
            sy * 0.9,
            sz * 0.95,
            BALLOON[(row * 3 + col) % BALLOON.length]!,
          );
        }
      }
    }
  }

  // Nose bumper quilt
  const noseN = mobile ? 90 : 160;
  for (let i = 0; i < noseN && idx < budget; i++) {
    const a = (i / noseN) * Math.PI * 2;
    const ring = 0.4 + (i % 4) * 0.14;
    const y = H * (0.18 + (i % 6) * 0.06);
    const z = Math.sin(a) * W * 0.3 * ring;
    const x = L * 0.47 + Math.cos(a) * s(0.05, scale) * ring;
    const base = 1.05 + (i % 3) * 0.06;
    place(x, y, z, base, base * 0.9, base, BALLOON[i % BALLOON.length]!);
  }

  // Tail quilt
  const tailN = mobile ? 70 : 130;
  for (let i = 0; i < tailN && idx < budget; i++) {
    const a = (i / tailN) * Math.PI * 2;
    const y = H * (0.22 + (i % 7) * 0.07);
    const z = Math.sin(a) * W * 0.32;
    const x = -L * 0.46 + Math.cos(a) * s(0.045, scale);
    const base = 1.0 + (i % 4) * 0.05;
    place(x, y, z, base, base * 0.9, base, BALLOON[(i + 4) % BALLOON.length]!);
  }

  mesh.count = idx;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createGrille(scale: number, mobile: boolean): THREE.Group {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);

  // Tall rectangular neon face (Tripo)
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.34, H * 0.48),
    new THREE.MeshPhysicalMaterial({
      map: grilleTexture(),
      emissive: new THREE.Color(0x28e868),
      emissiveIntensity: mobile ? 2.0 : 2.6,
      metalness: 0.15,
      roughness: 0.28,
      side: THREE.DoubleSide,
    }),
  );
  face.position.set(L * 0.505, H * 0.4, 0);
  face.rotation.y = Math.PI / 2;
  g.add(face);

  // Deep green bezel frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(s(0.04, scale), H * 0.52, W * 0.4),
    new THREE.MeshPhysicalMaterial({
      color: 0x0a2014,
      emissive: new THREE.Color(0x14c858),
      emissiveIntensity: 0.7,
      metalness: 0.45,
      roughness: 0.32,
    }),
  );
  frame.position.set(L * 0.48, H * 0.4, 0);
  g.add(frame);

  const glow = new THREE.PointLight(0x36f078, mobile ? 1.4 : 2.1, s(3.2, scale), 2);
  glow.position.set(L * 0.58, H * 0.4, 0);
  g.add(glow);

  return g;
}

/** Solid chrome disc wheels — opaque so they read at night like Tripo. */
function createChromeWheel(
  scale: number,
  xNorm: number,
  zSign: number,
  mobile: boolean,
): THREE.Group {
  const wheel = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const r = s(0.36, scale);
  const segs = mobile ? 20 : 36;

  // Dark tire sidewall
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, s(0.12, scale), segs),
    new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.78, metalness: 0.15 }),
  );
  tire.rotation.z = Math.PI / 2;
  wheel.add(tire);

  // Chrome face disc with e8 hub — bright so it reads at night
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.78, r * 0.78, s(0.045, scale), segs),
    new THREE.MeshPhysicalMaterial({
      map: hubcapTexture(),
      metalness: 0.95,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.2,
      emissive: new THREE.Color(0x607080),
      emissiveIntensity: 0.28,
    }),
  );
  disc.rotation.z = Math.PI / 2;
  disc.position.z = zSign * s(0.01, scale);
  wheel.add(disc);

  // Outer chrome ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r * 0.88, s(0.018, scale), 8, segs),
    new THREE.MeshPhysicalMaterial({
      color: 0xd8e4f0,
      metalness: 0.98,
      roughness: 0.1,
      envMapIntensity: 1.8,
    }),
  );
  ring.rotation.y = Math.PI / 2;
  wheel.add(ring);

  wheel.position.set(xNorm * L * 0.38, s(0.32, scale), zSign * W * 0.48);
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
      new THREE.CapsuleGeometry(s(0.03, scale), s(0.1, scale), 4, 8),
      mat.clone(),
    );
    (toe.material as THREE.MeshPhysicalMaterial).color.setHex(BALLOON[(i + 2) % BALLOON.length]!);
    toe.rotation.z = -Math.PI / 2 + t * 0.28;
    toe.position.set(L * 0.42, s(0.07, scale), zSign * W * 0.32 + t * s(0.07, scale));
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
    new THREE.PlaneGeometry(W * 0.36, H * 0.1),
    new THREE.MeshPhysicalMaterial({
      map: plateTexture(),
      emissive: new THREE.Color(0x22c860),
      emissiveIntensity: 0.45,
      metalness: 0.2,
      roughness: 0.4,
      side: THREE.DoubleSide,
    }),
  );
  plate.position.set(-L * 0.5, H * 0.36, 0);
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
    pipe.position.set(-L * 0.51, s(0.1, scale), (i - 2.5) * s(0.09, scale));
    row.add(pipe);
  }
  return row;
}

/** Small ornate roof spoiler from Tripo reference — readable from chase cam. */
function createSpoiler(scale: number): THREE.Group {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x243038,
    metalness: 0.75,
    roughness: 0.28,
    iridescence: 0.7,
    iridescenceThicknessRange: [200, 600],
    envMapIntensity: 1.6,
    emissive: new THREE.Color(0x102028),
    emissiveIntensity: 0.2,
  });

  const wing = new THREE.Mesh(new THREE.BoxGeometry(s(0.1, scale), s(0.045, scale), W * 0.5), mat);
  wing.position.set(-L * 0.3, H * 0.98, 0);
  wing.rotation.z = -0.18;
  g.add(wing);

  for (const side of [-1, 1] as const) {
    const stalk = new THREE.Mesh(
      new THREE.BoxGeometry(s(0.035, scale), s(0.1, scale), s(0.03, scale)),
      mat,
    );
    stalk.position.set(-L * 0.28, H * 0.9, side * W * 0.16);
    g.add(stalk);
  }
  return g;
}

function createMirrorPods(scale: number, zSign: number): THREE.Group {
  const g = new THREE.Group();
  const L = s(BALOON8_DIMS.length, scale);
  const W = s(BALOON8_DIMS.width, scale);
  const H = s(BALOON8_DIMS.height, scale);
  const mat = balloonMat();
  for (let i = 0; i < 4; i++) {
    const pod = new THREE.Mesh(new THREE.SphereGeometry(s(0.045, scale), 8, 8), mat.clone());
    (pod.material as THREE.MeshPhysicalMaterial).color.setHex(BALLOON[i % BALLOON.length]!);
    pod.position.set(
      L * 0.1 + (i % 2) * s(0.04, scale),
      H * 0.58,
      zSign * (W * 0.5 + (i % 3) * s(0.02, scale)),
    );
    g.add(pod);
  }
  return g;
}

/** Build one full BALOON8 Tripo coupe (+X nose/front, +Y up, +Z left). */
export function buildBaloon8Car(opts: Baloon8CarOptions): Baloon8CarBuild {
  const { scale, mobile = false, portrait = false } = opts;
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const glowMeshes: THREE.Mesh[] = [];
  const wheels: THREE.Group[] = [];

  const podBudget = opts.podBudget ?? (mobile ? (portrait ? 1600 : 2000) : portrait ? 2800 : 4000);

  const { group: hull, hullMat } = createCoupeHull(scale, mobile);
  root.add(hull);
  disposables.push(hullMat);

  const puffer = createBalloonShell(scale, podBudget, mobile);
  root.add(puffer);
  disposables.push(puffer.geometry);
  const pufferMat = puffer.material;
  if (Array.isArray(pufferMat)) pufferMat.forEach((m) => disposables.push(m));
  else disposables.push(pufferMat);

  root.add(createGrille(scale, mobile));
  root.add(createClawFeet(scale, 1, mobile));
  root.add(createClawFeet(scale, -1, mobile));
  root.add(createSpoiler(scale));

  const wheelFL = createChromeWheel(scale, 0.34, 1, mobile);
  const wheelRL = createChromeWheel(scale, -0.34, 1, mobile);
  const wheelFR = createChromeWheel(scale, 0.34, -1, mobile);
  const wheelRR = createChromeWheel(scale, -0.34, -1, mobile);
  wheels.push(wheelFL, wheelRL, wheelFR, wheelRR);
  root.add(wheelFL, wheelRL, wheelFR, wheelRR);

  root.add(createRearPlate(scale));
  root.add(createExhaustRow(scale, mobile));
  root.add(createMirrorPods(scale, 1));
  root.add(createMirrorPods(scale, -1));

  disposables.push(balloonMat());

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshStandardMaterial;
    if ((mat.emissiveIntensity ?? 0) > 0.4) glowMeshes.push(obj);
  });

  root.name = "Baloon8TripoCoupe";
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
