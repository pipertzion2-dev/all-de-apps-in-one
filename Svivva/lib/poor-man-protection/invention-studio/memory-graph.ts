import type {
  InventionBundle,
  MemoryGraphEdge,
  MemoryGraphNode,
  MemoryGraphSnapshot,
  VoiceJournalDraft,
} from "./types";

function nid(kind: string): string {
  return `mg_${kind}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

/** Build a connected development graph from existing invention records — never mutates history. */
export function buildMemoryGraph(bundle: InventionBundle): MemoryGraphSnapshot {
  const nodes: MemoryGraphNode[] = [];
  const edges: MemoryGraphEdge[] = [];
  const inventionId = bundle.invention.id;

  const rootId = nid("disclosure");
  nodes.push({
    id: rootId,
    inventionId,
    kind: "disclosure",
    label: bundle.invention.fields.title,
    detail: bundle.invention.fields.description.slice(0, 240),
    at: bundle.invention.createdAt,
    version: bundle.invention.currentVersion,
  });

  for (const v of bundle.versions) {
    const id = nid("ver");
    nodes.push({
      id,
      inventionId,
      kind: "description",
      label: `v${v.version} · ${v.label}`,
      detail: v.contentHash.slice(0, 16),
      at: v.createdAt,
      refId: v.id,
      version: v.version,
    });
    edges.push({
      id: nid("e"),
      from: rootId,
      to: id,
      relation: v.version === 1 ? "derived_from" : "revises",
    });
  }

  for (const e of bundle.evidence) {
    const id = nid("ev");
    const isSketch = e.fileType.startsWith("image/");
    nodes.push({
      id,
      inventionId,
      kind: isSketch ? "sketch" : "evidence",
      label: e.originalFilename,
      detail: `SHA-256 ${e.sha256.slice(0, 12)}…`,
      at: e.uploadDate,
      refId: e.id,
      version: e.version,
    });
    edges.push({ id: nid("e"), from: rootId, to: id, relation: "supports" });
  }

  for (const c of bundle.components) {
    const id = nid("cmp");
    nodes.push({
      id,
      inventionId,
      kind: "component",
      label: c.name,
      detail: `${c.material} · ${c.shape}`,
      at: bundle.invention.updatedAt,
      refId: c.id,
    });
    edges.push({ id: nid("e"), from: rootId, to: id, relation: "derived_from" });
  }

  for (const n of bundle.notebook) {
    const id = nid("nb");
    nodes.push({
      id,
      inventionId,
      kind: n.kind === "prototype" ? "prototype" : n.kind === "technical" ? "note" : "note",
      label: n.title,
      detail: n.body.slice(0, 160),
      at: n.createdAt,
      refId: n.id,
    });
    edges.push({ id: nid("e"), from: rootId, to: id, relation: "mentions" });
  }

  for (const collab of bundle.invention.fields.collaborators) {
    const id = nid("col");
    nodes.push({
      id,
      inventionId,
      kind: "collaborator",
      label: collab.name,
      detail: collab.role,
      at: collab.addedAt,
      refId: collab.id,
    });
    edges.push({ id: nid("e"), from: id, to: rootId, relation: "contributed" });
  }

  for (const r of bundle.priorArtReports || []) {
    const id = nid("par");
    nodes.push({
      id,
      inventionId,
      kind: "prior_art",
      label: "Prior-Art Radar report",
      detail: `${r.hits.length} hits · ${r.generatedQueries[0] || ""}`,
      at: r.createdAt,
      refId: r.id,
    });
    edges.push({ id: nid("e"), from: rootId, to: id, relation: "analyzed" });
  }

  for (const r of bundle.readinessAudits || []) {
    const id = nid("rdy");
    nodes.push({
      id,
      inventionId,
      kind: "readiness",
      label: `Readiness ${r.completenessScore}%`,
      detail: `${r.issues.filter((i) => !i.resolved).length} open issues`,
      at: r.createdAt,
      refId: r.id,
    });
    edges.push({ id: nid("e"), from: rootId, to: id, relation: "analyzed" });
  }

  for (const m of bundle.modelRevisions || []) {
    const id = nid("m3d");
    nodes.push({
      id,
      inventionId,
      kind: "model3d",
      label: m.label,
      detail: m.preliminaryAiVisualization
        ? "Preliminary AI visualization (unvalidated)"
        : "User-validated model revision",
      at: m.createdAt,
      refId: m.id,
      version: m.componentCount,
    });
    edges.push({ id: nid("e"), from: rootId, to: id, relation: "derived_from" });
  }

  for (const v of bundle.voiceDrafts || []) {
    if (!v.confirmed) continue;
    const id = nid("voice");
    nodes.push({
      id,
      inventionId,
      kind: "voice",
      label: v.structuredTitle,
      detail: v.structuredBody.slice(0, 160),
      at: v.createdAt,
      refId: v.id,
    });
    edges.push({ id: nid("e"), from: rootId, to: id, relation: "mentions" });
  }

  return {
    id: nid("snap"),
    inventionId,
    createdAt: new Date().toISOString(),
    nodes,
    edges,
  };
}

export function structureVoiceJournal(
  inventionId: string,
  transcript: string,
  source: VoiceJournalDraft["source"],
): VoiceJournalDraft {
  const clean = transcript.trim();
  const lines = clean.split(/[\n.]+/).map((s) => s.trim()).filter(Boolean);
  const title =
    lines[0]?.slice(0, 80) ||
    `Voice journal ${new Date().toLocaleDateString()}`;
  const body = clean;
  const hints: string[] = [];
  for (const word of ["clamp", "rail", "spring", "motor", "sensor", "housing", "hinge", "gear"]) {
    if (new RegExp(`\\b${word}\\b`, "i").test(clean)) hints.push(word);
  }
  let suggestedMilestone: string | undefined;
  if (/prototype|breadboard|test/i.test(clean)) suggestedMilestone = "Prototype update";
  else if (/sketch|draw/i.test(clean)) suggestedMilestone = "Sketch iteration";
  else if (/material|dimension|spec/i.test(clean)) suggestedMilestone = "Specification update";

  return {
    id: `vj_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    inventionId,
    createdAt: new Date().toISOString(),
    transcript: clean,
    structuredTitle: title,
    structuredBody: body,
    suggestedMilestone,
    relatedComponentHints: hints,
    confirmed: false,
    source,
    label: "ai_structured_pending_confirmation",
  };
}

export function summarizeDevelopmentHistory(bundle: InventionBundle): string {
  const parts = [
    `Invention “${bundle.invention.fields.title}” — v${bundle.invention.currentVersion}, status ${bundle.invention.status}.`,
    `${bundle.versions.length} sealed version(s), ${bundle.evidence.length} evidence file(s), ${bundle.notebook.length} notebook entr${bundle.notebook.length === 1 ? "y" : "ies"}.`,
    bundle.timeline[0]
      ? `Latest activity: ${bundle.timeline[0].title} (${bundle.timeline[0].at}).`
      : "No timeline events yet.",
  ];
  return parts.join(" ");
}
