/** Shared types for online / nearby Steal Bundle multiplayer. */

import type { CardGameState } from "../types";
import type { ParlayTicket } from "../parlay";

export type MultiplayerMode = "online" | "nearby" | "solo";

export type SeatRole = "host" | "guest";

export type RoomPlayer = {
  id: string;
  displayName: string;
  role: SeatRole;
  ready: boolean;
  connected: boolean;
  /** Optional BLE device id when joined via nearby/Bluetooth discovery. */
  bluetoothDeviceId?: string;
  lastSeenAt: number;
};

export type RoomPhase = "lobby" | "parlay" | "dealing" | "playing" | "results" | "closed";

export type StealBundleRoom = {
  code: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  mode: Exclude<MultiplayerMode, "solo">;
  maxPlayers: 2 | 3;
  hostPlayerId: string;
  players: RoomPlayer[];
  phase: RoomPhase;
  /** Host-authoritative game snapshot when playing. */
  gameState: CardGameState | null;
  /** Pending move from a non-host seat (host applies). */
  pendingMove: { playerId: string; moveJson: string; at: number } | null;
  parlays: Record<string, ParlayTicket | null>;
  ante: number;
  bluetoothAdvertised: boolean;
  /** Last WebRTC signaling payload for nearby peers. */
  signal: { from: string; payload: unknown; at: number } | null;
};

export type RoomPublic = Omit<StealBundleRoom, "pendingMove"> & {
  pendingMoveFrom: string | null;
};

export const ROOM_TTL_MS = 1000 * 60 * 45;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]!;
  }
  return out;
}

export function normalizeRoomCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

export function toPublicRoom(room: StealBundleRoom): RoomPublic {
  const { pendingMove, ...rest } = room;
  return {
    ...rest,
    pendingMoveFrom: pendingMove?.playerId ?? null,
  };
}
