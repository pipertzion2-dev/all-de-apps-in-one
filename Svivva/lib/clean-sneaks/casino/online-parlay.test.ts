import { describe, expect, it } from "vitest";
import {
  canPlaceParlay,
  combineOdds,
  placeParlay,
  potentialPayout,
  settleParlay,
  PARLAY_MIN_STAKE,
} from "@/lib/clean-sneaks/casino/parlay";
import {
  cashAppPackUrl,
  getCreditPack,
  parseLocalRedeemCode,
} from "@/lib/clean-sneaks/casino/credit-packs";
import { createRoom, joinRoom, getRoom } from "@/lib/clean-sneaks/casino/multiplayer/store";
import { normalizeRoomCode } from "@/lib/clean-sneaks/casino/multiplayer/types";

describe("steal bundle parlay", () => {
  it("requires at least two legs and a minimum stake", () => {
    expect(canPlaceParlay(500, 10, ["win_hand", "steal_once"]).ok).toBe(false);
    expect(canPlaceParlay(500, PARLAY_MIN_STAKE, ["win_hand"]).ok).toBe(false);
    expect(canPlaceParlay(500, PARLAY_MIN_STAKE, ["win_hand", "steal_once"]).ok).toBe(true);
  });

  it("multiplies leg odds and pays only when every leg hits", () => {
    const odds = combineOdds(["win_hand", "steal_once"]);
    expect(odds).toBeCloseTo(1.75 * 1.45, 2);
    expect(potentialPayout(100, ["win_hand", "steal_once"])).toBe(Math.floor(100 * odds));

    const placed = placeParlay(500, 100, ["win_hand", "steal_once"], () => "t1");
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(placed.creditsAfter).toBe(400);

    const win = settleParlay(placed.ticket, {
      humanWonSolo: true,
      steals: 1,
      bundleSize: 4,
      dropsToTable: 2,
      clearedTable: false,
    });
    expect(win.won).toBe(true);
    expect(win.payout).toBe(placed.ticket.potentialPayout);

    const miss = settleParlay(placed.ticket, {
      humanWonSolo: true,
      steals: 0,
      bundleSize: 9,
      dropsToTable: 0,
      clearedTable: true,
    });
    expect(miss.won).toBe(false);
    expect(miss.payout).toBe(0);
  });
});

describe("credit packs", () => {
  it("builds Cash App deep links and parses redeem codes", () => {
    const pack = getCreditPack("stack_medium");
    expect(pack).toBeTruthy();
    expect(cashAppPackUrl(pack!, "pipertzion")).toBe("https://cash.app/$pipertzion/7");
    expect(parseLocalRedeemCode("SB-7-750")?.id).toBe("stack_medium");
    expect(parseLocalRedeemCode("nope")).toBeNull();
  });
});

describe("multiplayer rooms", () => {
  it("creates and joins a room by code", () => {
    const room = createRoom({
      hostPlayerId: "host1",
      displayName: "Dealer",
      mode: "online",
      maxPlayers: 2,
      ante: 50,
    });
    expect(room.code).toHaveLength(6);
    expect(getRoom(room.code)?.players).toHaveLength(1);

    const joined = joinRoom({
      code: normalizeRoomCode(room.code.toLowerCase()),
      playerId: "guest1",
      displayName: "Guest",
      bluetoothDeviceId: "bt-abc",
    });
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.room.players).toHaveLength(2);
    expect(joined.room.players[1]?.bluetoothDeviceId).toBe("bt-abc");
  });
});
