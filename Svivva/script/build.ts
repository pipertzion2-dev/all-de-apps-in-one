import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

function run(cmd: string, label: string) {
  console.log(`\n→ ${label}`);
  execSync(cmd, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });
}

async function buildAll() {
  // Push DB schema so all tables exist before Next.js tries to query them
  if (process.env.DATABASE_URL) {
    try {
      run("./node_modules/.bin/drizzle-kit push --force", "Pushing database schema…");
    } catch (err) {
      try {
        run("npx drizzle-kit push --force", "Pushing database schema (fallback)…");
      } catch {
        console.warn("⚠ DB push failed (continuing build):", (err as Error).message);
      }
    }
  } else {
    console.warn("⚠ DATABASE_URL not set — skipping db:push");
  }

  // Prefer local next binary over npx to avoid PATH resolution issues in autoscale containers
  const nextBin = resolve("node_modules/.bin/next");
  run(`node "${nextBin}" build`, "Building Next.js application…");

  console.log("\nCreating production server entry…");
  mkdirSync("dist", { recursive: true });

  // Use node + direct binary path — avoids npx resolution failures in autoscale
  const serverCode = `
const { spawn } = require("child_process");
const path = require("path");
const port = process.env.PORT || "5000";
const nextBin = path.resolve(__dirname, "../node_modules/.bin/next");

console.log("Starting Next.js production server on 0.0.0.0:" + port + "...");

// Try direct binary first, fall back to npx
const [cmd, args] = (() => {
  const fs = require("fs");
  if (fs.existsSync(nextBin)) {
    return ["node", [nextBin, "start", "-H", "0.0.0.0", "-p", port]];
  }
  return ["npx", ["next", "start", "-H", "0.0.0.0", "-p", port]];
})();

const nextProcess = spawn(cmd, args, {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: false,
  env: Object.assign({}, process.env, { NODE_ENV: "production" }),
});
nextProcess.on("error", function(err) {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
nextProcess.on("close", function(code) {
  process.exit(code || 0);
});
process.on("SIGINT", function() { nextProcess.kill("SIGINT"); });
process.on("SIGTERM", function() { nextProcess.kill("SIGTERM"); });
`;

  writeFileSync("dist/index.cjs", serverCode);
  console.log("\nBuild complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
