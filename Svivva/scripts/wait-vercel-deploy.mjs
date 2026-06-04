/**
 * Wait for a Vercel production deployment to finish.
 * Uses `vercel inspect --wait --format json` (do not pipe human output to head — SIGABRT).
 */
import { spawnSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const timeout = process.env.VERCEL_DEPLOY_TIMEOUT?.trim() || "15m";
const deploymentArg = process.argv[2]?.trim();

function runVercel(args, options = {}) {
  const result = spawnSync("vercel", args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    stdio: options.inheritStderr ? ["ignore", "pipe", "inherit"] : "pipe",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  return result;
}

function parseJson(stdout) {
  const text = stdout.trim();
  const start = text.indexOf("{");
  if (start < 0) {
    throw new Error("Vercel CLI did not return JSON");
  }
  return JSON.parse(text.slice(start));
}

function deploymentUrl(raw) {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

function latestProductionUrl() {
  const result = runVercel(["ls", "--prod", "--format", "json", "--yes"]);
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "vercel ls failed\n");
    process.exit(result.status ?? 1);
  }

  const payload = parseJson(result.stdout);
  const deployments = Array.isArray(payload) ? payload : payload.deployments;
  const latest = deployments?.[0];
  const url = latest?.url;
  if (!url) {
    console.error("No production deployments found.");
    process.exit(1);
  }
  return deploymentUrl(url);
}

const target = deploymentArg ? deploymentUrl(deploymentArg) : latestProductionUrl();
console.log(`Waiting for ${target} (timeout ${timeout})…`);

const waitResult = runVercel(
  ["inspect", target, "--wait", "--format", "json", "--timeout", timeout],
  { inheritStderr: true },
);

if (waitResult.status !== 0) {
  process.stderr.write(waitResult.stderr || waitResult.stdout || "vercel inspect --wait failed\n");
  process.exit(waitResult.status ?? 1);
}

const deployment = parseJson(waitResult.stdout);
const state = (deployment.readyState || deployment.state || "UNKNOWN").toUpperCase();
const aliases = (deployment.aliases || deployment.aliasAssigned)
  ?.map((entry) => (typeof entry === "string" ? entry : entry.domain))
  .filter(Boolean);

console.log(`Deployment ${state}: ${deployment.url || target}`);
if (aliases?.length) {
  console.log(`Live: ${aliases.join(", ")}`);
}

if (state === "READY") {
  process.exit(0);
}

console.error(`Deployment ended in ${state}.`);
process.exit(1);
