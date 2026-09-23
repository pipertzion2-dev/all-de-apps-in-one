/**
 * Ephemeral Steal Bundle room store.
 * Survives warm serverless instances; rooms expire after ROOM_TTL_MS.
 * For production scale, swap for Redis/Neon — this is intentionally simple.
 */

import {
  generateRoomCode,
  normalizeRoomCode,
  ROOM_TTL_MS,
  type RoomPlayer,
  type StealBundleRoom,
} from "./types";

type GlobalRooms = {
  rooms: Map<string, StealBundleRoom>;
};

function bag(): GlobalRooms {
  const g = globalThis as typeof globalThis & { __stealBundleRooms?: GlobalRooms };
  if (!g.__stealBundleRooms) {
    g.__stealBundleRooms = { rooms: new Map() };
  }
  return g.__stealBundleRooms;
}

function purgeExpired(now = Date.now()) {
  const { rooms } = bag();
  for (const [code, room] of rooms) {
    if (room.expiresAt <= now || room.phase === "closed") {
      rooms.delete(code);
    }
  }
}

export function createRoom(input: {
  hostPlayerId: string;
  displayName: string;
  mode: "online" | "nearby";
  maxPlayers?: 2 | 3;
  ante?: number;
  bluetoothAdvertised?: boolean;
}): StealBundleRoom {
  purgeExpired();
  const { rooms } = bag();
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();
  const now = Date.now();
  const host: RoomPlayer = {
    id: input.hostPlayerId,
    displayName: input.displayName.slice(0, 24) || "Host",
    role: "host",
    ready: false,
    connected: true,
    lastSeenAt: now,
  };
  const room: StealBundleRoom = {
    code,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + ROOM_TTL_MS,
    mode: input.mode,
    maxPlayers: input.maxPlayers ?? 2,
    hostPlayerId: input.hostPlayerId,
    players: [host],
    phase: "lobby",
    gameState: null,
    pendingMove: null,
    parlays: { [input.hostPlayerId]: null },
    ante: Math.max(0, Math.floor(input.ante ?? 50)),
    bluetoothAdvertised: Boolean(input.bluetoothAdvertised),
    signal: null,
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): StealBundleRoom | null {
  purgeExpired();
  const normalized = normalizeRoomCode(code);
  return bag().rooms.get(normalized) ?? null;
}

export function saveRoom(room: StealBundleRoom): StealBundleRoom {
  const now = Date.now();
  room.updatedAt = now;
  room.expiresAt = now + ROOM_TTL_MS;
  bag().rooms.set(room.code, room);
  return room;
}

export function joinRoom(input: {
  code: string;
  playerId: string;
  displayName: string;
  bluetoothDeviceId?: string;
}): { ok: true; room: StealBundleRoom } | { ok: false; reason: string } {
  const room = getRoom(input.code);
  if (!room) return { ok: false, reason: "Room not found or expired." };
  if (room.phase !== "lobby") return { ok: false, reason: "Game already started." };

  const existing = room.players.find((p) => p.id === input.playerId);
  if (existing) {
    existing.connected = true;
    existing.lastSeenAt = Date.now();
    if (input.bluetoothDeviceId) existing.bluetoothDeviceId = input.bluetoothDeviceId;
    return { ok: true, room: saveRoom(room) };
  }

  if (room.players.length >= room.maxPlayers) {
    return { ok: false, reason: "Table is full." };
  }

  room.players.push({
    id: input.playerId,
    displayName: input.displayName.slice(0, 24) || "Guest",
    role: "guest",
    ready: false,
    connected: true,
    bluetoothDeviceId: input.bluetoothDeviceId,
    lastSeenAt: Date.now(),
  });
  room.parlays[input.playerId] = null;
  return { ok: true, room: saveRoom(room) };
}

export function patchRoom(
  code: string,
  mutator: (room: StealBundleRoom) => void | { error: string },
): { ok: true; room: StealBundleRoom } | { ok: false; reason: string } {
  const room = getRoom(code);
  if (!room) return { ok: false, reason: "Room not found or expired." };
  const result = mutator(room);
  if (result && "error" in result) return { ok: false, reason: result.error };
  return { ok: true, room: saveRoom(room) };
}
