import { chainEventHash, sha256File, sha256Text } from "./hashing";
import { computeDocumentationProgress } from "./progress";
import type {
  AiSuggestion,
  CreateInventionInput,
  DashboardStats,
  EvidenceRecord,
  InventionBundle,
  InventionFields,
  InventionRecord,
  InventionStatus,
  InventionVaultState,
  NotebookEntry,
  StudioComponent,
  TimelineEvent,
} from "./types";
import {
  INVENTION_EVIDENCE_IDB,
  INVENTION_STUDIO_PROTOCOL,
  INVENTION_VAULT_KEY,
} from "./types";

function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyFields(input: CreateInventionInput): InventionFields {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    inventors: [
      {
        name: input.inventorName.trim(),
        email: input.inventorEmail?.trim() || undefined,
        role: "sole_inventor",
      },
    ],
    conceptionDate: input.conceptionDate || "",
    problemSolved: input.problemSolved || "",
    howItWorks: input.howItWorks || "",
    uniqueFeatures: input.uniqueFeatures || "",
    technicalSpecs: input.technicalSpecs || "",
    materials: input.materials || "",
    componentsText: input.componentsText || "",
    alternativeImplementations: input.alternativeImplementations || "",
    prototypeStatus: input.prototypeStatus || "concept",
    developmentHistory: input.developmentHistory || "",
    collaborators: [],
  };
}

function readVault(): InventionVaultState {
  if (typeof window === "undefined") {
    return { protocol: INVENTION_STUDIO_PROTOCOL, updatedAt: nowIso(), bundles: [] };
  }
  try {
    const raw = localStorage.getItem(INVENTION_VAULT_KEY);
    if (!raw) {
      return { protocol: INVENTION_STUDIO_PROTOCOL, updatedAt: nowIso(), bundles: [] };
    }
    const parsed = JSON.parse(raw) as InventionVaultState;
    if (!parsed?.bundles) {
      return { protocol: INVENTION_STUDIO_PROTOCOL, updatedAt: nowIso(), bundles: [] };
    }
    return parsed;
  } catch {
    return { protocol: INVENTION_STUDIO_PROTOCOL, updatedAt: nowIso(), bundles: [] };
  }
}

function writeVault(state: InventionVaultState): void {
  if (typeof window === "undefined") return;
  const next = { ...state, updatedAt: nowIso(), protocol: INVENTION_STUDIO_PROTOCOL };
  localStorage.setItem(INVENTION_VAULT_KEY, JSON.stringify(next));
}

function openEvidenceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(INVENTION_EVIDENCE_IDB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("blobs")) {
        db.createObjectStore("blobs");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
  });
}

