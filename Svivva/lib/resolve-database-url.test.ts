import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  ensureDatabaseUrl,
  isLocalDatabaseUrl,
  resolveDatabaseUrl,
} from "./resolve-database-url";

const LOCAL = "postgresql://svivva:svivva_local_dev@127.0.0.1:5432/svivva";
const NEON = "postgresql://user:pass@ep-cool-name.us-east-2.aws.neon.tech/neondb?sslmode=require";

describe("resolve-database-url", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env = { ...envSnapshot };
  });

  afterEach(() => {
    process.env = envSnapshot;
  });

  it("detects localhost URLs", () => {
    expect(isLocalDatabaseUrl(LOCAL)).toBe(true);
    expect(isLocalDatabaseUrl(NEON)).toBe(false);
  });

  it("prefers POSTGRES_URL over localhost DATABASE_URL on Vercel", () => {
    process.env.VERCEL = "1";
    process.env.DATABASE_URL = LOCAL;
    process.env.POSTGRES_URL = NEON;
    expect(resolveDatabaseUrl()).toBe(NEON);
    expect(ensureDatabaseUrl()).toBe(NEON);
    expect(process.env.DATABASE_URL).toBe(NEON);
  });

  it("keeps localhost DATABASE_URL locally when no alternative exists", () => {
    delete process.env.VERCEL;
    process.env.DATABASE_URL = LOCAL;
    expect(resolveDatabaseUrl()).toBe(LOCAL);
  });
});
