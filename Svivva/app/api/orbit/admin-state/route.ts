import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";

// Ensure the column exists (idempotent)
let columnEnsured = false;
async function ensureColumn() {
  if (columnEnsured) return;
  try {
    await db.execute(
      sql`ALTER TABLE seed_credentials ADD COLUMN IF NOT EXISTS orbit_admin_state TEXT`,
    );
    columnEnsured = true;
  } catch {
    /* column already exists or table missing — handled gracefully */
  }
}

/** GET — load saved orbit admin state */
export async function GET(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await ensureColumn();
    const userId = await resolveOrbitInternalUserId();
    if (!userId) {
      return NextResponse.json({ statuses: {}, results: {} });
    }
    const result = await db.execute(
      sql`SELECT orbit_admin_state FROM seed_credentials WHERE user_id = ${userId} LIMIT 1`,
    );
    const row = result.rows?.[0] as Record<string, unknown> | undefined;
    const raw = row?.orbit_admin_state;
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ statuses: {}, results: {} });
    }
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ statuses: {}, results: {} });
  }
}

/** POST — save orbit admin state */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await ensureColumn();
    const body = await req.json();
    const state = JSON.stringify({
      statuses: body.statuses || {},
      results: body.results || {},
    });

    const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";

    // Upsert: insert or update orbit state
    await db.execute(sql`
      INSERT INTO seed_credentials (id, user_id, orbit_admin_state, updated_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${state}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET orbit_admin_state = ${state}, updated_at = NOW()
    `);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
