# Marketing Hub — Drop-in Add-on for Svivva

A complete multi-channel marketing system built for your Svivva Next.js project.

## What's Included

| Feature           | Route                  | Description                                        |
| ----------------- | ---------------------- | -------------------------------------------------- |
| Dashboard         | `/marketing`           | KPI overview, pipeline, channel breakdown          |
| Campaigns         | `/marketing/campaigns` | Create & manage multi-channel campaigns            |
| Leads             | `/marketing/leads`     | Lead capture, scoring, and pipeline management     |
| Referrals         | `/marketing/referrals` | Viral referral program with tracked links          |
| UTM Builder       | `/marketing/utm`       | Build & track campaign URLs with UTM params        |
| Content Amplifier | `/marketing/amplify`   | Repurpose content for all channels via AI (OpenAI) |
| A/B Tests         | `/marketing/ab-tests`  | Test variants and track conversion rates           |

## How to Install

### 1. Copy the folder structure into your Svivva project

From this folder, copy each sub-folder into the matching location inside `Svivva/`:

```
marketing-hub/app/marketing/         → Svivva/app/marketing/
marketing-hub/app/api/marketing/     → Svivva/app/api/marketing/
marketing-hub/lib/marketing/         → Svivva/lib/marketing/
marketing-hub/components/marketing/  → Svivva/components/marketing/
```

### 2. Add the database tables

Add this import to your Drizzle config so it picks up the new tables.

Open `Svivva/lib/schema.ts` (or wherever your schemas are exported) and add:

```ts
export * from "./marketing/schema";
```

Then push the schema to your database:

```bash
cd Svivva
npm run db:push
```

### 3. Add a link to the Marketing Hub in your nav (optional)

You can link to `/marketing` from your dashboard sidebar or main nav.

### 4. OpenAI for Content Amplifier

The Content Amplifier uses `OPENAI_API_KEY` (or `AI_INTEGRATIONS_OPENAI_API_KEY` for Replit AI Integrations). If you already have this set in your `.env`, it works immediately.

## Database Tables Created

- `marketing_campaigns` — multi-channel campaign records
- `marketing_leads` — lead capture with scoring
- `marketing_referrals` — referral program links
- `marketing_referral_events` — click/signup/conversion tracking
- `marketing_utm_links` — UTM URL builder records
- `marketing_ab_tests` — A/B test variants and metrics
- `marketing_amplify_jobs` — content amplification history

## API Endpoints Added

```
GET/POST  /api/marketing/campaigns
PATCH     /api/marketing/campaigns          (update status)
GET/POST  /api/marketing/leads
PATCH     /api/marketing/leads              (update status)
GET/POST  /api/marketing/referrals
GET/POST  /api/marketing/referrals/track/[code]
GET/POST  /api/marketing/utm
GET       /api/marketing/utm/track/[id]     (redirect + count click)
GET/POST  /api/marketing/amplify
GET/POST  /api/marketing/ab-tests
PATCH     /api/marketing/ab-tests
```

## Lead Scoring System

Leads are automatically scored 0-100:

- Base score: 10
- Has company name: +20
- Has phone number: +10
- Source = referral: +30
- Source = paid: +15
- Source = organic: +10

## Referral Tracking

Referral links are formatted as `{NEXT_PUBLIC_SITE_URL}?ref=CODE`. When someone clicks a referral link via `/api/marketing/referrals/track/[code]`, clicks are recorded automatically.

## Requirements

- Next.js 14+ (App Router)
- Drizzle ORM + PostgreSQL
- Tailwind CSS (same as Svivva)
- OpenAI API key (only for Content Amplifier)
