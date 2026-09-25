# Timing SEO playbook (professional cadence)

Orbit **Timing** runs one step at a time with enforced waits. It mirrors how experienced SEOs treat Google Search Console and indexing: **quality and patience**, not “submit the whole sitemap today.”

## What Google actually expects

| Action       | Professional approach                                                                      | What Orbit Timing does                                    |
| ------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Sitemap      | Submit **once** per property; fix errors before resubmitting                               | Step 2 only (`foundation-sitemap`)                        |
| Discovery    | Rely on sitemap + internal links + natural crawl                                           | 48h **crawl settle** (manual) before URL nudges           |
| URL requests | Selective; Indexing API quota is ~200/day but meant for job/livestream types on many sites | **~45 IndexNow** + **~35 Indexing API** per indexing step |
| Performance  | Impressions lag indexing by **days to weeks**                                              | Performance review only after waits                       |
| AdSense      | Separate product from Search Console                                                       | Manual verify step                                        |

## Research notes (2024–2026)

- **Search Console**: Sitemap submission is a hint; coverage updates gradually. Bulk “Request indexing” on thousands of URLs does not speed ranking and can waste crawl budget on low-value URLs.
- **Indexing API**: Daily project limits exist; using the full quota every day on general content is not standard practice for content sites. Timing uses a **small rotated slice** of least-recently-submitted URLs.
- **IndexNow**: Useful for Bing/Yandex and fast discovery signals; still use **rotated batches**, not the full URL list each run.
- **Internal linking**: Orphan and thin pages should be fixed **before** pushing more URLs — Timing runs audit + heal steps first.

## Step sequence (plan v2)

1. Connect GSC (manual)
2. Register sitemap once (automated, no Indexing API)
3. Wait 48h for initial crawl (manual)
4. Baseline technical audit (automated)
5. Heal orphan internal links (automated)
6. First discovery nudge — IndexNow only (~45 URLs)
7. Index health sample
8. Second nudge — IndexNow + small Indexing API (~45 + ~35)
9. SEO monitor
10. AdSense site status (manual)
11. GSC performance review (28d)
12. Weekly rhythm step — same caps as step 8

After step 12, **maintenance** repeats the weekly nudge every **168 hours** without resetting the checklist.

## Do not bypass Timing

**Start traffic now**, **Run Everything**, and legacy bulk indexing routes ignore these waits. Use one Timing step per day (or per cooldown), not hourly repeats.

## Related code

- `lib/orbit/timing-plan.ts` — steps and cooldown hours
- `lib/orbit/timing-cadence.ts` — URL caps per step
- `lib/indexing/indexing-policy.ts` — global clamps for non-Timing routes
- `docs/SEARCH_CONSOLE_INDEXING.md` — GSC setup and throttling
