import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventionVerificationRecords } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { PROOFCHAIN_DISCLAIMER } from "@/lib/poor-man-protection/invention-studio/proofchain";

/**
 * Public verification — returns ONLY authorized certificate fields.
 * Never returns confidential invention descriptions or private evidence blobs.
 *
 * Client-vault certificates are verified via POST body hash check on /protect/proofchain.
 * Server-persisted authorized certs (when synced) may be looked up here.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ publicCertId: string }> }) {
  const { publicCertId } = await ctx.params;
  if (!publicCertId || publicCertId.length < 8) {
    return NextResponse.json({ error: "Invalid certificate id" }, { status: 400 });
  }

  try {
    const rows = await db
      .select()
      .from(inventionVerificationRecords)
      .where(eq(inventionVerificationRecords.method, `public_cert:${publicCertId}`))
      .limit(1);

    if (!rows.length) {
      return NextResponse.json(
        {
          found: false,
          notice:
            "No server-authorized public certificate with this id. Client-side certificates can still be checked on /protect/proofchain by pasting the QR payload.",
          disclaimer: PROOFCHAIN_DISCLAIMER,
        },
        { status: 404 },
      );
    }

    const row = rows[0];
    let detail: Record<string, unknown> = {};
    try {
      detail = row.detail ? JSON.parse(row.detail) : {};
    } catch {
      detail = {};
    }

    return NextResponse.json({
      found: true,
      publicCertId,
      evidenceId: row.evidenceId,
      inventionId: row.inventionId,
      sha256: row.contentHash,
      status: row.status,
      issuedAt: row.createdAt,
      serverTimestamp: row.serverTimestamp,
      // Never include private description fields
      inventionTitle: detail.inventionTitleAuthorized ? detail.inventionTitle : undefined,
      originalFilename: detail.originalFilename,
      disclaimer: PROOFCHAIN_DISCLAIMER,
      methodsClaimed: detail.methodsClaimed || ["sha256"],
    });
  } catch {
    return NextResponse.json(
      {
        found: false,
        notice: "Verification lookup unavailable (database). Use client QR payload check.",
        disclaimer: PROOFCHAIN_DISCLAIMER,
      },
      { status: 503 },
    );
  }
}
