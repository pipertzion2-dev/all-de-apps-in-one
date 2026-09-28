/**
 * Klean Sneaks → ZZAI platform funnel (fair freemium).
 *
 * Research-aligned principles (NYT Games / Wordle, GeoGuessr, Duolingo-style caps):
 * - Never paywall the core solo loop (walk + solo Steal Bundle stays free).
 * - Gate **online** multiplayer — high marginal cost + strongest upgrade hook.
 * - Keep **nearby / Bluetooth** free (local play, no server matchmaking).
 * - Show remaining free sessions before the user commits (no surprise lockouts mid-lobby).
 * - Paid platform (Starter / Pro) unlocks unlimited online + saved scores across devices.
 * - Optional ads on free solo remain; subscribers get ad-light / no interstitial policy in-game.
 */

/** Free signed-in accounts: online tables per UTC calendar month. */
export const FREE_ONLINE_TABLES_PER_MONTH = 2;

/** Guests (device only): one taste session before sign-in is required. */
export const GUEST_ONLINE_TABLES_PER_MONTH = 1;

/** Nearby Bluetooth tables — always free (local social). */
export const NEARBY_ONLINE_ALWAYS_FREE = true;

export const PLATFORM_UPGRADE_PATH = "/dashboard/billing?ref=klean-online";

export type PlatformFunnelTier = "guest" | "free" | "starter" | "pro";

export const PLATFORM_FUNNEL_COPY = {
  headline: "Play online on the ZZAI platform",
  subhead:
    "Solo Vegas runs stay free. Online tables against real players use a small monthly allowance — unlimited with a ZZAI subscription.",
  benefits: [
    "Unlimited online Steal Bundle tables",
    "Gamer tag saved to your zzai zzai account",
    "Scores & credits sync when you sign in on another device",
    "Ad-light gameplay in Klean Sneaks",
    "Full API Builder & Orbit on the same plan",
  ],
  fairnessNote:
    "We only count a session when a table actually starts (everyone ready). Leaving lobby early does not spend a play.",
  monthlyLabel: (used: number, limit: number) =>
    limit <= 0 ? "Unlimited online" : `${Math.max(0, limit - used)} of ${limit} free online tables left this month`,
} as const;
