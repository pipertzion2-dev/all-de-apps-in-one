import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteSavedGameUi,
  listSavedGameUis,
  saveGameUi,
  SAVED_GAME_UI_LIBRARY_KEY,
} from "./saved-game-ui";
import { buildReferenceUiTheme, paletteFromTextReference } from "./reference-ui-theme";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
  };
}

describe("saved-game-ui library", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves, lists, and deletes named game UIs", () => {
    const storage = memoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("localStorage", storage);

    const theme = buildReferenceUiTheme({
      referenceText: "neon tokyo night rain",
      palette: paletteFromTextReference("neon tokyo night rain"),
      contentHash: "c".repeat(64),
    });

    const saved = saveGameUi({
      theme,
      title: "My Neon Walk",
      mediaKind: "image",
    });
    expect(saved.title).toBe("My Neon Walk");
    expect(listSavedGameUis()).toHaveLength(1);
    expect(storage.getItem(SAVED_GAME_UI_LIBRARY_KEY)).toContain("My Neon Walk");

    deleteSavedGameUi(saved.id);
    expect(listSavedGameUis()).toHaveLength(0);
  });
});
