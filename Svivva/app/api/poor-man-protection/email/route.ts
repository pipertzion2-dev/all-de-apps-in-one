import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canUseHybridizationEngine } from "@/lib/hybridization";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildCertificateEmailHtml,
  buildCourtEvidencePdf,
  sendProtectionEmail,
  type PoorManCertificate,
} from "@/lib/poor-man-protection";

const bodySchema = z.object({
  certificate: z.record(z.unknown()),
  to: z.string().email().optional(),
  counselEmail: z.string().email().optional(),
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

    const user = await getCurrentUser().catch(() => null);
    const to = parsed.data.to || user?.email || undefined;
    if (!to) {
      return NextResponse.json(
        { error: "Provide an email address (or sign in with an email account)." },
        { status: 400 },
      );
    }

    const pdf = await buildCourtEvidencePdf(cert);
    const html = buildCertificateEmailHtml({
      title: cert.title,
      attestationId: cert.attestationId,
      contentHash: cert.contentHash,
      verifyUrl: cert.verifyUrl,
      recipientName: cert.creatorOath?.fullLegalName || user?.firstName || undefined,
    });

    const primary = await sendProtectionEmail({
      to,
      subject: `ZZAI Poor Man Protection sealed — ${cert.title}`,
      html,
      attachments: [
        {
          filename: `zzai-court-evidence-${cert.attestationId.slice(0, 8)}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });

    let counsel: { ok: boolean; error?: string } | undefined;
    if (parsed.data.counselEmail) {
      counsel = await sendProtectionEmail({
        to: parsed.data.counselEmail,
        subject: `Counsel copy — ZZAI protection pack — ${cert.title}`,
        html,
        attachments: [
          {
            filename: `zzai-court-evidence-${cert.attestationId.slice(0, 8)}.pdf`,
            content: pdf,
            contentType: "application/pdf",
          },
        ],
      });
    }

    if (!primary.ok) {
      return NextResponse.json({ error: primary.error, counsel }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      emailedTo: to,
      messageId: primary.id,
      counsel,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
