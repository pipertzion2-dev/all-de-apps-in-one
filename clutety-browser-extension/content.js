/* Clutety Feed Shield — hides matching posts in social feeds */
(function () {
  const STORAGE_KEY = "clutety-feed-shield-v2";
  const HIDDEN_ATTR = "data-clutety-hidden";
  const PROCESSED_ATTR = "data-clutety-scanned";
  let rules = null;
  let scanTimer = null;

  const HOST_PLATFORM = {
    "www.youtube.com": "youtube",
    "youtube.com": "youtube",
    "www.tiktok.com": "tiktok",
    "tiktok.com": "tiktok",
    "www.instagram.com": "instagram",
    "instagram.com": "instagram",
    "twitter.com": "x",
    "x.com": "x",
    "www.reddit.com": "reddit",
    "old.reddit.com": "reddit",
    "reddit.com": "reddit",
    "www.facebook.com": "facebook",
    "facebook.com": "facebook",
    "www.linkedin.com": "linkedin",
    "linkedin.com": "linkedin",
    "www.threads.net": "threads",
    "threads.net": "threads",
  };

  function getPlatform() {
    return HOST_PLATFORM[location.hostname] || "youtube";
  }

  function loadRules(cb) {
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      try {
        rules = data[STORAGE_KEY] ? JSON.parse(data[STORAGE_KEY]) : null;
      } catch {
        rules = null;
      }
      cb(rules);
    });
  }

  function extractFromElement(el, platform) {
    const titleSel = {
      youtube: "#video-title, a#video-title, yt-formatted-string#video-title",
      tiktok: '[data-e2e="video-desc"], [data-e2e="browse-video-desc"]',
      instagram: "a[href*='/p/'] span, h2 + span",
      x: '[data-testid="tweetText"], article [lang]',
      reddit: "h3, a[data-click-id='body']",
      facebook: "span[dir='auto']",
      linkedin: ".update-components-text, .feed-shared-text",
      threads: "[data-pressable-container] span",
    };
    const channelSel = {
      youtube: "#channel-name a, ytd-channel-name a, .ytd-channel-name",
      tiktok: '[data-e2e="video-author-uniqueid"], a[href*="/@"]',
      instagram: "a[role='link'] span",
      x: '[data-testid="User-Name"]',
      reddit: "a[data-click-id='user']",
      facebook: "strong a",
      linkedin: ".update-components-actor__name",
      threads: "a[href*='/@'] span",
    };

    const pickText = (selector) => {
      const nodes = el.querySelectorAll(selector);
      const texts = [];
      nodes.forEach((n) => {
        const t = (n.textContent || "").trim();
        if (t && t.length < 500) texts.push(t);
      });
      return texts.join(" ").slice(0, 2000);
    };

    const title = pickText(titleSel[platform] || titleSel.youtube);
    const channel = pickText(channelSel[platform] || channelSel.youtube);
    const aria = (el.getAttribute("aria-label") || "").trim();
    const description = aria && aria !== title ? aria : "";

    return {
      platform,
      title: title || description.slice(0, 200),
      description,
      channel,
      transcript: "",
      tags: [],
    };
  }

  function feedSelectors(platform) {
    const map = {
      youtube: "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer",
      tiktok: '[data-e2e="recommend-list-item-container"], div[class*="DivItemContainer"]',
      instagram: "article, main div[style] a[href*='/reel/'], main a[href*='/p/']",
      x: 'article[data-testid="tweet"], article[role="article"]',
      reddit: "shreddit-post, div[data-testid='post-container']",
      facebook: "div[role='article']",
      linkedin: ".feed-shared-update-v2, .update-components-update-v2",
      threads: "div[data-pressable-container]",
    };
    return map[platform] || map.youtube;
  }

  function hideElement(el, reason) {
    if (el.getAttribute(HIDDEN_ATTR) === "1") return;
    el.setAttribute(HIDDEN_ATTR, "1");
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.setAttribute("title", `Hidden by Clutety: ${reason}`);
  }

  function scan() {
    if (!rules?.enabled || !globalThis.ClutetyMatcher) return;
    const platform = getPlatform();
    if (!rules.platforms?.[platform]) return;

    const selector = feedSelectors(platform);
    document.querySelectorAll(selector).forEach((el) => {
      if (el.getAttribute(PROCESSED_ATTR) === "1") return;
      el.setAttribute(PROCESSED_ATTR, "1");

      const item = extractFromElement(el, platform);
      if (!item.title && !item.channel && !item.description) return;

      const result = globalThis.ClutetyMatcher.analyzeFeedItem(item, rules);
      if (result.action === "block") {
        hideElement(el, result.reasons[0] || "blocked");
      }
    });
  }

  function scheduleScan() {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 350);
  }

  loadRules(() => {
    scan();
    const obs = new MutationObserver(scheduleScan);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleScan, { passive: true });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORAGE_KEY]) {
      loadRules(() => {
        document.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach((el) => {
          el.removeAttribute(HIDDEN_ATTR);
          el.removeAttribute(PROCESSED_ATTR);
          el.style.removeProperty("display");
          el.style.removeProperty("visibility");
        });
        scan();
      });
    }
  });
})();
