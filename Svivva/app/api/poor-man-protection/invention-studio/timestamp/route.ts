import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";

const bodySchema = z.object({
  contentHash: z.string().min(16).max(128),
  inventionId: z.string().min(4).max(80),
  label: z.string().max(200).optional(),
});

/**
 * Issues a server timestamp token for a client-computed content hash.
 * Not an RFC 3161 TSA and not a blockchain anchor — only what we implement.
 */
export async function POST(req: NextRequest) {
  const { user } = await requireUser();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid timestamp request" }, { status: 400 });
  }

  const serverTimestamp = new Date().toISOString();
  const payload = {
    protocol: "ZZAI-Invention-Protection-Studio/1.0",
    method: "server_timestamp",
    contentHash: parsed.data.contentHash,
    inventionId: parsed.data.inventionId,
    label: parsed.data.label || "version_seal",
    serverTimestamp,
    userId: user?.id || null,
  };
  const token = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  return NextResponse.json({
    ...payload,
    token,
    implementedMethods: ["sha256", "server_timestamp", "audit_chain"],
    notImplemented: [
      "Digital signature integrations",
      "Trusted timestamp authority (RFC 3161)",
      "Blockchain anchoring",
    ],
  });
}
