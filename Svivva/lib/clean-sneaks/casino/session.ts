import type { SessionCasinoState } from "./types";

export const CASINO_SESSION_KEY = "zzai.clean-sneaks.casinoSession";

export function emptyCasinoSession(): SessionCasinoState {
  return {
    walkingScore: 0,
    walkingDistance: 0,
    casinoUnlocked: false,
    scoreAccepted: false,
    cardGamesPlayed: 0,
    cardGamesWon: 0,
  };
}

export function readCasinoSession(): SessionCasinoState {
  if (typeof window === "undefined") return emptyCasinoSession();
  try {
    const raw = window.localStorage.getItem(CASINO_SESSION_KEY);
    if (!raw) return emptyCasinoSession();
    const parsed = JSON.parse(raw) as Partial<SessionCasinoState>;
    return {
      ...emptyCasinoSession(),
      ...parsed,
      walkingScore: Math.max(0, Math.floor(Number(parsed.walkingScore) || 0)),
      walkingDistance: Math.max(0, Math.floor(Number(parsed.walkingDistance) || 0)),
      cardGamesPlayed: Math.max(0, Math.floor(Number(parsed.cardGamesPlayed) || 0)),
      cardGamesWon: Math.max(0, Math.floor(Number(parsed.cardGamesWon) || 0)),
      casinoUnlocked: Boolean(parsed.casinoUnlocked),
      scoreAccepted: Boolean(parsed.scoreAccepted),
    };
  } catch {
    return emptyCasinoSession();
  }
}

export function writeCasinoSession(next: SessionCasinoState): SessionCasinoState {
  if (typeof window === "undefined") return next;
  try {
    window.localStorage.setItem(CASINO_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

/** Persist walking score without wiping card-game counters. */
export function saveWalkingScoreToSession(
  score: number,
  distance: number,
  unlockCasino = true,
): SessionCasinoState {
  const prev = readCasinoSession();
  return writeCasinoSession({
    ...prev,
    walkingScore: Math.max(0, Math.floor(score)),
    walkingDistance: Math.max(0, Math.floor(distance)),
    casinoUnlocked: unlockCasino ? true : prev.casinoUnlocked,
    scoreAccepted: false,
  });
}

export function markScoreAccepted(): SessionCasinoState {
  const prev = readCasinoSession();
  return writeCasinoSession({ ...prev, scoreAccepted: true, casinoUnlocked: true });
}

export function recordCardGameResult(won: boolean): SessionCasinoState {
  const prev = readCasinoSession();
  return writeCasinoSession({
    ...prev,
    cardGamesPlayed: prev.cardGamesPlayed + 1,
    cardGamesWon: prev.cardGamesWon + (won ? 1 : 0),
  });
}

export function resetWalkSession(): SessionCasinoState {
  const prev = readCasinoSession();
  return writeCasinoSession({
    ...prev,
    walkingScore: 0,
    walkingDistance: 0,
    scoreAccepted: false,
  });
}
