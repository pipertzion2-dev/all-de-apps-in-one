import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import type { ArtworkCrop } from "@/lib/artwork-atlas";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { createPatternInset } from "@/lib/artwork-three";

function lineMat(color: number, opacity = 0.65): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

function wireMat(color: number, opacity = 0.55): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity, depthWrite: false });
}

export function floatGeo(pts: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** 3D quarter-note — sphere head + stem + flag curve. */
export function buildMusicNote(color: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const mat = wireMat(color, 0.85);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.28 * scale, 12, 12), mat));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 1.1 * scale, 6), mat);
  stem.position.set(0.22 * scale, 0.65 * scale, 0);
  g.add(stem);
  const flagPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 20; i++) {
    const f = i / 20;
    flagPts.push(new THREE.Vector3(0.22 * scale + Math.sin(f * Math.PI) * 0.4 * scale, 1.1 * scale + f * 0.5 * scale, 0));
  }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(flagPts), lineMat(color, 0.8)));
  return g;
}

/** Guitar body silhouette from BREATH AWAY graphic. */
export function buildGuitarSilhouette(color: number): THREE.Group {
  const g = new THREE.Group();
  const bodyPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const a = t * Math.PI * 2;
    const rx = 1.2 + Math.sin(a * 2) * 0.35;
    const ry = 0.85 + Math.cos(a * 3) * 0.2;
    bodyPts.push(new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * ry - 0.3, 0));
  }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(bodyPts), lineMat(color, 0.7)));
  const neckPts = [new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 2.8, 0), new THREE.Vector3(0.15, 3.2, 0)];
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(neckPts), lineMat(color, 0.75)));
  for (let s = 0; s < 6; s++) {
    g.add(new THREE.LineSegments(floatGeo([-0.2 + s * 0.08, 2.8, 0, 0.2 + s * 0.08, 2.8, 0]), lineMat(color, 0.5)));
  }
  return g;
}

/** Stacked lyric blocks — cyan / magenta layers from Play graphic. */
export function buildTextStack(cyan: number, magenta: number): THREE.Group {
  const g = new THREE.Group();
  [[cyan, -0.6], [magenta, 0], [cyan, 0.55], [magenta, 1.1]].forEach(([col, y], i) => {
    const block = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 0.38, 0.08)),
      lineMat(col as number, 0.55 - i * 0.05),
    );
    block.position.y = y as number;
    block.position.z = i * 0.04;
    g.add(block);
  });
  return g;
}

/** Music staff — five lines across Seeds graphic header. */
export function buildStaffLines(color: number, width = 12): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const y = 1.2 - i * 0.35;
    g.add(new THREE.LineSegments(floatGeo([-width / 2, y, 0, width / 2, y, 0]), lineMat(color, 0.45)));
  }
  return g;
}

