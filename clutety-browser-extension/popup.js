const STORAGE_KEY = "clutety-feed-shield-v2";

chrome.storage.local.get([STORAGE_KEY], (data) => {
  const el = document.getElementById("status");
  if (!el) return;
  try {
    const rules = data[STORAGE_KEY] ? JSON.parse(data[STORAGE_KEY]) : null;
    if (!rules) {
      el.textContent = "No rules yet. Open svivva.com/clutety/app to set up.";
      return;
    }
    const people = rules.blockedPeople?.length ?? 0;
    const kw = rules.keywords?.length ?? 0;
    el.textContent = rules.enabled
      ? `Active · ${people} people blocked · ${kw} keywords`
      : "Feed Shield is paused. Enable it on Svivva.";
  } catch {
    el.textContent = "Could not read rules. Re-sync from Svivva.";
  }
});
