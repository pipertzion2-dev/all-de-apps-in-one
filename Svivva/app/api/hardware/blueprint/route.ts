import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import PDFDocument from "pdfkit";
import { z } from "zod";

const reqSchema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(2000).optional().default(""),
  category: z.string().max(200).optional().default(""),
  targetUsers: z.string().max(1000).optional().default(""),
  useCases: z.string().max(1000).optional().default(""),
  requirements: z.array(z.string()).optional().default([]),
  materials: z.array(z.string()).optional().default([]),
  manufacturingMethod: z.string().max(200).optional().default(""),
  budgetRange: z.number().optional().default(5000),
  manufacturers: z
    .array(
      z.object({
        name: z.string(),
        website: z.string().optional(),
        specialty: z.string().optional(),
        estimatedCost: z.string().optional(),
        moq: z.string().optional(),
        location: z.string().optional(),
        leadTime: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  materialSuppliers: z
    .array(
      z.object({
        material: z.string(),
        supplier: z.string(),
        website: z.string().optional(),
        priceRange: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  platforms: z
    .array(
      z.object({
        name: z.string(),
        website: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  recommendation: z.string().max(2000).optional().default(""),
  hybrids: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        fromSystemA: z.string().optional(),
        fromSystemB: z.string().optional(),
        emergentBehavior: z.string().optional(),
        noveltyScore: z.number().optional(),
      }),
    )
    .optional()
    .default([]),
});

function drawLine(doc: PDFKit.PDFDocument, y: number) {
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#5BA8A0").lineWidth(0.5).stroke();
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.8);
  doc.fontSize(14).fillColor("#5BA8A0").text(title, { underline: false });
  doc.moveDown(0.3);
  drawLine(doc, doc.y);
  doc.moveDown(0.4);
  doc.fillColor("#333333");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const body = await req.json();
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const data = parsed.data;

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `${data.productName} - Product Blueprint`,
        Author: "Svivva Hardware Builder",
        Subject: "Manufacturing Blueprint",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfDone = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.rect(0, 0, doc.page.width, 120).fill("#1a1a2e");
    doc.fontSize(28).fillColor("#5BA8A0").text("SVIVVA", 50, 35, { align: "left" });
    doc.fontSize(10).fillColor("#ffffff").text("Hardware Builder — Product Blueprint", 50, 70);
    doc
      .fontSize(9)
      .fillColor("#aaaaaa")
      .text(
        `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        50,
        88,
      );
    doc.fontSize(9).fillColor("#aaaaaa").text("hello@svivva.com", 50, 100);

    doc.y = 140;

    doc.fontSize(22).fillColor("#1a1a2e").text(data.productName, 50, 140);
    if (data.category) {
      doc.fontSize(11).fillColor("#6B2C4A").text(data.category, 50);
    }
    doc.moveDown(0.5);
    if (data.productDescription) {
      doc
        .fontSize(10)
        .fillColor("#555555")
        .text(data.productDescription, 50, undefined, { width: 495 });
    }

    sectionTitle(doc, "1. Target Market & Use Cases");
    doc.fontSize(10).fillColor("#333333");
    if (data.targetUsers) {
      doc
        .font("Helvetica-Bold")
        .text("Target Users: ", { continued: true })
        .font("Helvetica")
        .text(data.targetUsers, { width: 495 });
      doc.moveDown(0.3);
    }
    if (data.useCases) {
      doc
        .font("Helvetica-Bold")
        .text("Use Cases: ", { continued: true })
        .font("Helvetica")
        .text(data.useCases, { width: 495 });
    }

    sectionTitle(doc, "2. Technical Specifications");
    doc.fontSize(10);
    if (data.requirements.length > 0) {
      doc.font("Helvetica-Bold").text("Requirements:");
      doc.font("Helvetica");
      data.requirements.forEach((r) => doc.text(`  •  ${r}`));
      doc.moveDown(0.3);
    }
    if (data.materials.length > 0) {
      doc.font("Helvetica-Bold").text("Materials:");
      doc.font("Helvetica");
      data.materials.forEach((m) => doc.text(`  •  ${m}`));
      doc.moveDown(0.3);
    }
    if (data.manufacturingMethod) {
      doc
        .font("Helvetica-Bold")
        .text("Manufacturing Method: ", { continued: true })
        .font("Helvetica")
        .text(data.manufacturingMethod);
    }
    doc
      .font("Helvetica-Bold")
      .text("Budget: ", { continued: true })
      .font("Helvetica")
      .text(`$${data.budgetRange.toLocaleString()}`);

    if (data.manufacturers.length > 0) {
      sectionTitle(doc, "3. Recommended Manufacturers");
      doc.fontSize(10);
      data.manufacturers.forEach((m, i) => {
        doc
          .font("Helvetica-Bold")
          .fillColor("#1a1a2e")
          .text(`${i + 1}. ${m.name}`);
        doc.font("Helvetica").fillColor("#555555");
        if (m.specialty) doc.text(`   Specialty: ${m.specialty}`);
        if (m.estimatedCost) doc.text(`   Est. Cost: ${m.estimatedCost}`);
        if (m.moq) doc.text(`   Min. Order: ${m.moq}`);
        if (m.location) doc.text(`   Location: ${m.location}`);
        if (m.leadTime) doc.text(`   Lead Time: ${m.leadTime}`);
        if (m.website) doc.text(`   Website: ${m.website}`);
        doc.moveDown(0.3);
      });
    }

    if (data.materialSuppliers.length > 0) {
      sectionTitle(doc, "4. Material Suppliers");
      doc.fontSize(10);
      data.materialSuppliers.forEach((s) => {
        doc.font("Helvetica-Bold").fillColor("#1a1a2e").text(`${s.material} — ${s.supplier}`);
        doc.font("Helvetica").fillColor("#555555");
        if (s.priceRange) doc.text(`   Price: ${s.priceRange}`);
        if (s.website) doc.text(`   ${s.website}`);
        doc.moveDown(0.2);
      });
    }

    if (data.platforms.length > 0) {
      sectionTitle(doc, "5. Manufacturing Platforms");
      doc.fontSize(10);
      data.platforms.forEach((p) => {
        doc.font("Helvetica-Bold").fillColor("#1a1a2e").text(p.name);
        doc.font("Helvetica").fillColor("#555555");
        if (p.description) doc.text(`   ${p.description}`);
        if (p.website) doc.text(`   ${p.website}`);
        doc.moveDown(0.2);
      });
    }

    if (data.recommendation) {
      sectionTitle(doc, "6. Manufacturing Recommendation");
      doc.fontSize(10).fillColor("#333333").text(data.recommendation, { width: 495 });
    }

    if (data.hybrids.length > 0) {
      sectionTitle(doc, "7. Hybrid Innovation Concepts");
      doc.fontSize(10);
      data.hybrids.forEach((h, i) => {
        doc
          .font("Helvetica-Bold")
          .fillColor("#6B2C4A")
          .text(`${i + 1}. ${h.title}${h.noveltyScore ? ` (${h.noveltyScore}% novel)` : ""}`);
        doc.font("Helvetica").fillColor("#555555");
        if (h.description) doc.text(`   ${h.description}`);
        if (h.emergentBehavior) doc.text(`   Emergent: ${h.emergentBehavior}`);
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1);
    drawLine(doc, doc.y);
    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text(
        "This blueprint was generated by Svivva Hardware Builder. For questions, contact hello@svivva.com",
        { align: "center" },
      );
    doc.text("© Svivva " + new Date().getFullYear(), { align: "center" });

    doc.end();
    const pdfBuffer = await pdfDone;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.productName.replace(/[^a-zA-Z0-9]/g, "_")}_Blueprint.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