/** Collage panel — framed 3D quad with graphic crop pattern + interior motif. */
export function buildCollagePanel(
  variant: "gold" | "purple" | "grain" | "courtyard",
  frameColor: number,
  innerColor: number,
  palette: GraphicPalette,
  texture?: THREE.Texture,
  crop?: ArtworkCrop,
): THREE.Group {
  const g = new THREE.Group();
  const w = 2.8;
  const h = 2.2;
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.12)),
    lineMat(frameColor, palette.lineOpacity + 0.15),
  );
  g.add(frame);

  const inner = new THREE.Group();
  inner.position.z = 0.08;

  if (texture && crop) {
    inner.add(createPatternInset(texture, crop, w * 0.86, h * 0.86, palette.patternOpacity));
  }

  switch (variant) {
    case "gold": {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI;
        inner.add(new THREE.LineSegments(floatGeo([0, 0, 0, Math.cos(a) * 0.9, Math.sin(a) * 0.7, 0]), lineMat(innerColor, 0.5)));
      }
      inner.add(new THREE.Mesh(new THREE.RingGeometry(0.3, 0.55, 16), wireMat(frameColor, 0.4)));
      break;
    }
    case "purple": {
      const oval: THREE.Vector3[] = [];
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        oval.push(new THREE.Vector3(Math.cos(a) * 0.55, Math.sin(a) * 0.75, 0));
      }
      inner.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(oval), lineMat(innerColor, 0.65)));
      inner.add(new THREE.LineSegments(floatGeo([-0.5, 0.2, 0, 0.5, -0.2, 0]), lineMat(innerColor, 0.35)));
      break;
    }
    case "grain": {
      for (let i = 0; i < 14; i++) {
        const y = -0.8 + i * 0.12;
        inner.add(new THREE.LineSegments(floatGeo([-1, y, 0, 1, y + Math.sin(i) * 0.04, 0]), lineMat(innerColor, 0.35)));
      }
      break;
    }
    case "courtyard": {
      const vp = new THREE.Group();
      vp.position.y = -0.2;
      for (let i = 0; i <= 6; i++) {
        const f = i / 6;
        const z = -f * 0.8;
        const spread = 0.4 + f * 0.9;
        vp.add(new THREE.LineSegments(floatGeo([-spread, -0.6, z, spread, -0.6, z]), lineMat(innerColor, 0.4)));
        vp.add(new THREE.LineSegments(floatGeo([-spread * 0.6, 0.4, z, -spread, -0.6, z]), lineMat(innerColor, 0.3)));
        vp.add(new THREE.LineSegments(floatGeo([spread * 0.6, 0.4, z, spread, -0.6, z]), lineMat(innerColor, 0.3)));
      }
      inner.add(vp);
      break;
    }
  }
  g.add(inner);
  return g;
}

/** Six-point star from Orbit graphic. */
export function buildStar(color: number, size = 1): THREE.Group {
  const g = new THREE.Group();
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.42;
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  pts.push(pts[0].clone());
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, 0.85)));
  return g;
}

/** Glitch face — offset rectangular shards from Orbit graphic center. */
export function buildGlitchFace(teal: number, copper: number): THREE.Group {
  const g = new THREE.Group();
  const shards = [
    [-0.8, 0.6, 0.9, 0.5, teal],
    [0.1, 0.5, 0.7, 0.45, copper],
    [-0.3, -0.2, 1.1, 0.55, teal],
    [0.4, -0.4, 0.6, 0.4, copper],
    [0, 0.1, 0.5, 0.35, 0x5ba8a0],
  ];
  shards.forEach(([x, y, w, h, col], i) => {
    const shard = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(w as number, h as number)),
      lineMat(col as number, 0.6),
    );
    shard.position.set(x as number, y as number, i * 0.06);
    shard.rotation.z = (i - 2) * 0.08;
    g.add(shard);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), wireMat(col as number, 0.7));
    eye.position.set((x as number) + (i % 2 ? 0.15 : -0.1), (y as number) + 0.1, 0.1);
    g.add(eye);
  });
  return g;
}

/** Blue rose — layered petal rings from Orbit graphic. */
export function buildRose(color: number): THREE.Group {
  const g = new THREE.Group();
  for (let ring = 0; ring < 5; ring++) {
    const petals = 6 + ring * 2;
    const r = 0.25 + ring * 0.18;
    for (let p = 0; p < petals; p++) {
      const a = (p / petals) * Math.PI * 2 + ring * 0.3;
      const petalPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const f = i / 12;
        const pa = a + Math.sin(f * Math.PI) * 0.5;
        petalPts.push(new THREE.Vector3(Math.cos(pa) * r * f, Math.sin(pa) * r * f, ring * 0.05));
      }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(petalPts), lineMat(color, 0.55 - ring * 0.06)));
    }
  }
  return g;
}

