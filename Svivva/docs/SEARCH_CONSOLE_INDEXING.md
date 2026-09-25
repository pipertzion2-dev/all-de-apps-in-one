# Google Search Console & indexing (avoid “submit everything at once”)

## What was going wrong

Orbit could **IndexNow every URL in `sitemap.xml`**, then run **up to 5 × 200 Google Indexing API** notifications in the same request, and scripts like `run-full-indexing.mjs` could **chain several indexing endpoints back-to-back**. That does not speed up Google — it burns daily quota, floods Bing/IndexNow, and Search Console often shows **Crawled – currently not indexed** or **Discovered – not indexed** for long tail URLs.

Google discovers most pages via **one sitemap submission** + normal crawl. The Indexing API is a **nudge** (~200 URLs/day), not “index my whole site now.”

## What we do now

| Action              | Per run                                                     |
| ------------------- | ----------------------------------------------------------- |
| **GSC sitemap PUT** | Register/update sitemap (once per run — fine)               |
| **IndexNow**        | Up to **200 rotated URLs** (least-recently submitted first) |
| **Indexing API**    | **1 batch × ~200 URLs** (max 2 if explicitly requested)     |

Env override: `INDEXNOW_MAX_URLS_PER_RUN=200` (max 5000).

## Orbit Timing (recommended)

On **Launchpad / Orbit**, use the gold **Timing** swirl button at the top. Plan v2 follows a **professional SEO cadence**: sitemap once, **48h crawl settle**, audit + internal link heal, then **~45 IndexNow** URLs per step and **~35 Indexing API** only on later steps — with **48h–7d** waits between pushes. After the checklist completes, **weekly maintenance** repeats the same small caps every **168h**.

See **`docs/TIMING_SEO_PLAYBOOK.md`** for the research summary. Do not use **Start traffic now** or **Run Everything** in the same week unless you intentionally reset Timing.

## What you should do in Search Console

1. **Submit `sitemap.xml` once** (Pages → Sitemaps). Do not re-submit daily unless the sitemap structure changed.
2. Use **Run Google indexing now** on `/dashboard/gsc-connect` **at most once per day**.
3. Avoid running **Launchpad “full indexing” scripts** and **index-health resubmit** and **marketing autopilot** in the same hour.
4. Fix **quality issues** (duplicates, thin pages, canonical errors) — bulk requests do not fix “not indexed” caused by quality.

## Optional: full IndexNow list

Only for migrations. Pass `indexNowSubmitAll: true` to `runAutomatableManualActions` from custom code — not exposed in the default UI.
