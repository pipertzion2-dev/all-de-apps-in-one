/**
 * Klean Sneaks monetization — free game, real ads, optional ad-free pass.
 *
 * - **Free**: unlimited solo, nearby, and online play.
 * - **Revenue**: programmatic ads (Media.net / Adsterra / AdSense) + house fill.
 * - **Ad-free**: one-time $5 Cash App on this device.
 * - **Platform**: separate ZZAI desk subscription (Cash App recurring) for API tools.
 */

export const FREE_ONLINE_TABLES_PER_MONTH = 9999;
export const GUEST_ONLINE_TABLES_PER_MONTH = 9999;
export const NEARBY_ONLINE_ALWAYS_FREE = true;

export const PLATFORM_UPGRADE_PATH = "/dashboard/billing?ref=klean";

export type PlatformFunnelTier = "guest" | "free" | "starter" | "pro";

export const PLATFORM_FUNNEL_COPY = {
  headline: "Give your project rest to grow!",
  subhead:
    "Klean Sneaks is free — ads keep the lights on. Let the sap run your guardrails on ZZAI while you play, rest, and grow.",
  benefits: [
    "Free unlimited walks and online Steal Bundle tables",
    "Real ad network revenue (not paywalled plays)",
    "Optional $5 Cash App — no ads on this device",
    "Gamer tag on your zzai zzai account when signed in",
    "Platform tools on ZZAI when you are ready to ship",
  ],
  fairnessNote: "Prefer silence? Pay once on Cash App — no recurring fee for ad-free play.",
  monthlyLabel: () => "Free to play · supported by ads",
} as const;
