import { defineConfig } from "drizzle-kit";
import { getDatabaseMigrationUrl } from "./lib/db-migration-url";

const migrationUrl = getDatabaseMigrationUrl();
if (!migrationUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: [
    "./shared/schema.ts",
    "./lib/schema.ts",
    "./lib/marketing/schema.ts",
    "./lib/orbit/schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
  tablesFilter: ["!apex_call_logs", "!apex_cycles"],
});
