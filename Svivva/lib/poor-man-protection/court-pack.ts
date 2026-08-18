import PDFDocument from "pdfkit";
import type { PoorManCertificate } from "./types";
import { DISCLAIMER } from "./attestation";

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.7);
  doc.fontSize(13).fillColor("#5B8DA8").text(title);
  doc
    .moveTo(50, doc.y + 2)
    .lineTo(545, doc.y + 2)
    .strokeColor("#5B8DA8")
    .lineWidth(0.6)
    .stroke();
  doc.moveDown(0.45);
  doc.fillColor("#111827").fontSize(10);
}

/** Court-oriented evidence PDF (affidavit-style pack — not a government registration). */
export async function buildCourtEvidencePdf(cert: PoorManCertificate): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 54, bottom: 54, left: 50, right: 50 },
      info: {
        Title: `ZZAI Poor Man Protection — ${cert.title}`,
        Author: cert.creatorOath?.fullLegalName || "ZZAI",
        Subject: "Evidentiary package / prior-art disclosure",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).fillColor("#5B8DA8").text("ZZAI Poor Man Protection", { align: "left" });
    doc.fontSize(11).fillColor("#6B2C4E").text("Court-oriented evidentiary package");
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#4B5563").text(DISCLAIMER, { align: "justify" });

    section(doc, "1. Identification");
    doc.text(`Title: ${cert.title}`);
    doc.text(`Attestation ID: ${cert.attestationId}`);
    doc.text(`Protocol: ${cert.protocol}`);
    doc.text(`Created (UTC): ${cert.createdAt}`);
    doc.text(`Verify URL: ${cert.verifyUrl || "n/a"}`);
    doc.text(`Certificate hash (SHA-256): ${cert.certificateHash}`);
    doc.text(`Content hash (SHA-256): ${cert.contentHash}`);
    if (cert.fileName) doc.text(`File name: ${cert.fileName}`);
    doc.text(`MIME: ${cert.mimeType}`);

    if (cert.creatorOath) {
      section(doc, "2. Creator declaration");
      doc.text(`Legal name: ${cert.creatorOath.fullLegalName}`);
      doc.text(`Role: ${cert.creatorOath.role}`);
      doc.text(`Jurisdiction: ${cert.creatorOath.jurisdiction}`);
      doc.text(`Sworn at (UTC): ${cert.creatorOath.swornAt}`);
      doc.moveDown(0.2);
      doc.text(cert.creatorOath.statement, { align: "justify" });
    }

    if (cert.chronology) {
      section(doc, "3. Creative chronology");
      const c = cert.chronology;
      if (c.conceivedOn) doc.text(`Conceived: ${c.conceivedOn}`);
      if (c.firstFixedOn) doc.text(`First fixed in tangible form: ${c.firstFixedOn}`);
      if (c.medium) doc.text(`Medium: ${c.medium}`);
      if (c.collaborators) doc.text(`Collaborators: ${c.collaborators}`);
      if (c.priorDisclosure) doc.text(`Prior disclosure: ${c.priorDisclosure}`);
      if (c.iterationNotes) {
        doc.moveDown(0.2);
        doc.text(c.iterationNotes, { align: "justify" });
      }
    }

    if (cert.patentKind === "digital" && cert.digitalDisclosure) {
      section(doc, "3b. Digital invention disclosure");
      const d = cert.digitalDisclosure;
      doc.text(`Kind: digital patent · invention type: ${d.inventionType}`);
      doc.moveDown(0.15);
      doc.text(`Problem: ${d.problemStatement}`, { align: "justify" });
      doc.moveDown(0.15);
      doc.text(`Novel steps: ${d.novelSteps}`, { align: "justify" });
      doc.moveDown(0.15);
      doc.text(`Technical effect: ${d.technicalEffect}`, { align: "justify" });
      doc.moveDown(0.15);
      doc.text(`Data structures: ${d.dataStructures}`, { align: "justify" });
      doc.moveDown(0.15);
      doc.text(`API / surface: ${d.apiSurface}`, { align: "justify" });
      doc.moveDown(0.15);
      doc.text(`User flow: ${d.userFlow}`, { align: "justify" });
      if (d.sourceExcerpt) {
        doc.moveDown(0.15);
        doc.text("Source excerpt:", { align: "justify" });
        doc.font("Courier").fontSize(8).text(d.sourceExcerpt.slice(0, 4000), { align: "left" });
        doc.font("Helvetica").fontSize(10);
      }
      if (d.artifacts?.length) {
        doc.moveDown(0.15);
        doc.text(`Artifact files (${d.artifacts.length}):`);
        for (const a of d.artifacts) {
          doc.text(`• ${a.fileName} — SHA-256 ${a.contentHash}`);
        }
      }
    }

    if (cert.groupDisclosure) {
      section(doc, "3c. Group patent figure schedule");
      doc.text(
        `Kind: group patent · ${cert.groupDisclosure.figureCount} figures · ${cert.groupDisclosure.familyCount} famil${
          cert.groupDisclosure.familyCount === 1 ? "y" : "ies"
        }`,
      );
      doc.text(`Group merkle root (SHA-256): ${cert.groupDisclosure.merkleRoot}`);
      doc.moveDown(0.15);
      for (const sheet of cert.groupDisclosure.sheets) {
        doc.text(
          `${sheet.figure} — ${sheet.role} — ${sheet.fileName} — ${sheet.contentHash.slice(0, 16)}…`,
        );
      }
    }

    section(doc, "4. Dual-axis scientific claims");
    doc.text(`Axis A — ${cert.scientificAxes.axisA.label}`);
    doc.text(cert.scientificAxes.axisA.summary, { align: "justify" });
    doc.moveDown(0.25);
    doc.text(`Axis B — ${cert.scientificAxes.axisB.label}`);
    doc.text(cert.scientificAxes.axisB.summary, { align: "justify" });
    doc.moveDown(0.25);
    doc.text(`Coupling: ${cert.scientificAxes.couplingPrinciple}`, { align: "justify" });
    doc.moveDown(0.2);
    for (const claim of cert.scientificAxes.measurableClaims) {
      doc.text(`• ${claim}`);
    }

    section(doc, "5. Hybridization engine output");
    doc.text(`Engine used: ${cert.hybridization.usedEngine ? "yes" : "scientific fallback"}`);
    doc.text(`Novelty score: ${cert.hybridization.noveltyScore}`);
    if (cert.hybridization.optimalHybridName) {
      doc.text(`Optimal hybrid: ${cert.hybridization.optimalHybridName}`);
    }
    doc.text(`Bridge: ${cert.hybridization.topologicalBridge}`, { align: "justify" });
    doc.text(`Principle: ${cert.hybridization.domainBridgingPrinciple}`, { align: "justify" });
    if (cert.hybridization.patentLandscape) {
      doc.text(`Landscape: ${cert.hybridization.patentLandscape}`, { align: "justify" });
    }
    for (const e of cert.hybridization.emergentClaims) doc.text(`• ${e}`);

    if (cert.coin) {
      section(doc, "6. Protection coin (mint-ready metadata)");
      doc.text(`${cert.coin.name} (${cert.coin.symbol})`);
      doc.text(`Standard: ${cert.coin.standard} on ${cert.coin.chain}`);
      doc.text(`Contract: ${cert.coin.contractAddress}`);
      doc.text(`Token ID: ${cert.coin.tokenId}`);
    }

    if (cert.cyberSeal) {
      section(doc, "7. Cyber integrity seal");
      doc.text(`Algorithm: ${cert.cyberSeal.algorithm}`);
      doc.text(`Seal hash: ${cert.cyberSeal.sealHash}`);
      doc.text(`Sealed at: ${cert.cyberSeal.sealedAt}`);
    }

    if (cert.timestampToken) {
      section(doc, "8. Timestamp token (ZZAI-TST-1)");
      doc.text(`genTime: ${cert.timestampToken.genTime}`);
      doc.text(`serial: ${cert.timestampToken.serialNumber}`);
      doc.text(`policy: ${cert.timestampToken.policy}`);
      doc.text(`signature: ${cert.timestampToken.signature}`);
      doc
        .fontSize(8)
        .fillColor("#6B7280")
        .text(
          "Note: ZZAI-TST-1 is platform-signed. For eIDAS-qualified timestamps, deposit with a QTSP / counsel.",
        )
        .fillColor("#111827")
        .fontSize(10);
    }

    if (cert.custodyLog?.length) {
      section(doc, "9. Chain of custody");
      for (const ev of cert.custodyLog) {
        doc.text(`${ev.at} — ${ev.event}${ev.detail ? `: ${ev.detail}` : ""}`);
      }
    }

    section(doc, "10. How to use this package in a dispute");
    doc.text(
      [
        "1. Keep the original binary unmodified alongside this PDF and the JSON certificate.",
        "2. Recalculate SHA-256 of the original file; it must match Content hash above.",
        "3. Attach this pack to counsel correspondence, platform IP reports, or filings as supporting evidence of anteriority/possession.",
        "4. Consider formal U.S. Copyright Office registration for statutory damages / lawsuit prerequisites.",
        "5. Optional physical deposit: print this pack + a copy of the work, seal, and send via certified mail to yourself or counsel — retain unopened as corroborating evidence (not a substitute for registration).",
      ].join("\n"),
    );

    doc.moveDown(1);
    doc
      .fontSize(8)
      .fillColor("#6B7280")
      .text(`Generated by zzai zzai · ${cert.createdAt}`, { align: "center" });

    doc.end();
  });
}

