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

export const INVENTION_STATUSES = ["draft", "active", "documenting", "sealed", "archived"] as const;

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
  kind:
    | "created"
    | "updated"
    | "evidence"
    | "version"
    | "studio"
    | "export"
    | "verify"
    | "ai"
    | "prior_art"
    | "readiness"
    | "proofchain"
    | "memory"
    | "voice";
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

export type PriorArtHit = {
  id: string;
  source: "uspto_patentsview" | "google_patents_link" | "wipo_link" | "user_saved";
  publicationNumber?: string;
  title: string;
  abstract?: string;
  filingDate?: string;
  publicationDate?: string;
  similarityNotes: string;
  differencesNotes: string;
  sourceUrl: string;
  queriedAt: string;
  /** True only when returned by a live search API — never fabricated */
  fromLiveApi: boolean;
};

export type PriorArtReport = {
  id: string;
  inventionId: string;
  createdAt: string;
  serverTimestamp?: string;
  queryText: string;
  generatedQueries: string[];
  imageConcepts?: string[];
  hits: PriorArtHit[];
  reportMarkdown: string;
  disclaimer: string;
};

export type ReadinessIssue = {
  id: string;
  severity: "critical" | "important" | "suggested";
  category:
    | "description"
    | "components"
    | "materials"
    | "dimensions"
    | "functionality"
    | "mechanism"
    | "embodiments"
    | "drawings"
    | "evidence"
    | "history"
    | "contradiction"
    | "ai_assumption";
  title: string;
  detail: string;
  followUpQuestion?: string;
  suggestedAction: string;
  resolved: boolean;
};

export type ReadinessAudit = {
  id: string;
  inventionId: string;
  createdAt: string;
  serverTimestamp?: string;
  completenessScore: number;
  issues: ReadinessIssue[];
  checklist: Array<{ id: string; label: string; done: boolean }>;
  disclaimer: string;
};

export type ProofChainRecord = {
  id: string;
  evidenceId: string;
  inventionId: string;
  version: number;
  sha256: string;
  localTimestamp: string;
  serverTimestamp?: string;
  verificationMethod: "sha256" | "server_timestamp" | "audit_chain" | "manifest";
  integrityStatus: "pending" | "hashed" | "verified" | "failed";
  /** Only set when a real TSA response is received */
  trustedTimestampStatus: "not_configured" | "requested" | "anchored" | "failed";
  trustedTimestampToken?: string;
  /** Only set when a real on-chain tx exists */
  blockchainStatus: "not_configured" | "requested" | "anchored" | "failed";
  blockchainTxId?: string;
  publicCertId?: string;
  manifestHash: string;
};

export type PublicProofCertificate = {
  protocol: typeof INVENTION_STUDIO_PROTOCOL;
  publicCertId: string;
  evidenceId: string;
  inventionId: string;
  /** Title only if user authorized public disclosure of title */
  inventionTitleAuthorized: boolean;
  inventionTitle?: string;
  originalFilename: string;
  sha256: string;
  version: number;
  issuedAt: string;
  serverTimestamp?: string;
  verificationPath: string;
  qrPayload: string;
  disclaimer: string;
  methodsClaimed: string[];
};

export type MemoryGraphNode = {
  id: string;
  inventionId: string;
  kind:
    | "disclosure"
    | "sketch"
    | "description"
    | "model3d"
    | "component"
    | "prototype"
    | "test"
    | "note"
    | "document"
    | "collaborator"
    | "evidence"
    | "prior_art"
    | "readiness"
    | "voice";
  label: string;
  detail: string;
  at: string;
  refId?: string;
  version?: number;
};

export type MemoryGraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: "derived_from" | "revises" | "supports" | "mentions" | "contributed" | "analyzed";
};

export type MemoryGraphSnapshot = {
  id: string;
  inventionId: string;
  createdAt: string;
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
};

export type VoiceJournalDraft = {
  id: string;
  inventionId: string;
  createdAt: string;
  transcript: string;
  structuredTitle: string;
  structuredBody: string;
  suggestedMilestone?: string;
  relatedComponentHints: string[];
  confirmed: boolean;
  source: "web_speech" | "whisper_api" | "typed_fallback";
  label: "ai_structured_pending_confirmation";
};

export type ModelRevisionMeta = {
  id: string;
  inventionId: string;
  createdAt: string;
  label: string;
  componentCount: number;
  /** AI-generated geometry is preliminary until user validates dimensions */
  preliminaryAiVisualization: boolean;
  validatedByUser: boolean;
  evidenceId?: string;
  contentHash: string;
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
  priorArtReports?: PriorArtReport[];
  readinessAudits?: ReadinessAudit[];
  proofChain?: ProofChainRecord[];
  publicCerts?: PublicProofCertificate[];
  memorySnapshots?: MemoryGraphSnapshot[];
  voiceDrafts?: VoiceJournalDraft[];
  modelRevisions?: ModelRevisionMeta[];
  aiTrainingConsent?: boolean;
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
