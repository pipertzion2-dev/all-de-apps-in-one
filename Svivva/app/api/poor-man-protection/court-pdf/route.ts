import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canUseHybridizationEngine } from "@/lib/hybridization";
import {
  buildCourtEvidencePdf,
  buildPostalCoverPdf,
  type PoorManCertificate,
} from "@/lib/poor-man-protection";

const bodySchema = z.object({
  certificate: z.record(z.unknown()),
  kind: z.enum(["court", "postal"]).optional().default("court"),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await canUseHybridizationEngine(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const cert = parsed.data.certificate as unknown as PoorManCertificate;
    if (!cert?.attestationId || !cert?.certificateHash) {
      return NextResponse.json({ error: "Not a ZZAI certificate" }, { status: 400 });
    }

    const pdf =
      parsed.data.kind === "postal"
        ? await buildPostalCoverPdf(cert)
        : await buildCourtEvidencePdf(cert);

    const filename =
      parsed.data.kind === "postal"
        ? `zzai-postal-deposit-${cert.attestationId.slice(0, 8)}.pdf`
        : `zzai-court-evidence-${cert.attestationId.slice(0, 8)}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "PDF failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
