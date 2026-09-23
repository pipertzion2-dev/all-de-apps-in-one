"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  bluetoothHostLabel,
  getBluetoothSupport,
  pickNearbyBluetoothDevice,
} from "@/lib/clean-sneaks/casino/multiplayer/bluetooth";
import type { RoomPublic } from "@/lib/clean-sneaks/casino/multiplayer/types";

const PLAYER_ID_KEY = "zzai.steal-bundle.playerId";

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(PLAYER_ID_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(PLAYER_ID_KEY, id);
    return id;
  } catch {
    return `p_${Date.now().toString(36)}`;
  }
}

type Props = {
  ante: number;
  onReadyToPlay: (room: RoomPublic, playerId: string, isHost: boolean) => void;
  onBack: () => void;
};

export function MultiplayerLobby({ ante, onReadyToPlay, onBack }: Props) {
  const playerId = useRef(getOrCreatePlayerId()).current;
  const [name, setName] = useState("Player");
  const [mode, setMode] = useState<"online" | "nearby">("online");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ble = getBluetoothSupport();
  const launchedRef = useRef(false);

  const poll = useCallback(async (code: string) => {
    const res = await fetch(`/api/clean-sneaks/steal-bundle/rooms?code=${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.room as RoomPublic;
  }, []);

  useEffect(() => {
    if (!room || room.phase === "closed") return;
    const id = window.setInterval(async () => {
      const next = await poll(room.code);
      if (next) setRoom(next);
    }, 1600);
    return () => window.clearInterval(id);
  }, [room?.code, room?.phase, poll]);

  useEffect(() => {
    if (!room || launchedRef.current) return;
    const allReady = room.players.length >= 2 && room.players.every((p) => p.ready);
    if (allReady && (room.phase === "lobby" || room.phase === "parlay")) {
      launchedRef.current = true;
      onReadyToPlay(room, playerId, room.hostPlayerId === playerId);
    }
  }, [room, playerId, onReadyToPlay]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/clean-sneaks/steal-bundle/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostPlayerId: playerId,
          displayName: name,
          mode,
          maxPlayers: 2,
          ante,
          bluetoothAdvertised: mode === "nearby",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create room.");
        return;
      }
      setRoom(data.room);
    } catch {
      setError("Could not create room.");
    } finally {
      setBusy(false);
    }
  };

  const join = async (code = joinCode, bluetoothDeviceId?: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/clean-sneaks/steal-bundle/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          action: "join",
          playerId,
          displayName: name,
          bluetoothDeviceId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not join.");
        return;
      }
      setRoom(data.room);
    } catch {
      setError("Could not join room.");
    } finally {
      setBusy(false);
    }
  };

  const toggleReady = async () => {
    if (!room) return;
    const me = room.players.find((p) => p.id === playerId);
    const res = await fetch("/api/clean-sneaks/steal-bundle/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: room.code,
        action: "ready",
        playerId,
        ready: !me?.ready,
      }),
    });
    const data = await res.json();
    if (res.ok) setRoom(data.room);
  };

  const scanBluetooth = async () => {
    setError(null);
    const peer = await pickNearbyBluetoothDevice();
    if (!peer) {
      setError(ble.reason || "No Bluetooth device selected.");
      return;
    }
    // Device name may carry SB-CODE from host advertising convention.
    const fromName = peer.name.match(/SB-([A-Z0-9]{4,8})/i);
    if (fromName?.[1]) {
      setJoinCode(fromName[1].toUpperCase());
      await join(fromName[1].toUpperCase(), peer.deviceId);
      return;
    }
    setError(
      `Found ${peer.name}. Enter their room code to connect (Bluetooth paired the device).`,
    );
  };

  return (
    <div
      className="flex max-h-full w-full max-w-lg flex-col gap-4 overflow-y-auto px-4 py-6 text-center"
      data-testid="multiplayer-lobby"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#7EC8D9]">Live table</p>
        <h2 className="mt-1 font-serif text-2xl text-[#f7e7b0]">Online · Nearby Bluetooth</h2>
        <p className="mt-2 text-xs text-[#e8dcc0]/65">
          Host a table on the internet, or sit next to a friend — Bluetooth finds their device,
          then the room code syncs the deal.
        </p>
      </div>

      {!room && (
        <>
          <label className="block text-left text-xs text-[#e8dcc0]/70">
            Display name
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              className="mt-1 w-full rounded-md border border-[#d4af37]/35 bg-black/40 px-3 py-2 text-sm text-[#ffd76a]"
              data-testid="mp-display-name"
            />
          </label>

          <div className="flex justify-center gap-2">
            <Button
              variant={mode === "online" ? "default" : "outline"}
              className={
                mode === "online"
                  ? "bg-[#d4af37] text-[#1a1008]"
                  : "border-[#d4af37]/40 text-[#e8dcc0]"
              }
              onClick={() => setMode("online")}
              data-testid="button-mode-online"
            >
              Online world
            </Button>
            <Button
              variant={mode === "nearby" ? "default" : "outline"}
              className={
                mode === "nearby"
                  ? "bg-[#7EC8D9] text-[#0a1a20]"
                  : "border-[#7EC8D9]/40 text-[#7EC8D9]"
              }
              onClick={() => setMode("nearby")}
              data-testid="button-mode-nearby"
            >
              Nearby / Bluetooth
            </Button>
          </div>

          <Button
            className="bg-[#d4af37] text-[#1a1008]"
            disabled={busy}
            onClick={create}
            data-testid="button-host-table"
          >
            Host table · ante {ante.toLocaleString()}
          </Button>

          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              className="flex-1 rounded-md border border-[#d4af37]/35 bg-black/40 px-3 py-2 text-center text-sm tracking-[0.3em] text-[#ffd76a]"
              data-testid="mp-join-code"
            />
            <Button
              disabled={busy || joinCode.length < 4}
              onClick={() => join()}
              className="bg-[#7a1028] text-[#f7e7b0] hover:bg-[#9a1834]"
              data-testid="button-join-table"
            >
              Join
            </Button>
          </div>

          {mode === "nearby" && (
            <Button
              variant="outline"
              className="border-[#7EC8D9]/50 text-[#7EC8D9]"
              disabled={busy || !ble.available}
              onClick={scanBluetooth}
              data-testid="button-bluetooth-scan"
            >
              {ble.available ? "Scan Bluetooth for a friend" : "Bluetooth unavailable here"}
            </Button>
          )}
          {mode === "nearby" && !ble.available && ble.reason && (
            <p className="text-[11px] text-[#e8dcc0]/45">{ble.reason}</p>
          )}
        </>
      )}

      {room && (
        <div className="rounded-md border border-[#d4af37]/35 bg-black/40 px-4 py-4 text-left">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">
            {room.mode === "nearby" ? "Nearby table" : "Online table"}
          </p>
          <p
            className="mt-2 font-serif text-3xl tracking-[0.2em] text-[#ffd76a]"
            data-testid="mp-room-code"
          >
            {room.code}
          </p>
          {room.mode === "nearby" && room.hostPlayerId === playerId && (
            <p className="mt-1 text-[11px] text-[#7EC8D9]/80">
              Advertise as {bluetoothHostLabel(room.code)} if your OS supports BLE naming.
            </p>
          )}
          <ul className="mt-4 space-y-1 text-sm text-[#e8dcc0]/80">
            {room.players.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>
                  {p.displayName}
                  {p.id === playerId ? " (you)" : ""}
                  {p.bluetoothDeviceId ? " · BT" : ""}
                </span>
                <span className={p.ready ? "text-[#7dffb2]" : "text-[#e8dcc0]/45"}>
                  {p.ready ? "Ready" : "Waiting"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              className="bg-[#d4af37] text-[#1a1008]"
              onClick={toggleReady}
              data-testid="button-mp-ready"
            >
              {room.players.find((p) => p.id === playerId)?.ready ? "Unready" : "Ready up"}
            </Button>
            <Button
              variant="ghost"
              className="text-[#e8dcc0]/55"
              onClick={() => setRoom(null)}
            >
              Leave lobby
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-[#ff6b8a]" data-testid="mp-error">
          {error}
        </p>
      )}

      <Button variant="ghost" className="text-[#e8dcc0]/55" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}
