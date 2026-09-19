import { scoreToCredits } from "./credits";
import type { SessionCasinoState } from "./types";

export const CASINO_SESSION_KEY = "zzai.clean-sneaks.casinoSession";

export function emptyCasinoSession(): SessionCasinoState {
  return {
    walkingScore: 0,
    walkingDistance: 0,
    credits: 0,
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
    const walkingScore = Math.max(0, Math.floor(Number(parsed.walkingScore) || 0));
    const creditsRaw = Number(parsed.credits);
    return {
      ...emptyCasinoSession(),
      ...parsed,
      walkingScore,
      walkingDistance: Math.max(0, Math.floor(Number(parsed.walkingDistance) || 0)),
      // Legacy sessions: treat walking score as credits until an explicit balance exists.
      credits: Number.isFinite(creditsRaw)
        ? Math.max(0, Math.floor(creditsRaw))
        : scoreToCredits(walkingScore),
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

/**
 * Cash out the current walk into casino credits.
 * Only the score earned so far becomes spendable chips.
 */
export function saveWalkingScoreToSession(
  score: number,
  distance: number,
  unlockCasino = true,
): SessionCasinoState {
  const prev = readCasinoSession();
  const earned = scoreToCredits(score);
  return writeCasinoSession({
    ...prev,
    walkingScore: earned,
    walkingDistance: Math.max(0, Math.floor(distance)),
    credits: earned,
    casinoUnlocked: unlockCasino ? true : prev.casinoUnlocked,
    scoreAccepted: false,
  });
}

export function markScoreAccepted(): SessionCasinoState {
  const prev = readCasinoSession();
  return writeCasinoSession({ ...prev, scoreAccepted: true, casinoUnlocked: true });
}

export function setSessionCredits(credits: number): SessionCasinoState {
  const prev = readCasinoSession();
  return writeCasinoSession({
    ...prev,
    credits: Math.max(0, Math.floor(credits)),
  });
}

export function recordCardGameResult(won: boolean, creditDelta = 0): SessionCasinoState {
  const prev = readCasinoSession();
  return writeCasinoSession({
    ...prev,
    cardGamesPlayed: prev.cardGamesPlayed + 1,
    cardGamesWon: prev.cardGamesWon + (won ? 1 : 0),
    credits: Math.max(0, Math.floor(prev.credits + creditDelta)),
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
