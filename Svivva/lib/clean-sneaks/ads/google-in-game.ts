/**
 * Why Google AdSense often “does not work” in Klean Sneaks (and what we do instead).
 *
 * 1. **Approval** — ca-pub in layout ≠ earning; site/games need AdSense approval (often weeks, often denied for games).
 * 2. **Missing slot IDs** — client id alone does not fill `<ins class="adsbygoogle">`; you need Display unit ids per placement.
 * 3. **Blank iframes** — reusing one banner slot for interstitial/rewarded → unfilled white boxes (we block that).
 * 4. **Consent Mode / EEA** — without Funding Choices CMP, Google may not serve in EU/UK.
 * 5. **Low fill in WebGL/fullscreen** — game surfaces get worse match rates than blog content.
 * 6. **Auto ads ≠ game units** — head script helps site verification but in-game needs explicit units or another network.
 *
 * Default: **free alt networks + house sponsors** in-game. Opt in to Google with NEXT_PUBLIC_KLEAN_USE_ADSENSE=1.
 */

export const KLEAN_USE_ADSENSE_ENV = "NEXT_PUBLIC_KLEAN_USE_ADSENSE";

/** When false (default), in-game placements skip AdSense even if ca-pub is on the site layout. */
export function kleanInGameUsesAdsense(): boolean {
  return process.env[KLEAN_USE_ADSENSE_ENV]?.trim() === "1";
}

export const GOOGLE_ADS_TROUBLESHOOTING = [
  "AdSense site verification only needs the script in layout — paid in-game units need approved account + slot IDs.",
  "If you see empty white boxes, Google returned unfilled — not a game bug.",
  "Use a free network below (Monetag / Adsterra) or keep house sponsors until Google approves.",
] as const;
