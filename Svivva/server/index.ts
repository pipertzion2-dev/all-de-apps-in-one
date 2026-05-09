import "dotenv/config";
import { spawn } from "child_process";
import { getInternalAppOrigin } from "../lib/internal-app-origin";

// Next `-p`, schedulers (`getInternalAppOrigin`), and INTERNAL_APP_ORIGIN fallbacks must agree.
// macOS often has AirPlay Receiver listening on :5000 — set PORT=3000 (and matching NEXT_PUBLIC_SITE_URL) in `.env` if `EADDRINUSE` on 5000.
process.env.PORT ??= "5000";
const devPort = process.env.PORT;

const log = (message: string, source = "next") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};

// ── SEO Automation Scheduler ─────────────────────────────────────────────────
const SEO_BASE = getInternalAppOrigin();
const SEO_INTERVAL_MS = (Number(process.env.SEO_AUTO_INTERVAL_HOURS) || 24) * 60 * 60 * 1000;
const INTERNAL_SECRET = process.env.ORBIT_INTERNAL_SECRET || "";

async function runSeoTasks() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(INTERNAL_SECRET ? { "x-internal-secret": INTERNAL_SECRET } : {}),
  };

  // IndexNow submission
  try {
    const r = await fetch(`${SEO_BASE}/api/indexnow/submit`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(40_000),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) log(`[auto-seo] IndexNow: submitted ${d.urlCount ?? "?"} URLs`, "seo");
    else log(`[auto-seo] IndexNow failed: ${d.error ?? r.status}`, "seo");
  } catch (e: any) {
    log(`[auto-seo] IndexNow error: ${e?.message ?? e}`, "seo");
  }

  // GSC sitemap submission
  try {
    const r = await fetch(`${SEO_BASE}/api/gsc/save`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "submit_sitemap" }),
      signal: AbortSignal.timeout(30_000),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) log("[auto-seo] GSC sitemap: submitted", "seo");
    else log(`[auto-seo] GSC sitemap skipped: ${d.error ?? r.status}`, "seo");
  } catch (e: any) {
    log(`[auto-seo] GSC sitemap error: ${e?.message ?? e}`, "seo");
  }
}

function startSeoScheduler(readyDelayMs = 90_000) {
  log(
    `[auto-seo] Scheduler armed — first run in ${readyDelayMs / 60_000} min, then every ${SEO_INTERVAL_MS / 3_600_000}h`,
    "seo",
  );
  setTimeout(async () => {
    log("[auto-seo] Running initial SEO tasks…", "seo");
    await runSeoTasks();
    setInterval(async () => {
      log("[auto-seo] Running scheduled SEO tasks…", "seo");
      await runSeoTasks();
    }, SEO_INTERVAL_MS);
  }, readyDelayMs);
}

// ── Growth Marketing Weekly Scheduler ─────────────────────────────────────────
const GROWTH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GROWTH_INITIAL_DELAY_MS = 2 * 60 * 1000; // 2 min after startup (runs on first boot of the week)

async function runGrowthTasks() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(INTERNAL_SECRET ? { "x-internal-secret": INTERNAL_SECRET } : {}),
  };
  try {
    const r = await fetch(`${SEO_BASE}/api/growth/tasks`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(60_000),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      const results: { task: string; status: string }[] = (d as any).results ?? [];
      log(
        `[auto-growth] Weekly run complete — ${results.length} tasks: ${results.map((x) => `${x.task}(${x.status})`).join(", ")}`,
        "growth",
      );
    } else {
      log(`[auto-growth] Weekly run failed: ${JSON.stringify(d)}`, "growth");
    }
  } catch (e: any) {
    log(`[auto-growth] Weekly run error: ${e?.message ?? e}`, "growth");
  }
}

function startGrowthScheduler() {
  log(
    `[auto-growth] Growth scheduler armed — first run in ${GROWTH_INITIAL_DELAY_MS / 60_000} min, then weekly`,
    "growth",
  );
  setTimeout(async () => {
    log("[auto-growth] Running weekly growth tasks…", "growth");
    await runGrowthTasks();
    setInterval(async () => {
      log("[auto-growth] Running scheduled weekly growth tasks…", "growth");
      await runGrowthTasks();
    }, GROWTH_INTERVAL_MS);
  }, GROWTH_INITIAL_DELAY_MS);
}

log("Starting Next.js development server...");

const nextProcess = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", devPort], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: devPort,
  },
});

startSeoScheduler();
startGrowthScheduler();

nextProcess.on("error", (err) => {
  log(`Failed to start Next.js: ${err.message}`, "error");
  process.exit(1);
});

nextProcess.on("close", (code) => {
  log(`Next.js process exited with code ${code}`, "next");
  process.exit(code || 0);
});

process.on("SIGINT", () => {
  nextProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  nextProcess.kill("SIGTERM");
});
