import type { AudioCue } from "./types";

/**
 * Soft audio hooks — silent when assets or AudioContext are unavailable.
 * Wire real files under /public/clean-sneaks/audio/ later without changing callers.
 *
 * By default, cue URLs are NOT fetched (avoids 404 noise). Call
 * `AudioManager.enableAssets(true)` once files are present.
 */
type CueHandler = (cue: AudioCue) => void;

let handler: CueHandler | null = null;
let muted = false;
let assetsEnabled = false;

const ASSET_PATHS: Partial<Record<AudioCue, string>> = {
  walking_complete: "/clean-sneaks/audio/walking_complete.mp3",
  casino_ambience: "/clean-sneaks/audio/casino_ambience.mp3",
  casino_door: "/clean-sneaks/audio/casino_door.mp3",
  card_shuffle: "/clean-sneaks/audio/card_shuffle.mp3",
  card_deal: "/clean-sneaks/audio/card_deal.mp3",
  card_flip: "/clean-sneaks/audio/card_flip.mp3",
  card_match: "/clean-sneaks/audio/card_match.mp3",
  bundle_collect: "/clean-sneaks/audio/bundle_collect.mp3",
  bundle_steal: "/clean-sneaks/audio/bundle_steal.mp3",
  invalid_move: "/clean-sneaks/audio/invalid_move.mp3",
  victory: "/clean-sneaks/audio/victory.mp3",
};

const cache = new Map<string, HTMLAudioElement>();
const missing = new Set<string>();

function tryPlayUrl(url: string, volume = 0.55): void {
  if (typeof window === "undefined" || muted || !assetsEnabled) return;
  if (missing.has(url)) return;
  try {
    let audio = cache.get(url);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = "none";
      audio.addEventListener("error", () => {
        missing.add(url);
        cache.delete(url);
      });
      cache.set(url, audio);
    }
    audio.volume = volume;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      missing.add(url);
    });
  } catch {
    /* stay silent */
  }
}

export const AudioManager = {
  setMuted(value: boolean) {
    muted = value;
  },
  isMuted() {
    return muted;
  },
  enableAssets(value: boolean) {
    assetsEnabled = value;
  },
  setHandler(next: CueHandler | null) {
    handler = next;
  },
  play(cue: AudioCue) {
    handler?.(cue);
    const path = ASSET_PATHS[cue];
    if (path) tryPlayUrl(path, cue === "casino_ambience" ? 0.25 : 0.55);
  },
};

export function playCue(cue: AudioCue): void {
  AudioManager.play(cue);
}
