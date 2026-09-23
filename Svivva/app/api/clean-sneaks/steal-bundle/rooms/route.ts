import { NextRequest, NextResponse } from "next/server";
import { createRoom, getRoom, joinRoom, patchRoom } from "@/lib/clean-sneaks/casino/multiplayer/store";
import { normalizeRoomCode, toPublicRoom } from "@/lib/clean-sneaks/casino/multiplayer/types";

export const dynamic = "force-dynamic";

/** Create a new online / nearby table. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hostPlayerId = String(body.hostPlayerId || "").slice(0, 64);
    const displayName = String(body.displayName || "Host").slice(0, 24);
    const mode = body.mode === "nearby" ? "nearby" : "online";
    const maxPlayers = body.maxPlayers === 3 ? 3 : 2;
    const ante = Math.max(0, Math.floor(Number(body.ante) || 50));
    if (!hostPlayerId) {
      return NextResponse.json({ error: "hostPlayerId required" }, { status: 400 });
    }
    const room = createRoom({
      hostPlayerId,
      displayName,
      mode,
      maxPlayers,
      ante,
      bluetoothAdvertised: Boolean(body.bluetoothAdvertised),
    });
    return NextResponse.json({ room: toPublicRoom(room) });
  } catch (err) {
    console.error("steal-bundle room create:", err);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

/** Poll room state or join via query. */
export async function GET(request: NextRequest) {
  const code = normalizeRoomCode(request.nextUrl.searchParams.get("code") || "");
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({ room: toPublicRoom(room) });
}

/** Join, ready-up, publish game state / moves, close. */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const code = normalizeRoomCode(String(body.code || ""));
    const action = String(body.action || "");
    const playerId = String(body.playerId || "").slice(0, 64);
    if (!code || !action || !playerId) {
      return NextResponse.json({ error: "code, action, playerId required" }, { status: 400 });
    }

    if (action === "join") {
      const result = joinRoom({
        code,
        playerId,
        displayName: String(body.displayName || "Guest"),
        bluetoothDeviceId: body.bluetoothDeviceId
          ? String(body.bluetoothDeviceId).slice(0, 128)
          : undefined,
      });
      if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
      return NextResponse.json({ room: toPublicRoom(result.room) });
    }

    const result = patchRoom(code, (room) => {
      const seat = room.players.find((p) => p.id === playerId);
      if (!seat) return { error: "Not seated at this table." };
      seat.lastSeenAt = Date.now();
      seat.connected = true;

      if (action === "ready") {
        seat.ready = Boolean(body.ready);
        return;
      }

      if (action === "heartbeat") {
        return;
      }

      if (action === "set_phase") {
        if (room.hostPlayerId !== playerId) return { error: "Only host can change phase." };
        const phase = String(body.phase || "");
        if (!["lobby", "parlay", "dealing", "playing", "results", "closed"].includes(phase)) {
          return { error: "Invalid phase." };
        }
        room.phase = phase as typeof room.phase;
        return;
      }

      if (action === "publish_state") {
        if (room.hostPlayerId !== playerId) return { error: "Only host publishes state." };
        room.gameState = body.gameState ?? null;
        room.phase = (body.phase as typeof room.phase) || room.phase;
        room.pendingMove = null;
        return;
      }

      if (action === "submit_move") {
        if (room.hostPlayerId === playerId) return { error: "Host applies moves locally." };
        if (!body.move) return { error: "move required" };
        room.pendingMove = {
          playerId,
          moveJson: JSON.stringify(body.move),
          at: Date.now(),
        };
        return;
      }

      if (action === "clear_pending") {
        if (room.hostPlayerId !== playerId) return { error: "Only host clears pending." };
        room.pendingMove = null;
        return;
      }

      if (action === "set_parlay") {
        room.parlays[playerId] = body.ticket ?? null;
        return;
      }

      if (action === "signal") {
        room.signal = {
          from: playerId,
          payload: body.payload,
          at: Date.now(),
        };
        return;
      }

      if (action === "close") {
        if (room.hostPlayerId !== playerId) return { error: "Only host can close." };
        room.phase = "closed";
        return;
      }

      return { error: `Unknown action: ${action}` };
    });

    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
    return NextResponse.json({
      room: toPublicRoom(result.room),
      signal: result.room.signal,
    });
  } catch (err) {
    console.error("steal-bundle room patch:", err);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}
