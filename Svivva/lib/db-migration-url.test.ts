import { afterEach, describe, expect, it, vi } from "vitest";
import { getDatabaseMigrationUrl, isPooledDatabaseUrl } from "@/lib/db-migration-url";

describe("getDatabaseMigrationUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers DATABASE_URL_UNPOOLED over pooled DATABASE_URL", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://u:p@ep-abc-pooler.us-east-2.aws.neon.tech/db?sslmode=require",
    );
    vi.stubEnv(
      "DATABASE_URL_UNPOOLED",
      "postgresql://u:p@ep-abc.us-east-2.aws.neon.tech/db?sslmode=require",
    );
    expect(getDatabaseMigrationUrl()).toBe(
      "postgresql://u:p@ep-abc.us-east-2.aws.neon.tech/db?sslmode=require",
    );
  });

  it("derives direct URL from pooled Neon hostname when unpooled is missing", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://u:p@ep-abc-pooler.us-east-2.aws.neon.tech/db?sslmode=require",
    );
    expect(getDatabaseMigrationUrl()).toBe(
      "postgresql://u:p@ep-abc.us-east-2.aws.neon.tech/db?sslmode=require",
    );
  });

  it("returns null when no database env is set", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DATABASE_URL_UNPOOLED", "");
    expect(getDatabaseMigrationUrl()).toBeNull();
  });
});

describe("isPooledDatabaseUrl", () => {
  it("detects Neon pooler hostnames", () => {
    expect(isPooledDatabaseUrl("postgresql://u:p@ep-x-pooler.neon.tech/db")).toBe(true);
    expect(isPooledDatabaseUrl("postgresql://u:p@ep-x.neon.tech/db")).toBe(false);
  });
});
