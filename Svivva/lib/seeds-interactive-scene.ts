import * as THREE from "three";
import type { GraphicPalette } from "@/lib/artwork-palettes";
import { buildAdvancedGraphicCluster } from "@/lib/feature-advanced-mesh";
import { buildFeatureBloomScene } from "@/lib/feature-bloom-scene";
import type { SeedsWorkflowState } from "@/lib/seeds-workflow-state";

export type SeedsInteractiveScene = {
  root: THREE.Group;
  tick: (t: number, state: SeedsWorkflowState, mouse: { x: number; y: number }, focus: number) => void;
};

type SeedsRefs = {
  core: THREE.Mesh;
  innerCore: THREE.Mesh;
  pods: THREE.Group[];
  panels: THREE.Group[];
};

function emissiveOf(mesh: THREE.Mesh): THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial {
  return mesh.material as THREE.MeshPhysicalMaterial;
}

export function buildSeedsInteractiveScene(palette: GraphicPalette): SeedsInteractiveScene {
  const root = new THREE.Group();

  const cluster = buildAdvancedGraphicCluster("seeds", palette);
  cluster.group.scale.setScalar(1.1);
  cluster.group.position.set(0, 0, 0.6);
  root.add(cluster.group);

  const refs = cluster.group.userData.seedsRefs as SeedsRefs | undefined;

  const bloom = buildFeatureBloomScene("seeds", "hero");
  bloom.root.scale.setScalar(0.82);
  bloom.root.position.set(0, -0.2, -3);
  root.add(bloom.root);

  const tick = (t: number, state: SeedsWorkflowState, mouse: { x: number; y: number }, focus: number) => {
    const scrollProxy =
      state.phase === "complete"
        ? 1
        : state.phase === "building"
          ? 0.55 + state.avgBuildProgress * 0.35
          : state.phase === "verifying"
            ? 0.45
            : state.phase === "parsed"
              ? 0.3 + state.activePods * 0.08
              : state.phase === "uploading"
                ? 0.15 + Math.sin(t * 4) * 0.05
                : 0.08;

    cluster.tick(t, scrollProxy, mouse);
    bloom.tick(t, scrollProxy, mouse);

    const uploadPulse = state.phase === "uploading" ? 1 + Math.sin(t * 6) * 0.12 : 1;
    const buildSpin = state.phase === "building" ? 1.8 : state.phase === "verifying" ? 1.3 : 1;

    cluster.group.position.x = mouse.x * 0.18 * focus;
    cluster.group.position.y = mouse.y * 0.12 * focus;
    cluster.group.rotation.y = scrollProxy * 0.4 + mouse.x * 0.1 * focus;
    cluster.group.rotation.x = mouse.y * 0.06 * focus - scrollProxy * 0.05;

    if (refs) {
      refs.core.scale.setScalar(uploadPulse * (1 + state.avgBuildProgress * 0.15));
      refs.innerCore.rotation.y = -t * 0.55 * buildSpin - scrollProxy;
      refs.innerCore.rotation.x = Math.sin(t * 0.5) * 0.12;

      const coreMat = emissiveOf(refs.core);
      if ("emissiveIntensity" in coreMat) {
        coreMat.emissiveIntensity =
          state.phase === "uploading" ? 2.2 : state.phase === "building" ? 1.8 : state.phase === "complete" ? 2 : 1.2;
      }

      refs.pods.forEach((pod, i) => {
        const active = i < state.activePods;
        const buildingThis = active && state.phase === "building";
        const targetScale = active ? 1 + (buildingThis ? Math.sin(t * 3 + i) * 0.06 : 0) : 0.72;
        pod.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
        pod.rotation.y = t * 0.3 * (active ? buildSpin : 0.4) + i * 0.5;

        pod.children.forEach((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const mat = child.material as THREE.MeshPhysicalMaterial;
          if (!("emissiveIntensity" in mat)) return;
          mat.emissiveIntensity = active ? (state.activeStep === "build" ? 1.6 : 1.25) : 0.35;
          mat.opacity = active ? 0.95 : 0.45;
        });
      });

      refs.panels.forEach((panel, i) => {
        const lit = i < state.activePods;
        panel.visible = lit || state.phase === "idle";
        panel.rotation.y = Math.sin(t * 0.25 + i) * 0.06 + (lit ? scrollProxy * 0.15 : 0);
      });
    }

    bloom.root.rotation.y = scrollProxy * 0.2 - mouse.x * 0.04;
  };

  return { root, tick };
}