/** One-page postal deposit cover sheet for certified-mail / notary workflows. */
export async function buildPostalCoverPdf(cert: PoorManCertificate): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 54, bottom: 54, left: 50, right: 50 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).fillColor("#5B8DA8").text("Physical deposit cover sheet");
    doc.fontSize(10).fillColor("#111827");
    doc.moveDown();
    doc.text(
      "Use this with a sealed envelope containing: (1) this sheet, (2) a print of the work, (3) the court PDF, (4) the JSON certificate.",
    );
    doc.moveDown();
    doc.text(`Work: ${cert.title}`);
    doc.text(`Attestation ID: ${cert.attestationId}`);
    doc.text(`Content SHA-256: ${cert.contentHash}`);
    doc.text(`Certificate SHA-256: ${cert.certificateHash}`);
    if (cert.groupDisclosure) {
      doc.text(
        `Group patent: ${cert.groupDisclosure.figureCount} figures · merkle ${cert.groupDisclosure.merkleRoot}`,
      );
    }
    doc.text(`Creator: ${cert.creatorOath?.fullLegalName || "(declare on oath page)"}`);
    doc.moveDown();
    doc.text("Mailing checklist:");
    doc.text("• Print on plain paper; do not staple through the artwork print.");
    doc.text("• Place in opaque envelope; seal with tape across flap.");
    doc.text("• Send via certified mail / registered post to yourself or counsel.");
    doc.text("• Store unopened with tracking receipt — open only if counsel/court requests.");
    doc.moveDown();
    doc.fontSize(8).fillColor("#6B7280").text(DISCLAIMER);
    doc.end();
  });
}