/** Moss / botanical web mass from lower Orbit graphic. */
export function buildMossWeb(teal: number, copper: number): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const len = 1.2 + (i % 4) * 0.3;
    g.add(new THREE.LineSegments(floatGeo([0, 0, 0, Math.cos(a) * len, Math.sin(a) * len * 0.6, 0]), lineMat(i % 2 ? copper : teal, 0.35)));
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    g.add(new THREE.LineSegments(floatGeo([Math.cos(a) * 0.8, Math.sin(a) * 0.5, 0, Math.cos(a + 1) * 1.4, Math.sin(a + 1) * 0.9, 0]), lineMat(teal, 0.25)));
  }
  return g;
}

/** Crystal vessel — faceted security graphic spheres. */
export function buildCrystalVessel(color: number, size = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), wireMat(color, 0.75)));
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(size * 0.55, 0), wireMat(color, 0.45)));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.85, 0.04, 6, 32), wireMat(color, 0.5));
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return g;
}

/** Ornate filigree heart frame from FOREVER YOURS graphic. */
export function buildFiligreeFrame(color: number): THREE.Group {
  const g = new THREE.Group();
  const heartPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    const x = 1.6 * Math.pow(Math.sin(t), 3);
    const y = 1.3 * Math.cos(t) - 0.5 * Math.cos(2 * t) - 0.2 * Math.cos(3 * t) - 0.1 * Math.cos(4 * t);
    heartPts.push(new THREE.Vector3(x, y, 0));
  }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(heartPts), lineMat(color, 0.7)));

  for (let band = 0; band < 4; band++) {
    const thornPts: THREE.Vector3[] = [];
    const w = 3.5 - band * 0.3;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const x = (t - 0.5) * w;
      const thorn = Math.sin(t * Math.PI * 22) * 0.25 + Math.sin(t * Math.PI * 48) * 0.1;
      thornPts.push(new THREE.Vector3(x, thorn - band * 0.5, band * 0.08));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(thornPts), lineMat(color, 0.45 - band * 0.06)));
  }
  return g;
}

/** Heart wire + bob-wire band from security graphic stripes. */
export function buildHeartWire(color: number): THREE.Group {
  const g = new THREE.Group();
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI * 2;
    pts.push(new THREE.Vector3(1.1 * Math.pow(Math.sin(t), 3), 0.9 * Math.cos(t) - 0.35 * Math.cos(2 * t), 0));
  }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, 0.8)));
  return g;
}

/** Barbed wire strand — Pyracrypt-grade, scroll-reactive. */
export function buildBarbedWireStrand(
  length: number,
  y: number,
  wireColor: number,
  barbColor: number,
  axis: "x" | "y" = "x",
): THREE.Group {
  const g = new THREE.Group();
  g.position.y = y;
  const matWire = lineMat(wireColor, 0.9);
  const matBarb = lineMat(barbColor, 0.95);
  const hw = length / 2;
  const BARB_SP = 1.2;
  const BS = 0.35;

  if (axis === "x") {
    g.add(new THREE.LineSegments(floatGeo([-hw, 0, 0, hw, 0, 0]), matWire));
    const barbPts: number[] = [];
    for (let b = 0; b <= Math.floor(length / BARB_SP); b++) {
      const x = -hw + b * BARB_SP;
      barbPts.push(x - BS, BS, 0, x + BS, -BS, 0, x - BS, -BS, 0, x + BS, BS, 0);
    }
    g.add(new THREE.LineSegments(floatGeo(barbPts), matBarb));
  } else {
    g.add(new THREE.LineSegments(floatGeo([0, -hw, 0, 0, hw, 0]), matWire));
    const barbPts: number[] = [];
    for (let b = 0; b <= Math.floor(length / BARB_SP); b++) {
      const yp = -hw + b * BARB_SP;
      barbPts.push(0, yp - BS, BS, 0, yp + BS, -BS, 0, yp - BS, -BS, 0, yp + BS, BS);
    }
    g.add(new THREE.LineSegments(floatGeo(barbPts), matBarb));
  }
  return g;
}

