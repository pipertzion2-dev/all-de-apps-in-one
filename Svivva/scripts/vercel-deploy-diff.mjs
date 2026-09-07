/**
 * Shared helpers for Vercel ignoreCommand + CI deploy wait.
 * Decides whether a commit needs a new production build.
 */
import { execSync } from "child_process";

/** Paths that affect the live Next.js app (bundle, routes, runtime config). */
const PRODUCTION_PREFIXES = [
  "app/",
  "components/",
  "lib/",
  "hooks/",
  "shared/",
  "server/",
  "script/",
  "public/",
  "migrations/",
];

const PRODUCTION_FILES = new Set([
  "middleware.ts",
  "next.config.mjs",
  "next.config.js",
  "package.json",
  "package-lock.json",
  "vercel.json",
  "drizzle.config.ts",
  "tailwind.config.ts",
  "tsconfig.json",
]);

export function normalizeSvivvaPath(file) {
  return file.replace(/^Svivva\//, "");
}

export function isProductionShipPath(file) {
  const rel = normalizeSvivvaPath(file);
  if (!rel || rel.startsWith("../")) return false;
  if (/\.(test|spec)\.(tsx?|jsx?|mjs|cjs)$/.test(rel)) return false;
  if (rel.startsWith("scripts/")) return false;
  if (PRODUCTION_FILES.has(rel)) return true;
  return PRODUCTION_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

export function listChangedFiles(base, head, cwd = ".") {
  try {
    const out = execSync(`git diff --name-only ${base} ${head}`, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

export function filesRequireProductionDeploy(files) {
  if (!files?.length) return false;
  return files.some(isProductionShipPath);
}

/** When unsure (missing git range), prefer building. */
export function diffRequiresProductionDeploy(base, head, cwd = ".") {
  const files = listChangedFiles(base, head, cwd);
  if (files === null) return true;
  return filesRequireProductionDeploy(files);
}

export async function fetchParentSha(sha) {
  const repo = process.env.GITHUB_REPOSITORY?.trim();
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!repo || !token || !sha) return null;

  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.parents?.[0]?.sha ?? null;
}

export async function resolveDiffRangeAsync(cwd = ".") {
  const current = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || "HEAD";
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA?.trim();
  if (previous && previous !== current) {
    return {
      base: previous,
      head: current,
      label: `${previous.slice(0, 7)}..${current.slice(0, 7)}`,
    };
  }

  const githubSha = process.env.GITHUB_SHA?.trim();
  if (githubSha) {
    try {
      const parent = execSync(`git rev-parse ${githubSha}^`, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      return {
        base: parent,
        head: githubSha,
        label: `${parent.slice(0, 7)}..${githubSha.slice(0, 7)}`,
      };
    } catch {
      const parent = await fetchParentSha(githubSha);
      if (parent) {
        return {
          base: parent,
          head: githubSha,
          label: `${parent.slice(0, 7)}..${githubSha.slice(0, 7)}`,
        };
      }
      return { base: null, head: githubSha, label: githubSha.slice(0, 7) };
    }
  }

  try {
    execSync("git rev-parse HEAD^", { cwd, stdio: "ignore" });
    return { base: "HEAD^", head: "HEAD", label: "HEAD^..HEAD" };
  } catch {
    return { base: null, head: current, label: current.slice(0, 7) };
  }
}

export function resolveDiffRange(cwd = ".") {
  const current = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || "HEAD";
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA?.trim();
  if (previous && previous !== current) {
    return {
      base: previous,
      head: current,
      label: `${previous.slice(0, 7)}..${current.slice(0, 7)}`,
    };
  }

  const githubSha = process.env.GITHUB_SHA?.trim();
  if (githubSha) {
    try {
      const parent = execSync(`git rev-parse ${githubSha}^`, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      return {
        base: parent,
        head: githubSha,
        label: `${parent.slice(0, 7)}..${githubSha.slice(0, 7)}`,
      };
    } catch {
      return { base: null, head: githubSha, label: githubSha.slice(0, 7) };
    }
  }

  try {
    execSync("git rev-parse HEAD^", { cwd, stdio: "ignore" });
    return { base: "HEAD^", head: "HEAD", label: "HEAD^..HEAD" };
  } catch {
    return { base: null, head: current, label: current.slice(0, 7) };
  }
}
