import { z } from "zod";

export const INVENTION_STUDIO_PROTOCOL = "ZZAI-Invention-Protection-Studio/1.0" as const;
export const INVENTION_VAULT_KEY = "zzai-invention-protection-vault-v1";
export const INVENTION_EVIDENCE_IDB = "zzai-invention-evidence-v1";

export const INVENTION_CATEGORIES = [
  "mechanical",
  "electrical",
  "software",
  "chemical",
  "biotech",
  "consumer",
  "industrial",
  "design",
  "process",
  "other",
] as const;

export type InventionCategory = (typeof INVENTION_CATEGORIES)[number];

export const PROTOTYPE_STATUSES = [
  "concept",
  "sketch",
  "breadboard",
  "prototype",
  "working_prototype",
  "pre_production",
] as const;

export type PrototypeStatus = (typeof PROTOTYPE_STATUSES)[number];

export const INVENTION_STATUSES = [
  "draft",
  "active",
  "documenting",
  "sealed",
  "archived",
] as const;

export type InventionStatus = (typeof INVENTION_STATUSES)[number];

export type VerificationStatus = "pending" | "hashed" | "verified" | "failed";

export type InventorInfo = {
  name: string;
  email?: string;
  role: "sole_inventor" | "co_inventor" | "assignee" | "agent";
  contribution?: string;
};

export type Collaborator = {
  id: string;
  name: string;
  role: string;
  email?: string;
  addedAt: string;
};

export type InventionFields = {
  title: string;
  description: string;
  category: InventionCategory;
  inventors: InventorInfo[];
  conceptionDate: string;
  problemSolved: string;
  howItWorks: string;
  uniqueFeatures: string;
  technicalSpecs: string;
  materials: string;
  componentsText: string;
  alternativeImplementations: string;
  prototypeStatus: PrototypeStatus;
  developmentHistory: string;
  collaborators: Collaborator[];
};

export type InventionVersion = {
  id: string;
  inventionId: string;
  version: number;
  createdAt: string;
  serverTimestamp?: string;
  label: string;
  fields: InventionFields;
  contentHash: string;
  note?: string;
  source: "user" | "ai_suggestion_applied";
};

export type NotebookEntry = {
  id: string;
  inventionId: string;
  createdAt: string;
  serverTimestamp?: string;
  kind: "note" | "milestone" | "prototype" | "technical" | "attachment_ref";
  title: string;
  body: string;
  attachmentIds: string[];
  contentHash: string;
};

export type EvidenceRecord = {
  id: string;
  inventionId: string;
  originalFilename: string;
  fileType: string;
  byteLength: number;
  uploadDate: string;
  serverTimestamp?: string;
  sha256: string;
  version: number;
  verificationStatus: VerificationStatus;
  /** IndexedDB blob key when stored locally */
  blobKey?: string;
  /** Optional data URL preview for small images */
  previewDataUrl?: string;
  notes?: string;
};

export type StudioComponent = {
  id: string;
  inventionId: string;
  name: string;
  shape: "box" | "cylinder" | "sphere" | "custom";
  dimensions: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  material:
    | "chrome"
    | "aluminum"
    | "stainless_steel"
    | "glass"
    | "plastic"
    | "rubber"
    | "carbon_fiber";
  calloutNumber?: number;
  visible: boolean;
};

export type TimelineEvent = {
  id: string;
  inventionId: string;
  at: string;
  serverTimestamp?: string;
  title: string;
  detail: string;
  kind: "created" | "updated" | "evidence" | "version" | "studio" | "export" | "verify" | "ai";
  hash?: string;
};

export type AuditEvent = {
  id: string;
  inventionId: string;
  at: string;
  serverTimestamp?: string;
  event: string;
  detail?: string;
  prevHash?: string;
  eventHash: string;
};

export type AiSuggestion = {
  id: string;
  inventionId: string;
  createdAt: string;
  kind:
    | "improve_description"
    | "clarifying_questions"
    | "missing_details"
    | "summary"
    | "abstract"
    | "detailed_description"
    | "embodiments"
    | "components"
    | "claim_concepts"
    | "disclosure";
  /** Always labeled as AI-generated — never treated as evidence */
  label: "ai_generated";
  prompt: string;
  content: string;
  accepted: boolean;
};

export type InventionRecord = {
  id: string;
  ownerKey: string;
  createdAt: string;
  updatedAt: string;
  status: InventionStatus;
  currentVersion: number;
  fields: InventionFields;
  documentationProgress: number;
  privacy: "private";
};

export type InventionBundle = {
  invention: InventionRecord;
  versions: InventionVersion[];
  notebook: NotebookEntry[];
  evidence: EvidenceRecord[];
  components: StudioComponent[];
  timeline: TimelineEvent[];
  audit: AuditEvent[];
  aiSuggestions: AiSuggestion[];
};

export type InventionVaultState = {
  protocol: typeof INVENTION_STUDIO_PROTOCOL;
  updatedAt: string;
  bundles: InventionBundle[];
};

export const createInventionInputSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(8000),
  category: z.enum(INVENTION_CATEGORIES),
  inventorName: z.string().min(2).max(120),
  inventorEmail: z.string().email().optional().or(z.literal("")),
  conceptionDate: z.string().optional(),
  problemSolved: z.string().optional(),
  howItWorks: z.string().optional(),
  uniqueFeatures: z.string().optional(),
  technicalSpecs: z.string().optional(),
  materials: z.string().optional(),
  componentsText: z.string().optional(),
  alternativeImplementations: z.string().optional(),
  prototypeStatus: z.enum(PROTOTYPE_STATUSES).default("concept"),
  developmentHistory: z.string().optional(),
});

export type CreateInventionInput = z.infer<typeof createInventionInputSchema>;

export type DashboardStats = {
  totalInventions: number;
  activeProjects: number;
  savedEvidence: number;
  avgDocumentationProgress: number;
  recentActivity: TimelineEvent[];
};

export type EvidenceCertificate = {
  protocol: typeof INVENTION_STUDIO_PROTOCOL;
  evidenceId: string;
  inventionId: string;
  inventionTitle: string;
  originalFilename: string;
  sha256: string;
  issuedAt: string;
  verificationPath: string;
  disclaimer: string;
  qrPayload: string;
};
