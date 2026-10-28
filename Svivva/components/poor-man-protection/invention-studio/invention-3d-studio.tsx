"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROTECT_BRAND } from "@/lib/poor-man-protection/invention-studio/brand";
import {
  getMaterialPreset,
  MATERIAL_PRESETS,
} from "@/lib/poor-man-protection/invention-studio/materials";
import type { StudioComponent } from "@/lib/poor-man-protection/invention-studio/types";

type Props = {
  inventionId: string;
  components: StudioComponent[];
  onChange: (next: StudioComponent[]) => void;
};

function uid(): string {
  return `cmp_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function Invention3DStudio({ inventionId, components, onChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    root: THREE.Group;
    meshes: Map<string, THREE.Mesh>;
    imported: THREE.Group;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);

  const rebuildMeshes = useCallback(
    (list: StudioComponent[]) => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      for (const [, mesh] of ctx.meshes) {
        ctx.root.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      ctx.meshes.clear();

      list.forEach((c, index) => {
        if (!c.visible) return;
        let geo: THREE.BufferGeometry;
        if (c.shape === "cylinder") {
          geo = new THREE.CylinderGeometry(
            c.dimensions.x / 2,
            c.dimensions.x / 2,
            c.dimensions.y,
            32,
          );
        } else if (c.shape === "sphere") {
          geo = new THREE.SphereGeometry(
            Math.max(c.dimensions.x, c.dimensions.y, c.dimensions.z) / 2,
            32,
            24,
          );
        } else {
          geo = new THREE.BoxGeometry(c.dimensions.x, c.dimensions.y, c.dimensions.z);
        }
        const preset = getMaterialPreset(c.material);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(preset.color),
          metalness: preset.metalness,
          roughness: preset.roughness,
          transparent: preset.transparent,
          opacity: preset.opacity,
          wireframe,
          emissive:
            c.id === selectedId ? new THREE.Color(PROTECT_BRAND.steel) : new THREE.Color(0x000000),
          emissiveIntensity: c.id === selectedId ? 0.35 : 0,
        });
        const mesh = new THREE.Mesh(geo, mat);
        const explodeOffset = exploded ? (index - list.length / 2) * 0.55 : 0;
        mesh.position.set(c.position.x + explodeOffset, c.position.y, c.position.z);
        mesh.rotation.set(c.rotation.x, c.rotation.y, c.rotation.z);
        mesh.userData.componentId = c.id;
        ctx.root.add(mesh);
        ctx.meshes.set(c.id, mesh);

        if (c.calloutNumber) {
          const canvas = document.createElement("canvas");
          canvas.width = 128;
          canvas.height = 128;
          const g = canvas.getContext("2d");
          if (g) {
            g.fillStyle = PROTECT_BRAND.steel;
            g.beginPath();
            g.arc(64, 64, 52, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = "#fff";
            g.font = "bold 56px sans-serif";
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillText(String(c.calloutNumber), 64, 68);
          }
          const tex = new THREE.CanvasTexture(canvas);
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: tex, transparent: true }),
          );
          sprite.scale.set(0.35, 0.35, 0.35);
          sprite.position.set(0, c.dimensions.y / 2 + 0.35, 0);
          mesh.add(sprite);
        }
      });
    },
    [exploded, selectedId, wireframe],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 720;
    const height = mount.clientHeight || 420;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0c1216");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(3.2, 2.4, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;

    const hemi = new THREE.HemisphereLight(0xb8d4e0, 0x1a1014, 0.7);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(4, 6, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(new THREE.Color(PROTECT_BRAND.burgundy), 0.35);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    const grid = new THREE.GridHelper(12, 24, PROTECT_BRAND.steel, "#1e2a32");
    scene.add(grid);

    const root = new THREE.Group();
    scene.add(root);
    const imported = new THREE.Group();
    scene.add(imported);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      root,
      meshes: new Map(),
      imported,
    };

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || 720;
      const h = mount.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...root.children], true);
      const hit = hits.find((h) => h.object.userData.componentId);
      if (hit) setSelectedId(String(hit.object.userData.componentId));
    };
    renderer.domElement.addEventListener("pointerdown", onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onClick);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    rebuildMeshes(components);
  }, [components, rebuildMeshes]);

  const selected = components.find((c) => c.id === selectedId) || null;

  const addComponent = () => {
    const n = components.length + 1;
    const next: StudioComponent = {
      id: uid(),
      inventionId,
      name: `Component ${n}`,
      shape: "box",
      dimensions: { x: 0.8, y: 0.4, z: 0.6 },
      position: { x: (n - 1) * 0.3, y: 0.2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      material: "stainless_steel",
      calloutNumber: n,
      visible: true,
    };
    onChange([...components, next]);
    setSelectedId(next.id);
  };

  const patchSelected = (patch: Partial<StudioComponent>) => {
    if (!selected) return;
    onChange(components.map((c) => (c.id === selected.id ? { ...c, ...patch } : c)));
  };

  const captureScreenshot = () => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.renderer.render(ctx.scene, ctx.camera);
    const url = ctx.renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `invention-studio-${inventionId.slice(0, 8)}.png`;
    a.click();
  };

  const exportSceneJson = () => {
    const blob = new Blob([JSON.stringify({ inventionId, components }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `invention-model-${inventionId.slice(0, 8)}.json`;
    a.click();
  };

  const onImportModel = async (file: File) => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.imported.clear();
    const url = URL.createObjectURL(file);
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".glb") || name.endsWith(".gltf")) {
        const gltf = await new GLTFLoader().loadAsync(url);
        ctx.imported.add(gltf.scene);
      } else if (name.endsWith(".stl")) {
        const geo = await new STLLoader().loadAsync(url);
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(PROTECT_BRAND.steel),
            metalness: 0.6,
            roughness: 0.35,
            wireframe,
          }),
        );
        ctx.imported.add(mesh);
      } else if (name.endsWith(".obj")) {
        const obj = await new OBJLoader().loadAsync(url);
        ctx.imported.add(obj);
      } else {
        alert("Supported imports: GLB, GLTF, STL, OBJ");
      }
      const box = new THREE.Box3().setFromObject(ctx.imported);
      const size = box.getSize(new THREE.Vector3()).length() || 1;
      const scale = 2.5 / size;
      ctx.imported.scale.setScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      ctx.imported.position.sub(center.multiplyScalar(scale));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={addComponent}
          className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
        >
          Add component
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setWireframe((w) => !w)}>
          {wireframe ? "Solid mode" : "Wireframe"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setExploded((e) => !e)}>
          {exploded ? "Collapse" : "Exploded view"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setMeasureMode((m) => !m)}>
          {measureMode ? "Hide measures" : "Measurements"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={captureScreenshot}>
          Screenshot
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={exportSceneJson}>
          Export model JSON
        </Button>
        <label className="inline-flex items-center text-xs px-3 h-8 rounded-md border border-border/60 cursor-pointer hover:bg-muted/40">
          Import GLB/GLTF/STL/OBJ
          <input
            type="file"
            className="hidden"
            accept=".glb,.gltf,.stl,.obj,model/gltf-binary,model/gltf+json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportModel(f);
            }}
          />
        </label>
      </div>

      <div
        ref={mountRef}
        className="w-full h-[420px] rounded-xl overflow-hidden border border-[#5B8DA8]/30"
        style={{ background: "linear-gradient(180deg,#0c1216,#121a20)" }}
      />

      {measureMode && selected ? (
        <p className="text-xs text-muted-foreground">
          Selected “{selected.name}” dimensions: {selected.dimensions.x.toFixed(2)} ×{" "}
          {selected.dimensions.y.toFixed(2)} × {selected.dimensions.z.toFixed(2)} (studio units)
        </p>
      ) : null}

      {selected ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-[#5B8DA8]/25 bg-[#5B8DA8]/5 p-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={selected.name}
              onChange={(e) => patchSelected({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Shape</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={selected.shape}
              onChange={(e) => patchSelected({ shape: e.target.value as StudioComponent["shape"] })}
            >
              <option value="box">Box</option>
              <option value="cylinder">Cylinder</option>
              <option value="sphere">Sphere</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Material</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={selected.material}
              onChange={(e) =>
                patchSelected({ material: e.target.value as StudioComponent["material"] })
              }
            >
              {MATERIAL_PRESETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Callout #</Label>
            <Input
              type="number"
              value={selected.calloutNumber ?? ""}
              onChange={(e) =>
                patchSelected({
                  calloutNumber: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          {(["x", "y", "z"] as const).map((axis) => (
            <div key={axis} className="space-y-1">
              <Label>Dim {axis.toUpperCase()}</Label>
              <Input
                type="number"
                step="0.05"
                value={selected.dimensions[axis]}
                onChange={(e) =>
                  patchSelected({
                    dimensions: {
                      ...selected.dimensions,
                      [axis]: Number(e.target.value) || 0.1,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Orbit to inspect. Click a component to highlight and edit. Models stay linked to this
          invention record.
        </p>
      )}
    </div>
  );
}
