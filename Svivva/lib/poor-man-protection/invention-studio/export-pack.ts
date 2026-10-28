import JSZip from "jszip";
import PDFDocument from "pdfkit";
import { buildInventionDisclosure, disclosureToMarkdown } from "./disclosure";
import type { InventionBundle } from "./types";
import { INVENTION_STUDIO_PROTOCOL } from "./types";

function collectPdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function buildDisclosurePdf(bundle: InventionBundle): Promise<Buffer> {
  const disclosure = buildInventionDisclosure(bundle);
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  const done = collectPdfBuffer(doc);

  doc.fillColor("#5B8DA8").fontSize(18).text("ZZAI Invention Protection Studio", { align: "left" });
  doc.moveDown(0.3);
  doc
    .fillColor("#333")
    .fontSize(11)
    .text("Invention Disclosure (documentation only — not a USPTO filing)");
  doc.moveDown();
  doc.fontSize(14).fillColor("#6B2C4E").text(disclosure.title);
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor("#555").text(disclosure.disclaimer, { align: "justify" });
  doc.moveDown();

  for (const section of disclosure.sections) {
    doc.fontSize(11).fillColor("#5B8DA8").text(section.heading);
    doc
      .fontSize(10)
      .fillColor("#222")
      .text(section.body || "—", { align: "justify" });
    doc.moveDown(0.6);
  }

  doc.addPage();
  doc.fontSize(12).fillColor("#5B8DA8").text("Evidence index");
  doc.moveDown(0.4);
  for (const e of disclosure.evidenceIndex) {
    doc
      .fontSize(9)
      .fillColor("#222")
      .text(`${e.filename} · ${e.id} · SHA-256 ${e.sha256} · ${e.uploaded}`);
  }
  if (!disclosure.evidenceIndex.length) {
    doc.fontSize(9).text("No evidence attached.");
  }

  doc.moveDown();
  doc.fontSize(12).fillColor("#5B8DA8").text("Drawing / component index");
  doc.moveDown(0.4);
  for (const d of disclosure.drawingIndex) {
    doc.fontSize(9).fillColor("#222").text(`FIG. ${d.number}: ${d.name} (${d.material})`);
  }
  if (!disclosure.drawingIndex.length) {
    doc.fontSize(9).text("No numbered callouts yet.");
  }

  doc.end();
  return done;
}

/** Minimal OOXML DOCX (Word-readable) without extra deps. */
export async function buildDisclosureDocx(bundle: InventionBundle): Promise<Buffer> {
  const md = disclosureToMarkdown(buildInventionDisclosure(bundle));
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${line || " "}</w:t></w:r></w:p>`)
    .join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${escaped}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypes);
  zip.folder("_rels")?.file(".rels", rels);
  zip.folder("word")?.file("document.xml", documentXml);
  const out = await zip.generateAsync({ type: "nodebuffer" });
  return Buffer.from(out);
}

export async function buildProtectionZip(
  bundle: InventionBundle,
  opts?: { includePdf?: boolean; includeDocx?: boolean },
): Promise<Buffer> {
  const zip = new JSZip();
  const disclosure = buildInventionDisclosure(bundle);
  zip.file("invention-disclosure.json", JSON.stringify(disclosure, null, 2));
  zip.file("invention-disclosure.md", disclosureToMarkdown(disclosure));
  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        protocol: INVENTION_STUDIO_PROTOCOL,
        inventionId: bundle.invention.id,
        title: bundle.invention.fields.title,
        version: bundle.invention.currentVersion,
        exportedAt: new Date().toISOString(),
        evidenceCount: bundle.evidence.length,
        auditCount: bundle.audit.length,
        note: "Private invention protection package from ZZAI Poor Man Protection.",
      },
      null,
      2,
    ),
  );
  zip.file("audit-log.json", JSON.stringify(bundle.audit, null, 2));
  zip.file("evidence-index.json", JSON.stringify(bundle.evidence, null, 2));
  zip.file("versions.json", JSON.stringify(bundle.versions, null, 2));
  zip.file(
    "ai-suggestions.json",
    JSON.stringify(
      bundle.aiSuggestions.map((s) => ({
        ...s,
        notice: "AI-generated suggestion — not user evidence",
      })),
      null,
      2,
    ),
  );

  if (opts?.includePdf !== false) {
    zip.file("invention-disclosure.pdf", await buildDisclosurePdf(bundle));
  }
  if (opts?.includeDocx !== false) {
    zip.file("invention-disclosure.docx", await buildDisclosureDocx(bundle));
  }

  const out = await zip.generateAsync({ type: "nodebuffer" });
  return Buffer.from(out);
}