export async function putEvidenceBlob(key: string, blob: Blob): Promise<void> {
  const db = await openEvidenceDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getEvidenceBlob(key: string): Promise<Blob | null> {
  const db = await openEvidenceDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction("blobs", "readonly");
    const req = tx.objectStore("blobs").get(key);
    req.onsuccess = () => resolve((req.result as Blob) || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

async function appendAudit(
  bundle: InventionBundle,
  event: string,
  detail?: string,
): Promise<InventionBundle> {
  const prev = bundle.audit[bundle.audit.length - 1];
  const at = nowIso();
  const eventHash = await chainEventHash(prev?.eventHash, { event, detail, at });
  const entry = {
    id: uid("aud"),
    inventionId: bundle.invention.id,
    at,
    event,
    detail,
    prevHash: prev?.eventHash,
    eventHash,
  };
  return { ...bundle, audit: [...bundle.audit, entry] };
}

function appendTimeline(
  bundle: InventionBundle,
  partial: Omit<TimelineEvent, "id" | "inventionId" | "at"> & { at?: string },
): InventionBundle {
  const event: TimelineEvent = {
    id: uid("tl"),
    inventionId: bundle.invention.id,
    at: partial.at || nowIso(),
    title: partial.title,
    detail: partial.detail,
    kind: partial.kind,
    hash: partial.hash,
  };
  return { ...bundle, timeline: [event, ...bundle.timeline].slice(0, 200) };
}

function upsertBundle(bundle: InventionBundle): InventionBundle {
  const state = readVault();
  const idx = state.bundles.findIndex((b) => b.invention.id === bundle.invention.id);
  const bundles = [...state.bundles];
  const next = {
    ...bundle,
    invention: {
      ...bundle.invention,
      updatedAt: nowIso(),
      documentationProgress: computeDocumentationProgress(bundle.invention.fields),
    },
  };
  if (idx >= 0) bundles[idx] = next;
  else bundles.unshift(next);
  writeVault({ ...state, bundles });
  return next;
}

export function listInventionBundles(): InventionBundle[] {
  return readVault().bundles;
}

export function getInventionBundle(id: string): InventionBundle | null {
  return readVault().bundles.find((b) => b.invention.id === id) || null;
}

export function getDashboardStats(): DashboardStats {
  const bundles = listInventionBundles();
  const evidenceCount = bundles.reduce((n, b) => n + b.evidence.length, 0);
  const active = bundles.filter((b) =>
    ["draft", "active", "documenting", "sealed"].includes(b.invention.status),
  ).length;
  const avg =
    bundles.length === 0
      ? 0
      : Math.round(
          bundles.reduce((s, b) => s + b.invention.documentationProgress, 0) / bundles.length,
        );
  const recentActivity = bundles
    .flatMap((b) => b.timeline)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);
  return {
    totalInventions: bundles.length,
    activeProjects: active,
    savedEvidence: evidenceCount,
    avgDocumentationProgress: avg,
    recentActivity,
  };
}

export async function createInvention(
  input: CreateInventionInput,
  ownerKey = "local",
): Promise<InventionBundle> {
  const fields = emptyFields(input);
  const id = uid("inv");
  const at = nowIso();
  const contentHash = await sha256Text(JSON.stringify(fields));
  let bundle: InventionBundle = {
    invention: {
      id,
      ownerKey,
      createdAt: at,
      updatedAt: at,
      status: "draft",
      currentVersion: 1,
      fields,
      documentationProgress: computeDocumentationProgress(fields),
      privacy: "private",
    },
    versions: [
      {
        id: uid("ver"),
        inventionId: id,
        version: 1,
        createdAt: at,
        label: "Initial disclosure draft",
        fields,
        contentHash,
        source: "user",
      },
    ],
    notebook: [],
    evidence: [],
    components: [],
    timeline: [],
    audit: [],
    aiSuggestions: [],
  };
  bundle = appendTimeline(bundle, {
    title: "Invention created",
    detail: fields.title,
    kind: "created",
    hash: contentHash,
  });
  bundle = await appendAudit(bundle, "invention_created", fields.title);
  return upsertBundle(bundle);
}

export async function updateInventionFields(
  inventionId: string,
  patch: Partial<InventionFields>,
  opts?: { sealVersion?: boolean; label?: string },
): Promise<InventionBundle | null> {
  const existing = getInventionBundle(inventionId);
  if (!existing) return null;
  const fields = { ...existing.invention.fields, ...patch };
  let bundle: InventionBundle = {
    ...existing,
    invention: {
      ...existing.invention,
      fields,
      status:
        existing.invention.status === "draft"
          ? "documenting"
          : existing.invention.status,
    },
  };
  bundle = appendTimeline(bundle, {
    title: "Fields updated",
    detail: Object.keys(patch).join(", "),
    kind: "updated",
  });
  bundle = await appendAudit(bundle, "fields_updated", Object.keys(patch).join(","));

  if (opts?.sealVersion) {
    const contentHash = await sha256Text(JSON.stringify(fields));
    const version = existing.invention.currentVersion + 1;
    bundle = {
      ...bundle,
      invention: { ...bundle.invention, currentVersion: version, fields },
      versions: [
        {
          id: uid("ver"),
          inventionId,
          version,
          createdAt: nowIso(),
          label: opts.label || `Version ${version}`,
          fields,
          contentHash,
          source: "user",
        },
        ...bundle.versions,
      ],
    };
    bundle = appendTimeline(bundle, {
      title: `Version ${version} sealed`,
      detail: opts.label || "Timestamped disclosure snapshot",
      kind: "version",
      hash: contentHash,
    });
    bundle = await appendAudit(bundle, "version_sealed", `v${version}:${contentHash}`);
  }

  return upsertBundle(bundle);
}

export async function setInventionStatus(
  inventionId: string,
  status: InventionStatus,
): Promise<InventionBundle | null> {
  const existing = getInventionBundle(inventionId);
  if (!existing) return null;
  let bundle = {
    ...existing,
    invention: { ...existing.invention, status },
  };
  bundle = appendTimeline(bundle, {
    title: `Status → ${status}`,
    detail: status,
    kind: "updated",
  });
  bundle = await appendAudit(bundle, "status_changed", status);
  return upsertBundle(bundle);
}

export async function addNotebookEntry(
  inventionId: string,
  input: {
    kind: NotebookEntry["kind"];
    title: string;
    body: string;
    attachmentIds?: string[];
  },
): Promise<InventionBundle | null> {
  const existing = getInventionBundle(inventionId);
  if (!existing) return null;
  const at = nowIso();
  const contentHash = await sha256Text(
    JSON.stringify({ title: input.title, body: input.body, at }),
  );
  const entry: NotebookEntry = {
    id: uid("nb"),
    inventionId,
    createdAt: at,
    kind: input.kind,
    title: input.title.trim(),
    body: input.body.trim(),
    attachmentIds: input.attachmentIds || [],
    contentHash,
  };
  let bundle: InventionBundle = {
    ...existing,
    notebook: [entry, ...existing.notebook],
  };
  bundle = appendTimeline(bundle, {
    title: "Notebook entry",
    detail: entry.title,
    kind: "updated",
    hash: contentHash,
  });
  bundle = await appendAudit(bundle, "notebook_entry", entry.id);
  return upsertBundle(bundle);
}

async function maybePreview(file: File): Promise<string | undefined> {
  if (!file.type.startsWith("image/") || file.size > 1_500_000) return undefined;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

export async function addEvidence(
  inventionId: string,
  file: File,
  notes?: string,
): Promise<{ bundle: InventionBundle; evidence: EvidenceRecord } | null> {
  const existing = getInventionBundle(inventionId);
  if (!existing) return null;
  const sha256 = await sha256File(file);
  const blobKey = `${inventionId}/${uid("blob")}`;
  await putEvidenceBlob(blobKey, file);
  const version =
    existing.evidence.filter((e) => e.originalFilename === file.name).length + 1;
  const evidence: EvidenceRecord = {
    id: uid("ev"),
    inventionId,
    originalFilename: file.name,
    fileType: file.type || "application/octet-stream",
    byteLength: file.size,
    uploadDate: nowIso(),
    sha256,
    version,
    verificationStatus: "hashed",
    blobKey,
    previewDataUrl: await maybePreview(file),
    notes,
  };
  let bundle: InventionBundle = {
    ...existing,
    evidence: [evidence, ...existing.evidence],
    invention: {
      ...existing.invention,
      status: existing.invention.status === "draft" ? "active" : existing.invention.status,
    },
  };
  bundle = appendTimeline(bundle, {
    title: "Evidence uploaded",
    detail: `${file.name} · ${sha256.slice(0, 12)}…`,
    kind: "evidence",
    hash: sha256,
  });
  bundle = await appendAudit(bundle, "evidence_uploaded", evidence.id);
  return { bundle: upsertBundle(bundle), evidence };
}

export async function verifyEvidenceIntegrity(
  inventionId: string,
  evidenceId: string,
): Promise<{ ok: boolean; message: string; bundle: InventionBundle | null }> {
  const existing = getInventionBundle(inventionId);
  if (!existing) return { ok: false, message: "Invention not found", bundle: null };
  const evidence = existing.evidence.find((e) => e.id === evidenceId);
  if (!evidence?.blobKey) {
    return { ok: false, message: "Evidence blob missing", bundle: existing };
  }
  const blob = await getEvidenceBlob(evidence.blobKey);
  if (!blob) return { ok: false, message: "Blob not in vault", bundle: existing };
  const hash = await sha256File(blob);
  const ok = hash === evidence.sha256;
  const nextEvidence = existing.evidence.map((e) =>
    e.id === evidenceId
      ? { ...e, verificationStatus: (ok ? "verified" : "failed") as EvidenceRecord["verificationStatus"] }
      : e,
  );
  let bundle: InventionBundle = { ...existing, evidence: nextEvidence };
  bundle = appendTimeline(bundle, {
    title: ok ? "Evidence verified" : "Evidence integrity failed",
    detail: evidence.originalFilename,
    kind: "verify",
    hash,
  });
  bundle = await appendAudit(
    bundle,
    ok ? "evidence_verified" : "evidence_verify_failed",
    evidenceId,
  );
  return {
    ok,
    message: ok ? "SHA-256 matches stored hash." : "Hash mismatch — file may be altered.",
    bundle: upsertBundle(bundle),
  };
}

export function saveStudioComponents(
  inventionId: string,
  components: StudioComponent[],
): InventionBundle | null {
  const existing = getInventionBundle(inventionId);
  if (!existing) return null;
  let bundle: InventionBundle = { ...existing, components };
  bundle = appendTimeline(bundle, {
    title: "3D studio updated",
    detail: `${components.length} component(s)`,
    kind: "studio",
  });
  return upsertBundle(bundle);
}

export async function addAiSuggestion(
  inventionId: string,
  suggestion: Omit<AiSuggestion, "id" | "inventionId" | "createdAt" | "label" | "accepted">,
): Promise<InventionBundle | null> {
  const existing = getInventionBundle(inventionId);
  if (!existing) return null;
  const entry: AiSuggestion = {
    id: uid("ai"),
    inventionId,
    createdAt: nowIso(),
    label: "ai_generated",
    accepted: false,
    ...suggestion,
  };
  let bundle: InventionBundle = {
    ...existing,
    aiSuggestions: [entry, ...existing.aiSuggestions],
  };
  bundle = appendTimeline(bundle, {
    title: "AI suggestion generated",
    detail: suggestion.kind,
    kind: "ai",
  });
  bundle = await appendAudit(bundle, "ai_suggestion", entry.id);
  return upsertBundle(bundle);
}

export function deleteInvention(inventionId: string): void {
  const state = readVault();
  writeVault({
    ...state,
    bundles: state.bundles.filter((b) => b.invention.id !== inventionId),
  });
}

export function exportVaultJson(): string {
  return JSON.stringify(readVault(), null, 2);
}

export function listInventions(): InventionRecord[] {
  return listInventionBundles().map((b) => b.invention);
}
