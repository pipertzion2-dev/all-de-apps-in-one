# Klean Sneaks & the Old Man's Bundle — Monetization

Integrated into the existing Next.js + R3F runner / casino loop. Soft currency remains **Credits** (walk chips). Premium currency is **Laces**. Gameplay, story, and Saves stay intact; monetization is opt-in.

## 1. Files changed / added

### Core library

- `Svivva/lib/clean-sneaks/monetization/config.ts` — economy knobs, Old Man's Bundle, packs, pass, boosts, ads
- `Svivva/lib/clean-sneaks/monetization/types.ts`
- `Svivva/lib/clean-sneaks/monetization/wallet.ts` — wallet + idempotent `commitClaim`
- `Svivva/lib/clean-sneaks/monetization/rewards.ts` — rewarded offers, claim helpers
- `Svivva/lib/clean-sneaks/monetization/daily.ts`
- `Svivva/lib/clean-sneaks/monetization/offline.ts`
- `Svivva/lib/clean-sneaks/monetization/pass.ts`
- `Svivva/lib/clean-sneaks/monetization/shop.ts`
- `Svivva/lib/clean-sneaks/monetization/analytics.ts`
- `Svivva/lib/clean-sneaks/monetization/security.ts` — HMAC claim attest
- `Svivva/lib/clean-sneaks/monetization/index.ts`
- `Svivva/lib/clean-sneaks/monetization/monetization.test.ts`

### API

- `Svivva/app/api/clean-sneaks/monetization/catalog/route.ts`
- `Svivva/app/api/clean-sneaks/monetization/claim/route.ts`
- `Svivva/app/api/clean-sneaks/monetization/purchase/route.ts`
- `Svivva/app/api/clean-sneaks/monetization/analytics/route.ts`

### UI

- `Svivva/components/clean-sneaks/monetization/*` — Shop, Old Man's Bundle screen, RewardClaimModal, OfflineEarningsHost
- Wired: `CasinoExperience.tsx` (Corner Store), `CleanSneaksGame3D.tsx` (JOB COMPLETE ad offer), `app/clean-sneaks/page.tsx` (Shop + offline)

Existing casino credit packs / AdSense rewarded / Stripe Cash App paths are reused, not replaced.

## 2. Database / schema

No new Drizzle tables in this pass. Claim anti-dupe uses:

- Client: `claimedIds[]` in `localStorage` wallet
- Server: in-memory map (+ HMAC) on `/api/.../claim` and `/purchase`

**Recommended follow-up migration** (Neon): `klean_claims(claim_id PK, source, provider_ref, created_at)` and `klean_wallets(player_id, credits, laces, json blob)` when accounts ship.

## 3. Backend endpoints

| Method     | Path                                       | Purpose                           |
| ---------- | ------------------------------------------ | --------------------------------- |
| GET        | `/api/clean-sneaks/monetization/catalog`   | Remote-readable economy + shop    |
| POST       | `/api/clean-sneaks/monetization/claim`     | Idempotent claim attestation      |
| POST       | `/api/clean-sneaks/monetization/purchase`  | Stripe intent / confirm / restore |
| GET        | `/api/clean-sneaks/monetization/analytics` | Metric formulas + event list      |
| (existing) | `/api/clean-sneaks/steal-bundle/credits`   | Credit chip packs                 |

## 4. Environment variables

```bash
# AdSense (existing)
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_ADSENSE_SLOT_BANNER=
NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL=
NEXT_PUBLIC_ADSENSE_SLOT_REWARDED=
NEXT_PUBLIC_CLEAN_SNEAKS_ADS=1
NEXT_PUBLIC_CLEAN_SNEAKS_HOUSE_ADS=0   # house creatives only if 1

# Stripe (existing) — Apple Pay / card for bundles & lace packs
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=   # or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
INTERIM_CASHAPP_TAG=pipertzion

# New
KLEAN_MONETIZATION_HMAC_SECRET=     # claim / receipt signatures
```

## 5. App Store / Google Play products to create

(Web uses Stripe product ids today; map these SKUs on native.)

| storeProductId                             | Type                 | Notes                      |
| ------------------------------------------ | -------------------- | -------------------------- |
| `klean_old_mans_bundle`                    | Non-consumable       | Restore supported          |
| `klean_laces_small` / `_medium` / `_large` | Consumable           | Laces                      |
| `klean_starter_bundle`                     | Consumable bundle    | Laces + credits + cosmetic |
| `klean_street_pass_s1`                     | Non-consumable / sub | Season pass                |
| `klean_cosmetic_*`                         | Non-consumable       | Colorways / outfits        |
| `klean_boost_*`                            | Consumable           | Temporary boosts           |
| `klean_stack_*`                            | Consumable           | Existing credit packs      |

Use **localized store prices** in native IAP UI; web falls back to `priceCents` in config.

## 6. Ad-network setup

1. AdSense app / site with Display units for banner, interstitial, rewarded placements.
2. Set env slot ids above (or Orbit → AdSense).
3. Rewarded flow is **opt-in only** via `RewardClaimModal` / shop — never auto-interrupts a run for rewards.
4. Grant only after watch completion (`adCompleted: true`) + cooldown/daily limit.

For true rewarded video later: swap the timer gate for AdMob / Unity Ads completion callbacks calling the same `claimAdBonus`.

## 7. Configurable economy values

All in `lib/clean-sneaks/monetization/config.ts`:

- `AD_REWARD_CONFIG` — multipliers, daily limit, cooldowns, chest, boosts
- `DAILY_REWARD_CONFIG` — streak table
- `OFFLINE_REWARD_CONFIG` — rate / cap / min away
- `BOOST_CATALOG`, `LACE_PACKS`, `OLD_MAN_BUNDLE.contents`, `COSMETIC_PRODUCTS`, `PASS_CONFIG`

## 8. Security protections

- Idempotent `claimId` ledger (client + server)
- Offer tokens must match; expired offers rejected
- Ad bonus requires `adCompleted`
- Daily / offline / bundle duplicate guards
- Stripe confirm checks `paymentIntent.status === succeeded` + metadata product match
- HMAC signatures when `KLEAN_MONETIZATION_HMAC_SECRET` set
- No card data stored in-game
- Gameplay advantages on boosts/bundle boosts are **disclosed** in shop copy
- Client treated as untrusted; server attest for purchases/claims

## 9. Testing

```bash
cd Svivva
npm test -- lib/clean-sneaks/monetization/monetization.test.ts
npm test -- lib/clean-sneaks/casino/
```

Manual:

1. Finish a walk → JOB COMPLETE modal → Claim vs Watch Ad
2. Header **Shop** → Daily Corner Drop (no ad required) → optional ad bonus
3. Corner Store / casino lobby → Old Man's Bundle screen → buy with Laces
4. Leave tab 5+ minutes (or lower `minAwayMs` in config) → offline modal
5. Replay same claim / re-buy bundle → no double grant

## 10. Deploy / migration

1. Merge this branch to `main` (canonical Vercel: `zzai-zzai` / `all-de-apps-in-one`).
2. Set env vars on the project; redeploy.
3. No DB migration required for v1.
4. Existing players: wallet migrates casino credits on first read; colorway `oilSlick` stays free.

## Design notes

- Progress never requires paywalls or forced ads.
- Normal mission/daily/offline rewards never locked behind ads.
- Old Man's Bundle is optional identity pack with a dedicated presentation screen.
- Shop sections: Featured · Old Man's Bundle · Sneakers · Cosmetics · Currency · Boosts · Pass — labeled FREE / WATCH AD / PURCHASE.
