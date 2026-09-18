/** Three macro faces on the homepage journey cube: begin → game → home. */
export type HomepageJourneyFace = "begin" | "game" | "home";

export const JOURNEY_FACE_ORDER: readonly HomepageJourneyFace[] = ["begin", "game", "home"] as const;

export type JourneyRotation = { x: number; y: number };

/** Corner view — all three journey faces visible at once. */
export const JOURNEY_CORNER_ROTATION: JourneyRotation = { x: -0.58, y: 0.72 };

/** Rotation that brings each journey face forward toward the camera. */
export const JOURNEY_FACE_ROTATIONS: Record<HomepageJourneyFace, JourneyRotation> = {
  begin: { x: -0.26, y: 0 },
  game: { x: -0.26, y: -Math.PI / 2 },
  home: { x: -Math.PI / 2 + 0.1, y: 0 },
};

/**
 * BoxGeometry material index → journey face.
 * Order: +x, -x, +y, -y, +z, -z
 */
export const JOURNEY_MATERIAL_FACE: Partial<Record<number, HomepageJourneyFace>> = {
  0: "game",
  2: "home",
  4: "begin",
};

export function journeyFaceFromMaterialIndex(index: number | undefined): HomepageJourneyFace | null {
  if (index == null) return null;
  return JOURNEY_MATERIAL_FACE[index] ?? null;
}

export function rotationForJourneyFace(
  face: HomepageJourneyFace,
  preferCornerOnBegin = true,
): JourneyRotation {
  if (face === "begin" && preferCornerOnBegin) return JOURNEY_CORNER_ROTATION;
  return JOURNEY_FACE_ROTATIONS[face];
}

export function nextJourneyFace(face: HomepageJourneyFace): HomepageJourneyFace {
  const idx = JOURNEY_FACE_ORDER.indexOf(face);
  return JOURNEY_FACE_ORDER[(idx + 1) % JOURNEY_FACE_ORDER.length];
}

export function prevJourneyFace(face: HomepageJourneyFace): HomepageJourneyFace {
  const idx = JOURNEY_FACE_ORDER.indexOf(face);
  return JOURNEY_FACE_ORDER[(idx + JOURNEY_FACE_ORDER.length - 1) % JOURNEY_FACE_ORDER.length];
}

/** Map legacy homepage hash / panel ids to journey faces. */
export function journeyFaceFromHash(hash: string): HomepageJourneyFace | null {
  const id = hash.replace(/^#/, "").trim();
  if (!id || id === "nav-cube") return "begin";
  if (id === "home-game" || id === "clean-sneaks") return "game";
  if (id === "home-explore") return "home";
  return null;
}

export function hashForJourneyFace(face: HomepageJourneyFace): string {
  if (face === "begin") return "nav-cube";
  if (face === "game") return "home-game";
  return "home-explore";
}
