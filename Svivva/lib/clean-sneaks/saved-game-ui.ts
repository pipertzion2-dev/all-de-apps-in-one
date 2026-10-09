/**
 * Local library of player-authored Klean game UIs (Discover your perfect UI).
 */

import type { KleanReferenceUiTheme } from "@/lib/clean-sneaks/reference-ui-theme";

export const SAVED_GAME_UI_LIBRARY_KEY = "zzai.clean-sneaks.savedGameUi.v1";
export const MAX_SAVED_GAME_UIS = 24;

export type SavedGameUi = {
  id: string;
  /** Player-chosen display name */
  title: string;
  savedAt: string;
  theme: KleanReferenceUiTheme;
  /** Optional still (base64 jpeg/png without data: prefix) for library thumb */
  thumbBase64?: string;
  mediaKind?: "image" | "video" | "text";
};

export type SavedGameUiLibrary = {
  version: 1;
  items: SavedGameUi[];
};

function emptyLibrary(): SavedGameUiLibrary {
  return { version: 1, items: [] };
}

export function readSavedGameUiLibrary(): SavedGameUiLibrary {
  if (typeof window === "undefined") return emptyLibrary();
  try {
    const raw = window.localStorage.getItem(SAVED_GAME_UI_LIBRARY_KEY);
    if (!raw) return emptyLibrary();
    const parsed = JSON.parse(raw) as SavedGameUiLibrary;
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) return emptyLibrary();
    return { version: 1, items: parsed.items.slice(0, MAX_SAVED_GAME_UIS) };
  } catch {
    return emptyLibrary();
  }
}

export function writeSavedGameUiLibrary(library: SavedGameUiLibrary): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SAVED_GAME_UI_LIBRARY_KEY,
    JSON.stringify({ version: 1, items: library.items.slice(0, MAX_SAVED_GAME_UIS) }),
  );
}

export function listSavedGameUis(): SavedGameUi[] {
  return readSavedGameUiLibrary().items;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ui_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function saveGameUi(input: {
  theme: KleanReferenceUiTheme;
  title?: string;
  thumbBase64?: string;
  mediaKind?: "image" | "video" | "text";
  /** Replace an existing entry */
  id?: string;
}): SavedGameUi {
  const library = readSavedGameUiLibrary();
  const title =
    input.title?.trim() ||
    input.theme.name?.trim() ||
    `My game UI · ${new Date().toLocaleDateString()}`;
  const existingIdx = input.id ? library.items.findIndex((i) => i.id === input.id) : -1;
  const entry: SavedGameUi = {
    id: existingIdx >= 0 ? library.items[existingIdx]!.id : newId(),
    title: title.slice(0, 80),
    savedAt: new Date().toISOString(),
    theme: input.theme,
    thumbBase64: input.thumbBase64,
    mediaKind: input.mediaKind,
  };
  const nextItems =
    existingIdx >= 0
      ? library.items.map((item, i) => (i === existingIdx ? entry : item))
      : [entry, ...library.items.filter((i) => i.theme.contentHash !== entry.theme.contentHash)];
  writeSavedGameUiLibrary({ version: 1, items: nextItems.slice(0, MAX_SAVED_GAME_UIS) });
  return entry;
}

export function deleteSavedGameUi(id: string): void {
  const library = readSavedGameUiLibrary();
  writeSavedGameUiLibrary({
    version: 1,
    items: library.items.filter((i) => i.id !== id),
  });
}

export function getSavedGameUi(id: string): SavedGameUi | null {
  return listSavedGameUis().find((i) => i.id === id) ?? null;
}
