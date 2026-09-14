import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Real-world mockup dimensions in meters (4610 × 1880 × 1320 mm). */
export const BALOON8_DIMS = {
  length: 4.61,
  width: 1.88,
  height: 1.32,
} as const;

const IRIDESCENCE = [0x2a9d8f, 0x5b8da8, 0x7b4397, 0x3d9970, 0x4cc9c0];

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
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2);
    ctx.stroke();
    drawBLogo(ctx, w / 2, h / 2, w * 0.28);
  });
}

function frontPanelTexture(): THREE.CanvasTexture {
  return canvasTexture(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = "#0a2018";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * w, cy + Math.sin(a) * h);
      g.addColorStop(0, "rgba(0,255,120,0.95)");
      g.addColorStop(0.35, "rgba(0,180,90,0.55)");
      g.addColorStop(1, "rgba(0,40,20,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * w * 0.52, cy + Math.sin(a) * h * 0.52);
      ctx.stroke();
    }
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.22);
    rg.addColorStop(0, "#9dffb8");
    rg.addColorStop(0.45, "#00ff66");
    rg.addColorStop(1, "#004422");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    drawBLogo(ctx, cx, cy, w * 0.16);
  });
}

function insoleMandalaTexture(): THREE.CanvasTexture {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    for (let ring = 0; ring < 12; ring++) {
      const r = w * 0.05 + ring * w * 0.035;
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + ring * 0.04})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const wobble = 1 + Math.sin(a * (6 + ring)) * 0.08;
        const x = cx + Math.cos(a) * r * wobble;
        const y = cy + Math.sin(a) * r * wobble;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    drawBLogo(ctx, cx, cy, w * 0.22);
  });
}

function licensePlateTexture(): THREE.CanvasTexture {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0f4028");
    g.addColorStop(0.5, "#00cc66");
    g.addColorStop(1, "#0f4028");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 96px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BALOON8", w / 2, h / 2 + 4);
  });
}

/** Side-profile car-shoe hull as lathe geometry. */
function createHullGeometry(): THREE.BufferGeometry {
  const halfL = BALOON8_DIMS.length / 2;
  const h = BALOON8_DIMS.height;
  const profile: THREE.Vector2[] = [
    new THREE.Vector2(0.02, 0.08),
    new THREE.Vector2(halfL * 0.92, 0.06),
    new THREE.Vector2(halfL * 0.98, 0.18),
    new THREE.Vector2(halfL * 0.88, h * 0.42),
    new THREE.Vector2(halfL * 0.55, h * 0.72),
    new THREE.Vector2(halfL * 0.15, h * 0.88),
    new THREE.Vector2(halfL * 0.02, h * 0.82),
    new THREE.Vector2(0.02, h * 0.55),
  ];
  const geo = new THREE.LatheGeometry(profile, 64);
  geo.rotateY(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function createBubbleInstances(hull: THREE.BufferGeometry, count: number): THREE.InstancedMesh {
  const pos = hull.getAttribute("position") as THREE.BufferAttribute;
  const normal = hull.getAttribute("normal") as THREE.BufferAttribute;
  const bubbleGeo = new THREE.SphereGeometry(0.028, 10, 10);
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
  });
  const mesh = new THREE.InstancedMesh(bubbleGeo, bubbleMat, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const vi = Math.floor(Math.random() * pos.count);
    const x = pos.getX(vi);
    const y = pos.getY(vi);
    const z = pos.getZ(vi);
    const nx = normal.getX(vi);
    const ny = normal.getY(vi);
    const nz = normal.getZ(vi);
    const scale = 0.65 + Math.random() * 0.85;
    dummy.position.set(x + nx * 0.04 * scale, y + ny * 0.04 * scale, z + nz * 0.04 * scale);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.setHex(IRIDESCENCE[i % IRIDESCENCE.length]!);
    mesh.setColorAt(i, color);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function createWheel(side: 1 | -1): THREE.Group {
  const wheel = new THREE.Group();
  const radius = 0.34;
  const y = 0.34;
  const x = side * (BALOON8_DIMS.length * 0.22);

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.07, 16, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a2530,
      metalness: 0.4,
      roughness: 0.65,
      clearcoat: 0.4,
    }),
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.06, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xd8e8f8,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.55,
      transmission: 0.35,
      thickness: 0.2,
    }),
  );
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);

  const grid = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.78, 24),
    new THREE.MeshBasicMaterial({
      color: 0xaaccdd,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    }),
  );
  grid.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  wheel.add(grid);

  const hub = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.55, 32),
    new THREE.MeshStandardMaterial({
      map: hubcapTexture(),
      metalness: 0.6,
      roughness: 0.25,
    }),
  );
  hub.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  hub.position.x = side * 0.04;
  wheel.add(hub);

  wheel.position.set(x, y, side * (BALOON8_DIMS.width / 2 + 0.02));
  return wheel;
}

