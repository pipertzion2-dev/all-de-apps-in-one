import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import {
  buildDisclosureDocx,
  buildDisclosurePdf,
  buildProtectionZip,
} from "@/lib/poor-man-protection/invention-studio/export-pack";
import type { InventionBundle } from "@/lib/poor-man-protection/invention-studio/types";

export const maxDuration = 60;

const bodySchema = z.object({
  format: z.enum(["pdf", "docx", "zip", "json"]),
  bundle: z.custom<InventionBundle>(),
});

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser();
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid export request" }, { status: 400 });
    }

    const { format, bundle } = parsed.data;
    if (!bundle?.invention?.id || !bundle?.invention?.fields?.title) {
      return NextResponse.json({ error: "Missing invention bundle" }, { status: 400 });
    }

    const stamp = new Date().toISOString();
    const base = `invention-${bundle.invention.id.slice(0, 12)}-v${bundle.invention.currentVersion}`;

    if (format === "json") {
      return NextResponse.json({
        ...bundle,
        exportMeta: {
          serverTimestamp: stamp,
          exportedBy: user?.id || "guest_session",
          notice: "Documentation export only — not a USPTO filing.",
        },
      });
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === "pdf") {
      buffer = await buildDisclosurePdf(bundle);
      contentType = "application/pdf";
      filename = `${base}.pdf`;
    } else if (format === "docx") {
      buffer = await buildDisclosureDocx(bundle);
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      filename = `${base}.docx`;
    } else {
      buffer = await buildProtectionZip(bundle);
      contentType = "application/zip";
      filename = `${base}-protection-pack.zip`;
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Server-Timestamp": stamp,
        "X-Export-Notice": "documentation-only-not-a-uspto-filing",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