/** Hanging paper / packaging sheet from API graphic. */
export function buildHangingPaper(color: number): THREE.Group {
  const g = new THREE.Group();
  const sheet = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.2, 1.6)), lineMat(color, 0.7));
  g.add(sheet);
  g.add(new THREE.LineSegments(floatGeo([-0.3, 0.8, 0, 0.3, 0.8, 0]), lineMat(color, 0.5)));
  g.add(new THREE.LineSegments(floatGeo([0, 0.8, 0, 0, 1.2, 0.3]), lineMat(color, 0.4)));
  const fold = new THREE.LineSegments(floatGeo([0, -0.2, 0, 0, 0.4, 0.02]), lineMat(color, 0.45));
  g.add(fold);
  return g;
}

/** Jewel-case fold panel from API graphic. */
export function buildJewelCasePanel(color: number): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 0.15, 1.4)), lineMat(color, 0.75));
  base.position.y = -0.5;
  g.add(base);
  const lid = new THREE.Group();
  lid.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 0.12, 1.4)), lineMat(color, 0.85)));
  lid.position.set(0, -0.42, -0.7);
  lid.userData.isLid = true;
  g.add(lid);
  return g;
}

/** Flower bloom from API graphic corners. */
export function buildFlower(color: number, petals = 8): THREE.Group {
  const g = new THREE.Group();
  for (let p = 0; p < petals; p++) {
    const a = (p / petals) * Math.PI * 2;
    const petalPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const f = i / 10;
      const pa = a + Math.sin(f * Math.PI) * 0.6;
      petalPts.push(new THREE.Vector3(Math.cos(pa) * 0.9 * f, Math.sin(pa) * 0.9 * f, 0));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(petalPts), lineMat(color, 0.6)));
  }
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), wireMat(color, 0.7)));
  return g;
}

/** Diamond fist crystal from Hardware graphic. */
export function buildDiamondFist(color: number, size = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), wireMat(color, 0.8)));
  const fistPts: number[] = [];
  for (let f = 0; f < 4; f++) {
    const x = -0.6 + f * 0.35;
    fistPts.push(x, -size * 1.2, 0.2, x, -size * 0.5, 0.4);
  }
  fistPts.push(-0.3, -size * 1.3, 0, 0.5, -size * 1.1, 0);
  g.add(new THREE.LineSegments(floatGeo(fistPts), lineMat(color, 0.55)));
  return g;
}

/** Colored cube gem from Hardware graphic. */
export function buildColoredCube(color: number, size = 0.8): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)), lineMat(color, 0.75)));
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(size * 0.35, 0), wireMat(color, 0.5)));
  return g;
}

/** Vintage photo frame from Hardware graphic. */
export function buildVintageFrame(color: number): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2.6, 0.1)), lineMat(color, 0.65)));
  for (let i = 0; i < 3; i++) {
    const fig = new THREE.Group();
    fig.add(new THREE.LineSegments(floatGeo([0, 0, 0, 0, 0.8, 0]), lineMat(color, 0.4)));
    fig.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), wireMat(color, 0.45)));
    fig.position.set(-0.5 + i * 0.5, -0.3, 0.06);
    g.add(fig);
  }
  return g;
}

/** Swimmer silhouettes from Hardware graphic upper strip. */
export function buildSwimmers(color: number): THREE.Group {
  const g = new THREE.Group();
  [[-1.2, 0], [0.3, 0.2], [1.4, -0.1]].forEach(([x, y], i) => {
    const swim = new THREE.Group();
    const body: THREE.Vector3[] = [];
    for (let j = 0; j <= 16; j++) {
      const f = j / 16;
      body.push(new THREE.Vector3(f * 1.4 - 0.2, Math.sin(f * Math.PI * 2) * 0.15, 0));
    }
    swim.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(body), lineMat(color, 0.55)));
    swim.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), wireMat(color, 0.5)));
    swim.position.set(x, y, i * 0.05);
    swim.rotation.z = i * 0.15;
    g.add(swim);
  });
  return g;
}

