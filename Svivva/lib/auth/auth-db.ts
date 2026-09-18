import { NextResponse } from "next/server";
import {
  formatDatabaseConnectionError,
  isSchemaSetupError,
  schemaSetupErrorMessage,
} from "@/lib/db-connection-error";
import { ensureAuthTables, isMissingAuthTableError } from "@/lib/ensure-auth-tables";

/** Best-effort schema bootstrap before auth queries (Neon / first deploy). */
export async function prepareAuthDatabase(): Promise<void> {
  try {
    await ensureAuthTables();
  } catch {
    /* Connection/pooler issues are handled when the real query runs. */
  }
}

export function authDatabaseErrorResponse(
  error: unknown,
  fallback: string,
): NextResponse<{ error: string }> {
  if (isMissingAuthTableError(error) || isSchemaSetupError(error)) {
    return NextResponse.json({ error: schemaSetupErrorMessage() }, { status: 503 });
  }
  const dbMsg = formatDatabaseConnectionError(error);
  if (dbMsg) {
    return NextResponse.json({ error: dbMsg }, { status: 503 });
  }
  console.error("Auth error:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
