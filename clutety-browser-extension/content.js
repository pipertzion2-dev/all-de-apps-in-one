/* Clutety Feed Shield — smooth scroll: pre-scan, batched, no flash of blocked content */
(function () {
  const STORAGE_KEY = "clutety-feed-shield-v2";
  const ATTR_CHECKING = "data-clutety-checking";
  const ATTR_ALLOWED = "data-clutety-allowed";
  const ATTR_HIDDEN = "data-clutety-hidden";

  const BATCH_PER_FRAME = 10;
  const MUTATION_DEBOUNCE_MS = 64;
  const IO_ROOT_MARGIN = "600px 600px";

  let rules = null;
  let platform = "youtube";
  let feedRoot = null;
  let mutationObs = null;
  let intersectionObs = null;

  const pendingQueue = [];
  let rafId = 0;
  let mutationTimer = 0;

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

  const FEED_ITEM_SELECTOR = {
    youtube: "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer",
    tiktok: '[data-e2e="recommend-list-item-container"]',
    instagram: "article",
    x: 'article[data-testid="tweet"]',
    reddit: "shreddit-post",
    facebook: 'div[role="article"]',
    linkedin: ".feed-shared-update-v2",
    threads: "div[data-pressable-container]",
  };

  const FEED_ROOT_SELECTOR = {
    youtube: "ytd-rich-grid-renderer, ytd-browse, #contents.ytd-section-list-renderer",
    tiktok: '[data-e2e="recommend-list-item-container"]',
    instagram: "main section, main",
    x: "section[role='region'], main",
    reddit: "shreddit-feed, #AppRouter-main-content",
    facebook: "div[role='main']",
    linkedin: ".scaffold-finite-scroll__content, main",
    threads: "div[role='main']",
  };

  function getPlatform() {
    return HOST_PLATFORM[location.hostname] || "youtube";
  }

  function itemSelector() {
    return FEED_ITEM_SELECTOR[platform] || FEED_ITEM_SELECTOR.youtube;
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

  function extractFromElement(el) {
    const titleSel = {
      youtube: "#video-title, a#video-title, yt-formatted-string#video-title",
      tiktok: '[data-e2e="video-desc"]',
      instagram: "a span, h2 + span",
      x: '[data-testid="tweetText"]',
      reddit: "h3, [slot='title']",
      facebook: "span[dir='auto']",
      linkedin: ".update-components-text, .feed-shared-text",
      threads: "span",
    };
    const channelSel = {
      youtube: "#channel-name a, ytd-channel-name a, .ytd-channel-name",
      tiktok: '[data-e2e="video-author-uniqueid"]',
      instagram: "header a",
      x: '[data-testid="User-Name"]',
      reddit: "a[data-click-id='user']",
      facebook: "strong a",
      linkedin: ".update-components-actor__name",
      threads: "a[href*='/@']",
    };

    const pick = (sel) => {
      const n = el.querySelector(sel);
      return (n?.textContent || "").trim().slice(0, 500);
    };

    const title =
      pick(titleSel[platform]) || (el.getAttribute("aria-label") || "").trim().slice(0, 200);
    const channel = pick(channelSel[platform]);

    return {
      platform,
      title,
      description: "",
      channel,
      transcript: "",
      tags: channel ? [channel] : [],
    };
  }

  function isDone(el) {
    return el.getAttribute(ATTR_HIDDEN) === "1" || el.getAttribute(ATTR_ALLOWED) === "1";
  }

  function markChecking(el) {
    if (isDone(el)) return;
    el.setAttribute(ATTR_CHECKING, "1");
  }

  function markAllowed(el) {
    el.removeAttribute(ATTR_CHECKING);
    el.setAttribute(ATTR_ALLOWED, "1");
    el.removeAttribute(ATTR_HIDDEN);
  }

  function markHidden(el, reason) {
    el.removeAttribute(ATTR_CHECKING);
    el.removeAttribute(ATTR_ALLOWED);
    el.setAttribute(ATTR_HIDDEN, "1");
    if (reason) el.setAttribute("title", `Hidden by Clutety: ${reason}`);
  }

  function scanElement(el) {
    if (isDone(el)) return;
    if (!rules?.enabled || !globalThis.ClutetyMatcher) {
      markAllowed(el);
      return;
    }
    if (!rules.platforms?.[platform]) {
      markAllowed(el);
      return;
    }

    markChecking(el);

    const item = extractFromElement(el);
    if (!item.title && !item.channel) {
      markAllowed(el);
      return;
    }

    const result = globalThis.ClutetyMatcher.analyzeFeedItem(item, rules);
    if (result.action === "block") {
      markHidden(el, result.reasons?.[0] || "blocked");
    } else {
      markAllowed(el);
    }
  }

  function enqueue(el) {
    if (!el || isDone(el)) return;
    if (pendingQueue.includes(el)) return;
    markChecking(el);
    pendingQueue.push(el);
    scheduleProcess();
  }

  function scheduleProcess() {
    if (rafId) return;
    rafId = requestAnimationFrame(processBatch);
  }

  function processBatch() {
    rafId = 0;
    let n = BATCH_PER_FRAME;
    while (n-- > 0 && pendingQueue.length) {
      const el = pendingQueue.shift();
      try {
        if (el.isConnected) scanElement(el);
      } catch {
        markAllowed(el);
      }
    }
    if (pendingQueue.length) scheduleProcess();
  }

  function collectFeedItems(root) {
    const sel = itemSelector();
    try {
      root.querySelectorAll(sel).forEach(enqueue);
    } catch {
      /* ignore */
    }
  }

  function findFeedRoot() {
    const sel = FEED_ROOT_SELECTOR[platform];
    if (!sel) return document.body;
    const parts = sel.split(",").map((s) => s.trim());
    for (const s of parts) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return document.body;
  }

  function onMutations(mutations) {
    const sel = itemSelector();
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const el = /** @type {Element} */ (node);
        if (el.matches?.(sel)) enqueue(el);
        el.querySelectorAll?.(sel).forEach(enqueue);
      }
    }
  }

  function setupIntersectionObserver() {
    if (intersectionObs) intersectionObs.disconnect();
    intersectionObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          if (!isDone(el)) enqueue(el);
        }
      },
      { root: null, rootMargin: IO_ROOT_MARGIN, threshold: 0 },
    );

    document.querySelectorAll(itemSelector()).forEach((el) => {
      intersectionObs.observe(el);
      if (!isDone(el)) enqueue(el);
    });
  }

  function setupMutationObserver() {
    feedRoot = findFeedRoot();
    if (mutationObs) mutationObs.disconnect();
    mutationObs = new MutationObserver(() => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        collectFeedItems(feedRoot);
        setupIntersectionObserver();
      }, MUTATION_DEBOUNCE_MS);
    });
    mutationObs.observe(feedRoot, { childList: true, subtree: true });
  }

  function resetAndRescan() {
    pendingQueue.length = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;

    document
      .querySelectorAll(`[${ATTR_HIDDEN}], [${ATTR_CHECKING}], [${ATTR_ALLOWED}]`)
      .forEach((el) => {
        el.removeAttribute(ATTR_HIDDEN);
        el.removeAttribute(ATTR_CHECKING);
        el.removeAttribute(ATTR_ALLOWED);
        el.removeAttribute("title");
      });

    collectFeedItems(document);
    setupIntersectionObserver();
  }

  function boot() {
    platform = getPlatform();
    if (!rules?.enabled) return;

    collectFeedItems(document);
    setupMutationObserver();
    setupIntersectionObserver();
  }

  loadRules(() => {
    boot();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORAGE_KEY]) {
      loadRules(() => {
        resetAndRescan();
        boot();
      });
    }
  });

  /* Re-bind when SPA navigates (YouTube, etc.) */
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      platform = getPlatform();
      setupMutationObserver();
      collectFeedItems(document);
      setupIntersectionObserver();
    }
  }, 800);
})();
