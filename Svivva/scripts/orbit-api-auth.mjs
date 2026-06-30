/**
 * Orbit API auth for CLI / AI agents.
 * Tries ORBIT_INTERNAL_SECRET first, then admin passcode cookie (272727).
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const COOKIE_JAR = resolve(repoRoot, ".orbit-agent-cookies.json");

export function loadOrbitEnv() {
  for (const name of [".env.orbit", ".env"]) {
    const p = resolve(repoRoot, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function parseSetCookie(headers) {
  const raw = headers.getSetCookie?.() ?? [];
  const jar = {};
  for (const line of raw) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return jar;
}

function loadJar() {
  if (!existsSync(COOKIE_JAR)) return {};
  try {
    return JSON.parse(readFileSync(COOKIE_JAR, "utf8"));
  } catch {
    return {};
  }
}

function saveJar(jar) {
  writeFileSync(COOKIE_JAR, JSON.stringify(jar));
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export async function ensureOrbitAuth(site) {
  loadOrbitEnv();
  const secret = process.env.ORBIT_INTERNAL_SECRET?.trim();
  if (secret) return { mode: "secret", secret, site };

  let jar = loadJar();
  if (jar.svivva_admin === "1") {
    const probe = await fetch(`${site}/api/orbit/status`, {
      headers: { Cookie: cookieHeader(jar) },
    });
    if (probe.ok) return { mode: "admin-cookie", jar, site };
  }

  const code = process.env.ORBIT_ADMIN_CODE?.trim() || "272727";
  const res = await fetch(`${site}/api/auth/admin-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    throw new Error(
      `Admin auth failed (HTTP ${res.status}). Set ORBIT_INTERNAL_SECRET in .env.orbit or ORBIT_ADMIN_CODE.`,
    );
  }
  jar = { ...jar, ...parseSetCookie(res.headers) };
  saveJar(jar);
  return { mode: "admin-cookie", jar, site };
}

export async function orbitFetch(auth, path, { method = "GET", body, timeoutMs = 300_000 } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth.mode === "secret") headers["x-internal-secret"] = auth.secret;
  else if (auth.jar) headers.Cookie = cookieHeader(auth.jar);

  const res = await fetch(`${auth.site}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { res, json };
}

export function clearOrbitAgentCookies() {
  if (existsSync(COOKIE_JAR)) unlinkSync(COOKIE_JAR);
}