function createMirror(side: 1 | -1): THREE.Mesh {
  const mirror = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0x88eedd,
      metalness: 0.95,
      roughness: 0.08,
      clearcoat: 1,
      iridescence: 0.8,
      iridescenceIOR: 1.2,
    }),
  );
  mirror.position.set(
    BALOON8_DIMS.length * 0.08,
    BALOON8_DIMS.height * 0.72,
    side * (BALOON8_DIMS.width / 2 + 0.06),
  );
  return mirror;
}

function createFootwell(): THREE.Group {
  const well = new THREE.Group();
  const openingW = BALOON8_DIMS.width * 0.62;
  const openingL = BALOON8_DIMS.length * 0.48;

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(openingW * 0.42, 0.06, 16, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a2030,
      metalness: 0.7,
      roughness: 0.35,
      clearcoat: 0.6,
    }),
  );
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1, openingL / openingW, 1);
  collar.position.y = BALOON8_DIMS.height * 0.78;
  well.add(collar);

  const interior = new THREE.Mesh(
    new THREE.CylinderGeometry(openingW * 0.38, openingW * 0.34, 0.42, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );
  interior.position.y = BALOON8_DIMS.height * 0.58;
  well.add(interior);

  const insole = new THREE.Mesh(
    new THREE.CircleGeometry(openingW * 0.36, 48),
    new THREE.MeshStandardMaterial({
      map: insoleMandalaTexture(),
      roughness: 0.85,
      metalness: 0.1,
    }),
  );
  insole.rotation.x = -Math.PI / 2;
  insole.position.y = BALOON8_DIMS.height * 0.42;
  well.add(insole);

  const padGeo = mergeGeometries(
    Array.from({ length: 8 }, (_, i) => {
      const g = new THREE.BoxGeometry(0.04, 0.08, openingL * 0.7);
      g.translate(0, BALOON8_DIMS.height * 0.62, (i - 3.5) * 0.12);
      return g;
    }),
    false,
  );
  if (padGeo) {
    const pads = new THREE.Mesh(
      padGeo,
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.92 }),
    );
    well.add(pads);
  }

  return well;
}

function createFrontGrille(): THREE.Group {
  const grille = new THREE.Group();
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, BALOON8_DIMS.height * 0.55, BALOON8_DIMS.width * 0.72),
    new THREE.MeshStandardMaterial({
      map: frontPanelTexture(),
      emissive: new THREE.Color(0x00ff66),
      emissiveIntensity: 1.4,
      metalness: 0.2,
      roughness: 0.35,
    }),
  );
  panel.position.set(BALOON8_DIMS.length / 2 - 0.04, BALOON8_DIMS.height * 0.38, 0);
  grille.add(panel);
  return grille;
}

function createRear(): THREE.Group {
  const rear = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.28, 0.92),
    new THREE.MeshStandardMaterial({
      map: licensePlateTexture(),
      emissive: new THREE.Color(0x00cc55),
      emissiveIntensity: 0.8,
    }),
  );
  plate.position.set(-BALOON8_DIMS.length / 2 + 0.03, BALOON8_DIMS.height * 0.38, 0);
  rear.add(plate);

  for (let i = 0; i < 6; i++) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.04, 0.12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xdde8f0,
        metalness: 0.95,
        roughness: 0.12,
      }),
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(-BALOON8_DIMS.length / 2 + 0.08, 0.12, -0.22 + i * 0.088);
    rear.add(pipe);
  }

  for (let side of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const tail = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 12, 12),
        new THREE.MeshPhysicalMaterial({
          color: 0xff6688,
          emissive: 0xff2244,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1,
        }),
      );
      tail.position.set(
        -BALOON8_DIMS.length / 2 + 0.05,
        BALOON8_DIMS.height * (0.48 + i * 0.08),
        side * (BALOON8_DIMS.width * 0.38),
      );
      rear.add(tail);
    }
  }

  return rear;
}

export type Baloon8ShoeModel = {
  root: THREE.Group;
  bubbles: THREE.InstancedMesh;
  glowMeshes: THREE.Mesh[];
  dispose: () => void;
};

/** Build the full Baloon8 car-shoe from the four-view mockup. */
export function buildBaloon8Shoe(bubbleCount = 2200): Baloon8ShoeModel {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const hullGeo = createHullGeometry();
  disposables.push(hullGeo);

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
  const hull = new THREE.Mesh(hullGeo, hullMat);
  root.add(hull);
  disposables.push(hullMat);

  const bubbles = createBubbleInstances(hullGeo, bubbleCount);
  root.add(bubbles);
  disposables.push(bubbles.geometry, bubbles.material as THREE.Material);

  root.add(createWheel(1), createWheel(-1));
  root.add(createMirror(1), createMirror(-1));
  root.add(createFootwell());
  root.add(createFrontGrille());
  root.add(createRear());

  root.position.y = -0.02;
  root.rotation.y = -Math.PI / 2;

  const glowMeshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity && mat.emissiveIntensity > 0.5) glowMeshes.push(obj);
    }
  });

  return {
    root,
    bubbles,
    glowMeshes,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            const std = m as THREE.MeshStandardMaterial;
            std.map?.dispose();
            m.dispose();
          });
          obj.geometry.dispose();
        }
      });
    },
  };
}
