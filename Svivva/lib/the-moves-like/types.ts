export type MovesLikeScreen = "train" | "moves" | "studio" | "cypher" | "profile";

export type MoveCategory =
  | "toprock"
  | "footwork"
  | "freezes"
  | "power"
  | "transitions"
  | "combos"
  | "other";

export type MoveDifficulty = "beginner" | "intermediate" | "advanced" | "pro";

/** User-captured or sample movement asset. */
export type Movement = {
  id: string;
  name: string;
  category: MoveCategory;
  tags: string[];
  notes: string;
  difficulty?: MoveDifficulty;
  techniqueNotes?: string;
  /** IndexedDB key for local video blob (when user-uploaded) */
  videoBlobId?: string;
  /** Object URL session cache — not persisted */
  videoObjectUrl?: string;
  /** Optional remote / sample clip URL */
  videoUrl?: string;
  thumbnailDataUrl?: string;
  durationSec: number;
  favorite: boolean;
  /** Distinguish seeded demo rows from user content */
  source: "user" | "sample";
  createdAt: string;
  updatedAt: string;
};

export type TimelineClip = {
  id: string;
  movementId: string;
  /** Start offset in the routine timeline (seconds) */
  startSec: number;
  durationSec: number;
  note?: string;
  playbackRate?: number;
};

export type Routine = {
  id: string;
  name: string;
  clips: TimelineClip[];
  /** Optional local music blob id / object URL */
  musicBlobId?: string;
  musicObjectUrl?: string;
  musicName?: string;
  bpm?: number;
  createdAt: string;
  updatedAt: string;
};

export type CypherChallenge = {
  id: string;
  title: string;
  prompt: string;
  kind: "challenge" | "round" | "combo";
  sample: true;
  focus: string;
  createdAt: string;
};

export type CypherSubmission = {
  id: string;
  challengeId: string;
  authorLabel: string;
  note: string;
  videoObjectUrl?: string;
  createdAt: string;
};

export type DancerProfile = {
  displayName: string;
  username: string;
  bio: string;
  styles: string[];
  signatureMoveIds: string[];
};

export const MOVE_CATEGORIES: { id: MoveCategory; label: string }[] = [
  { id: "toprock", label: "Toprock" },
  { id: "footwork", label: "Footwork" },
  { id: "freezes", label: "Freezes" },
  { id: "power", label: "Power moves" },
  { id: "transitions", label: "Transitions" },
  { id: "combos", label: "Combos" },
  { id: "other", label: "Other" },
];
