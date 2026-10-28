import type { InventionBundle } from "./types";
import { INVENTION_STUDIO_PROTOCOL } from "./types";

export type DisclosureDocument = {
  protocol: typeof INVENTION_STUDIO_PROTOCOL;
  kind: "invention_disclosure";
  generatedAt: string;
  inventionId: string;
  version: number;
  title: string;
  sections: Array<{ heading: string; body: string; source: "user" | "derived" }>;
  evidenceIndex: Array<{ id: string; filename: string; sha256: string; uploaded: string }>;
  drawingIndex: Array<{ number: number; name: string; material: string }>;
  disclaimer: string;
};

const DISCLAIMER =
  "This document is an organized invention disclosure prepared inside ZZAI Poor Man Protection / Invention Protection Studio. It is documentation preparation only — not a filed patent application, not a USPTO submission, and not legal advice. Consult qualified IP counsel before filing.";

export function buildInventionDisclosure(bundle: InventionBundle): DisclosureDocument {
  const f = bundle.invention.fields;
  const inventors = f.inventors.map((i) => `${i.name}${i.role ? ` (${i.role})` : ""}`).join("; ");

  const sections: DisclosureDocument["sections"] = [
    { heading: "Title", body: f.title, source: "user" },
    { heading: "Inventor(s)", body: inventors || "—", source: "user" },
    { heading: "Category", body: f.category, source: "user" },
    {
      heading: "User-entered conception date",
      body: f.conceptionDate || "Not provided by user",
      source: "user",
    },
    { heading: "Abstract / summary", body: f.description, source: "user" },
    { heading: "Problem being solved", body: f.problemSolved || "—", source: "user" },
    { heading: "How it works", body: f.howItWorks || "—", source: "user" },
    { heading: "Unique features", body: f.uniqueFeatures || "—", source: "user" },
    { heading: "Technical specifications", body: f.technicalSpecs || "—", source: "user" },
    { heading: "Materials", body: f.materials || "—", source: "user" },
    { heading: "Components", body: f.componentsText || "—", source: "user" },
    {
      heading: "Alternative implementations / embodiments",
      body: f.alternativeImplementations || "—",
      source: "user",
    },
    {
      heading: "Prototype status",
      body: f.prototypeStatus,
      source: "user",
    },
    {
      heading: "Development history",
      body: f.developmentHistory || "—",
      source: "user",
    },
    {
      heading: "Collaborators",
      body: f.collaborators.map((c) => `${c.name} — ${c.role}`).join("\n") || "None listed",
      source: "user",
    },
    {
      heading: "Current sealed version",
      body: `v${bundle.invention.currentVersion} · last updated ${bundle.invention.updatedAt}`,
      source: "derived",
    },
  ];

  return {
    protocol: INVENTION_STUDIO_PROTOCOL,
    kind: "invention_disclosure",
    generatedAt: new Date().toISOString(),
    inventionId: bundle.invention.id,
    version: bundle.invention.currentVersion,
    title: f.title,
    sections,
    evidenceIndex: bundle.evidence.map((e) => ({
      id: e.id,
      filename: e.originalFilename,
      sha256: e.sha256,
      uploaded: e.uploadDate,
    })),
    drawingIndex: bundle.components
      .filter((c) => c.calloutNumber)
      .sort((a, b) => (a.calloutNumber || 0) - (b.calloutNumber || 0))
      .map((c) => ({
        number: c.calloutNumber || 0,
        name: c.name,
        material: c.material,
      })),
    disclaimer: DISCLAIMER,
  };
}

export function disclosureToMarkdown(doc: DisclosureDocument): string {
  const lines = [
    `# Invention Disclosure — ${doc.title}`,
    "",
    `Protocol: ${doc.protocol}`,
    `Generated: ${doc.generatedAt}`,
    `Invention ID: ${doc.inventionId}`,
    `Version: ${doc.version}`,
    "",
    `> ${doc.disclaimer}`,
    "",
  ];
  for (const s of doc.sections) {
    lines.push(`## ${s.heading}`, "", s.body || "—", "");
  }
  lines.push("## Evidence index", "");
  if (!doc.evidenceIndex.length) lines.push("None.", "");
  for (const e of doc.evidenceIndex) {
    lines.push(`- \`${e.id}\` · ${e.filename} · SHA-256 \`${e.sha256}\` · ${e.uploaded}`);
  }
  lines.push("", "## Drawing / component index", "");
  if (!doc.drawingIndex.length) lines.push("None.", "");
  for (const d of doc.drawingIndex) {
    lines.push(`- FIG. ${d.number}: ${d.name} (${d.material})`);
  }
  return lines.join("\n");
}

export const USPTO_RESOURCES = [
  {
    title: "USPTO Patent Center",
    href: "https://patentcenter.uspto.gov/",
    note: "Official filing portal (requires account / counsel).",
  },
  {
    title: "Provisional application for patent",
    href: "https://www.uspto.gov/patents/basics/types-patent-applications/provisional-application-patent",
    note: "Learn what a provisional is — Studio does not file it for you.",
  },
  {
    title: "Patent Public Search",
    href: "https://ppubs.uspto.gov/pubwebapp/",
    note: "Search prior art publications.",
  },
  {
    title: "Patent Cooperation Treaty (PCT)",
    href: "https://www.uspto.gov/patents/basics/international-protection/patent-cooperation-treaty",
    note: "International filing options overview.",
  },
] as const;

export const PROVISIONAL_CHECKLIST = [
  { id: "title", label: "Clear invention title" },
  { id: "inventors", label: "All inventors named" },
  { id: "problem", label: "Problem statement written by you" },
  { id: "how", label: "How-it-works description with enough enablement detail" },
  { id: "drawings", label: "Drawings / figures indexed (or 3D callouts)" },
  { id: "embodiments", label: "At least one alternative embodiment noted" },
  { id: "evidence", label: "Supporting evidence hashed in the vault" },
  { id: "version", label: "Timestamped disclosure version sealed" },
  { id: "counsel", label: "Plan to review with IP counsel before any filing" },
  {
    id: "not_filing",
    label: "Understood: this Studio prepares documents — it does not file at USPTO",
  },
] as const;
