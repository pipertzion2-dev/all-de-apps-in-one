import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCertificateHash, type PoorManCertificate } from "@/lib/poor-man-protection";

const bodySchema = z.object({
  certificate: z.record(z.unknown()),
});

/** Verify a downloaded Poor Man Protection certificate's integrity hash. */
export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const cert = parsed.data.certificate as unknown as PoorManCertificate;
    if (!cert?.certificateHash || !cert?.protocol) {
      return NextResponse.json({ valid: false, error: "Not a ZZAI certificate" }, { status: 400 });
    }
    const valid = verifyCertificateHash(cert);
    return NextResponse.json({
      valid,
      protocol: cert.protocol,
      attestationId: cert.attestationId,
      contentHash: cert.contentHash,
      title: cert.title,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
