import type { StudioComponent } from "./types";

export type MaterialPreset = {
  id: StudioComponent["material"];
  label: string;
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
};

/** Material look matches Protect steel/burgundy chamber lighting. */
export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: "chrome",
    label: "Chrome",
    color: "#c8d4dc",
    metalness: 0.95,
    roughness: 0.12,
    opacity: 1,
    transparent: false,
  },
  {
    id: "aluminum",
    label: "Aluminum",
    color: "#9aa8b0",
    metalness: 0.75,
    roughness: 0.35,
    opacity: 1,
    transparent: false,
  },
  {
    id: "stainless_steel",
    label: "Stainless steel",
    color: "#5B8DA8",
    metalness: 0.85,
    roughness: 0.28,
    opacity: 1,
    transparent: false,
  },
  {
    id: "glass",
    label: "Glass",
    color: "#b8d4e0",
    metalness: 0.1,
    roughness: 0.05,
    opacity: 0.35,
    transparent: true,
  },
  {
    id: "plastic",
    label: "Plastic",
    color: "#6B2C4E",
    metalness: 0.05,
    roughness: 0.55,
    opacity: 1,
    transparent: false,
  },
  {
    id: "rubber",
    label: "Rubber",
    color: "#2a2a2a",
    metalness: 0,
    roughness: 0.9,
    opacity: 1,
    transparent: false,
  },
  {
    id: "carbon_fiber",
    label: "Carbon fiber",
    color: "#1a1a1e",
    metalness: 0.4,
    roughness: 0.45,
    opacity: 1,
    transparent: false,
  },
];

export function getMaterialPreset(id: StudioComponent["material"]): MaterialPreset {
  return MATERIAL_PRESETS.find((m) => m.id === id) || MATERIAL_PRESETS[0];
}
