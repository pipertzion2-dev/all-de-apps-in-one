/** When user opens Clutety on svivva.com, copy localStorage rules into extension storage. */
(function () {
  const STORAGE_KEY = "clutety-feed-shield-v2";
  const LEGACY = "clutety-feed-shield-v1";

  function sync() {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY);
    if (!raw) return;
    chrome.storage.local.set({ [STORAGE_KEY]: raw }, () => {
      console.info("[Clutety] Feed Shield rules synced to browser extension");
    });
  }

  if (location.pathname.includes("/clutety")) {
    sync();
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY || e.key === LEGACY) sync();
    });
  }
})();
