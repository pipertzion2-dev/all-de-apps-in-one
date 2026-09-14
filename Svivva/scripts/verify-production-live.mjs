#!/usr/bin/env node
/**
 * Confirm production serves expected content (truth source when GitHub Vercel status is stale).
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const canonical = JSON.parse(readFileSync(resolve(__dirname, "../vercel-canonical.json"), "utf8"));

/**
 * @param {{ url?: string; markers?: string[]; expectedSha?: string; attempts?: number; delayMs?: number }} opts
 */
export async function verifyProductionLive(opts = {}) {
  if (opts.expectedSha) {
    return verifyDeployRevision(opts.expectedSha, opts);
  }
  const domain = canonical.productionDomain || "zzaizzai.com";
  const url = opts.url || `https://${domain}/`;
  const markers = opts.markers?.filter(Boolean) ?? [];
  const attempts = opts.attempts ?? 3;
  const delayMs = opts.delayMs ?? 4000;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "Cache-Control": "no-cache",
          "User-Agent": "zzai-deploy-verify/1.0",
        },
      });
      const html = await res.text();
      if (!res.ok) {
        if (i < attempts - 1) {
          await sleep(delayMs);
          continue;
        }
        return { ok: false, reason: `HTTP ${res.status} from ${url}` };
      }
      for (const marker of markers) {
        if (!html.includes(marker)) {
          if (i < attempts - 1) break;
          return { ok: false, reason: `Missing marker "${marker}" on ${url}` };
        }
      }
      return { ok: true, url, markers };
    } catch (err) {
      if (i < attempts - 1) {
        await sleep(delayMs);
        continue;
      }
      return { ok: false, reason: String(err) };
    }
    await sleep(delayMs);
  }
  return { ok: false, reason: "Verification attempts exhausted" };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {string} expectedSha
 * @param {{ attempts?: number; delayMs?: number }} opts
 */
export async function verifyDeployRevision(expectedSha, opts = {}) {
  const domain = canonical.productionDomain || "zzaizzai.com";
  const url = `https://${domain}/api/deploy-revision`;
  const attempts = opts.attempts ?? 3;
  const delayMs = opts.delayMs ?? 4000;
  const want = expectedSha.trim().slice(0, 7);

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "Cache-Control": "no-cache",
          "User-Agent": "zzai-deploy-verify/1.0",
        },
      });
      const text = await res.text();
      if (!res.ok) {
        if (i < attempts - 1) {
          await sleep(delayMs);
          continue;
        }
        return { ok: false, reason: `HTTP ${res.status} from ${url}` };
      }
      const data = JSON.parse(text);
      const live = String(data.sha || "").slice(0, 7);
      if (!live) {
        if (i < attempts - 1) {
          await sleep(delayMs);
          continue;
        }
        return { ok: false, reason: `No deploy sha on production (${url})` };
      }
      if (live !== want) {
        if (i < attempts - 1) {
          await sleep(delayMs);
          continue;
        }
        return {
          ok: false,
          reason: `Production revision ${live} !== expected ${want} (stale deploy)`,
        };
      }
      return { ok: true, url, sha: live };
    } catch (err) {
      if (i < attempts - 1) {
        await sleep(delayMs);
        continue;
      }
      return { ok: false, reason: String(err) };
    }
    await sleep(delayMs);
  }
  return { ok: false, reason: "Revision verification attempts exhausted" };
}

/** @returns {{ url?: string; markers?: string[]; expectedSha?: string }[]} */
export function deployVerifyTargets(changedFiles, expectedSha) {
  const files = changedFiles ?? [];
  const domain = canonical.productionDomain || "zzaizzai.com";
  /** @type {{ url?: string; markers?: string[]; expectedSha?: string }[]} */
  const targets = [{ url: `https://${domain}/`, markers: ["ZZAI"] }];

  if (expectedSha?.trim()) {
    targets.push({ expectedSha: expectedSha.trim() });
  }

  if (files.some((f) => /clean-sneaks/i.test(f))) {
    targets.push({
      url: `https://${domain}/clean-sneaks`,
      markers: ["Baloon8 Blueprint · 3D Run"],
    });
  }

  return targets;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.env.DEPLOY_VERIFY_URL?.trim();
  const markers = process.env.DEPLOY_VERIFY_MARKERS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = await verifyProductionLive({ url, markers });
  if (result.ok) {
    console.log(`✓ Production verified: ${result.url}`);
    process.exit(0);
  }
  console.error(`✗ Production verify failed: ${result.reason}`);
  process.exit(1);
}