type ElementFactory = (
  palette: GraphicPalette,
  texture?: THREE.Texture,
  crop?: ArtworkCrop,
) => THREE.Group;

const PLAY_BUILDERS: Record<string, ElementFactory> = {
  "note-1": (p) => buildMusicNote(p.primary, 1.1),
  "note-2": (p) => buildMusicNote(p.highlight, 0.95),
  "text-stack": (p) => buildTextStack(p.secondary, p.tertiary),
  guitar: (p, tex, crop) => {
    const g = buildGuitarSilhouette(p.primary);
    if (tex && crop) g.add(createPatternInset(tex, crop, 2.4, 3.2, p.patternOpacity));
    return g;
  },
};

const SEEDS_BUILDERS: Record<string, ElementFactory> = {
  "quad-tl": (p, tex, crop) => buildCollagePanel("gold", p.primary, p.tertiary, p, tex, crop),
  "quad-tr": (p, tex, crop) => buildCollagePanel("purple", p.secondary, p.highlight, p, tex, crop),
  "quad-bl": (p, tex, crop) => buildCollagePanel("grain", p.primary, 0x8b7355, p, tex, crop),
  "quad-br": (p, tex, crop) => buildCollagePanel("courtyard", p.primary, p.wire, p, tex, crop),
};

const ORBIT_BUILDERS: Record<string, ElementFactory> = {
  "star-1": (p) => buildStar(p.secondary, 1.1),
  "star-2": (p) => buildStar(p.tertiary, 0.9),
  face: (p, tex, crop) => {
    const g = buildGlitchFace(p.wire, p.secondary);
    if (tex && crop) g.add(createPatternInset(tex, crop, 2.8, 2.6, p.patternOpacity));
    return g;
  },
  rose: (p) => buildRose(p.highlight),
  moss: (p, tex, crop) => {
    const g = buildMossWeb(p.wire, p.secondary);
    if (tex && crop) g.add(createPatternInset(tex, crop, 3.2, 2, p.patternOpacity * 0.85));
    return g;
  },
};

const SECURITY_BUILDERS: Record<string, ElementFactory> = {
  "crystal-top": (p) => buildCrystalVessel(p.primary, 1.1),
  "crystal-bot": (p) => buildCrystalVessel(p.secondary, 0.95),
  frame: (p, tex, crop) => {
    const g = buildFiligreeFrame(p.primary);
    if (tex && crop) g.add(createPatternInset(tex, crop, 3.4, 1.6, p.patternOpacity));
    return g;
  },
  heart: (p) => buildHeartWire(p.primary),
};

const API_BUILDERS: Record<string, ElementFactory> = {
  "flower-1": (p, tex, crop) => {
    const g = buildFlower(p.primary, 9);
    if (tex && crop) g.add(createPatternInset(tex, crop, 2.2, 2.2, p.patternOpacity));
    return g;
  },
  "flower-2": (p, tex, crop) => {
    const g = buildFlower(p.secondary, 7);
    if (tex && crop) g.add(createPatternInset(tex, crop, 1.8, 1.8, p.patternOpacity));
    return g;
  },
  paper: (p, tex, crop) => {
    const g = buildHangingPaper(p.primary);
    if (tex && crop) g.add(createPatternInset(tex, crop, 2, 1.4, p.patternOpacity));
    return g;
  },
  fold: (p, tex, crop) => {
    const g = buildJewelCasePanel(p.primary);
    if (tex && crop) g.add(createPatternInset(tex, crop, 2, 1.4, p.patternOpacity));
    return g;
  },
};

