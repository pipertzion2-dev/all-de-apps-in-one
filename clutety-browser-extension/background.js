const STORAGE_KEY = "clutety-feed-shield-v2";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([STORAGE_KEY], (data) => {
    if (!data[STORAGE_KEY]) {
      const defaults = {
        version: 2,
        enabled: true,
        platforms: {
          youtube: true,
          tiktok: true,
          instagram: true,
          x: true,
          reddit: true,
          facebook: true,
          linkedin: true,
          threads: true,
          snapchat: false,
          pinterest: false,
          bluesky: false,
        },
        categories: {
          violence: true,
          adult: true,
          scams: true,
          celebrity_gossip: true,
          tragedy: true,
        },
        keywords: [],
        blockedPeople: [],
        scanChannelNames: true,
        analyzeTranscripts: true,
      };
      chrome.storage.local.set({
        [STORAGE_KEY]: JSON.stringify(defaults),
      });
    }
  });
});