const HARDWARE_BUILDERS: Record<string, ElementFactory> = {
  "hand-cube": (p, tex, crop) => {
    const g = buildDiamondFist(p.primary, 1.2);
    if (tex && crop) g.add(createPatternInset(tex, crop, 2.4, 2.6, p.patternOpacity));
    return g;
  },
  "green-cube": (p) => buildColoredCube(p.secondary, 0.9),
  "red-cube": (p) => buildColoredCube(p.tertiary, 0.85),
  figures: (p, tex, crop) => {
    const g = buildVintageFrame(p.primary);
    if (tex && crop) g.add(createPatternInset(tex, crop, 1.8, 2.4, p.patternOpacity));
    return g;
  },
  swim: (p, tex, crop) => {
    const g = buildSwimmers(p.primary);
    if (tex && crop) g.add(createPatternInset(tex, crop, 2.8, 1.2, p.patternOpacity * 0.8));
    return g;
  },
};

const BUILDERS: Record<FeatureId, Record<string, ElementFactory>> = {
  play: PLAY_BUILDERS,
  seeds: SEEDS_BUILDERS,
  orbit: ORBIT_BUILDERS,
  security: SECURITY_BUILDERS,
  api: API_BUILDERS,
  hardware: HARDWARE_BUILDERS,
};

export function buildGraphicElement(
  variant: FeatureId,
  elementId: string,
  palette: GraphicPalette,
  texture?: THREE.Texture,
  crop?: ArtworkCrop,
): THREE.Group | null {
  const factory = BUILDERS[variant]?.[elementId];
  if (!factory) return null;
  return factory(palette, texture, crop);
}

/** Signature backdrop layers — muted so UI cards stay readable. */
export function addSignatureBackdrop(variant: FeatureId, scene: THREE.Scene, palette: GraphicPalette) {
  const op = palette.lineOpacity;
  switch (variant) {
    case "play": {
      const lines: THREE.Line[] = [];
      for (let i = 0; i < 24; i++) {
        const pos = new Float32Array(96 * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const line = new THREE.Line(geo, lineMat(palette.wire, op * 0.35 + (i / 24) * 0.12));
        line.position.y = (i - 12) * 0.45;
        line.position.z = -8;
        line.userData.isWave = true;
        scene.add(line);
        lines.push(line);
      }
      scene.userData.waveLines = lines;
      break;
    }
    case "seeds": {
      const staff = buildStaffLines(palette.primary, 18);
      staff.position.set(0, 5.5, -6);
      scene.add(staff);
      scene.userData.staff = staff;
      break;
    }
    case "orbit": {
      const nodes = [
        [-6, -1, -4],
        [6.5, -2, -5],
        [0, 1, -6],
        [-7, 2, -3.5],
        [2, -3, -4.5],
      ];
      const dotGeo = new THREE.BufferGeometry();
      dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(nodes.flat(), 3));
      const dots = new THREE.Points(
        dotGeo,
        new THREE.PointsMaterial({ color: palette.secondary, size: 0.45, transparent: true, opacity: op * 0.9 }),
      );
      scene.add(dots);
      const web = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat(palette.secondary, op * 0.55));
      web.userData.isOrbitWeb = true;
      web.userData.orbitNodes = nodes;
      scene.add(web);
      scene.userData.orbitWeb = web;
      break;
    }
    case "security": {
      const wireGroup = new THREE.Group();
      wireGroup.position.z = -7;
      [-2.5, 0, 2.5].forEach((y, i) => {
        const strand = buildBarbedWireStrand(20, y, palette.wire, palette.highlight, "x");
        strand.position.z = -i * 2;
        strand.userData.isBobWire = true;
        wireGroup.add(strand);
      });
      scene.add(wireGroup);
      scene.userData.bobWire = wireGroup;
      break;
    }
    case "api": {
      const sweep = new THREE.LineSegments(floatGeo([-12, 0, -5, 12, 0, -5]), lineMat(palette.secondary, op * 0.65));
      sweep.userData.isSweep = true;
      scene.add(sweep);
      scene.userData.packSweep = sweep;
      break;
    }
    case "hardware":
      break;
  }
}
