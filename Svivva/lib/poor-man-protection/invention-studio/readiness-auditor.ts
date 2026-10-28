import type { InventionBundle, ReadinessAudit, ReadinessIssue } from "./types";

const DISCLAIMER =
  "Completeness scores and checklists help organize documentation. They do not establish patentability, novelty, enablement, or legal sufficiency. Review with qualified IP counsel.";

function uid(): string {
  return `iss_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function thin(s: string, min = 24): boolean {
  return s.trim().length < min;
}

/** Deterministic auditor — always available offline. */
export function runReadinessAuditLocal(bundle: InventionBundle): ReadinessAudit {
  const f = bundle.invention.fields;
  const issues: ReadinessIssue[] = [];

  const push = (
    partial: Omit<ReadinessIssue, "id" | "resolved"> & { resolved?: boolean },
  ) => {
    issues.push({ id: uid(), resolved: false, ...partial });
  };

  if (thin(f.description, 40)) {
    push({
      severity: "critical",
      category: "description",
      title: "Technical description is thin",
      detail: "The disclosure description is short; enablement usually needs more operational detail.",
      followUpQuestion: "Can you describe the preferred embodiment step-by-step in your own words?",
      suggestedAction: "Expand the description with user-written technical detail.",
    });
  }
  if (thin(f.howItWorks, 30)) {
    push({
      severity: "critical",
      category: "functionality",
      title: "Operating mechanism incomplete",
      detail: "How-it-works is missing or brief.",
      followUpQuestion:
        f.category === "mechanical"
          ? "How does the locking/engagement mechanism engage, and what prevents accidental release?"
          : "What is the sequence of operation from start to finish?",
      suggestedAction: "Document the operating mechanism in the notebook or fields.",
    });
  }
  if (thin(f.componentsText, 10)) {
    push({
      severity: "important",
      category: "components",
      title: "Component inventory missing",
      detail: "No component list is recorded.",
      followUpQuestion: "How does each component connect to the others?",
      suggestedAction: "List essential vs optional components.",
    });
  }
  if (thin(f.materials, 4)) {
    push({
      severity: "important",
      category: "materials",
      title: "Materials not specified",
      detail: "Materials field is empty.",
      followUpQuestion: "What materials are used for each major component, and why?",
      suggestedAction: "Add materials you actually use or intend to use — do not invent specs.",
    });
  }
  if (thin(f.technicalSpecs, 10)) {
    push({
      severity: "important",
      category: "dimensions",
      title: "Dimensions / specs missing",
      detail: "Technical specifications are empty.",
      followUpQuestion: "What dimensions, tolerances, voltages, or ranges matter for the preferred embodiment?",
      suggestedAction: "Add measured or intended specs only.",
    });
  }
  if (thin(f.alternativeImplementations, 10)) {
    push({
      severity: "suggested",
      category: "embodiments",
      title: "No alternative embodiments",
      detail: "Alternative constructions are not described.",
      followUpQuestion: "Are there alternative mechanisms or layouts that still solve the same problem?",
      suggestedAction: "Note at least one alternative you actually considered.",
    });
  }
  if (thin(f.developmentHistory, 10)) {
    push({
      severity: "suggested",
      category: "history",
      title: "Development history empty",
      detail: "No chronology of prototypes or iterations.",
      followUpQuestion: "How does the invention operate under different conditions you have tried?",
      suggestedAction: "Add dated development notes (user-entered dates only).",
    });
  }
  if (bundle.components.length === 0 && bundle.evidence.every((e) => !e.fileType.startsWith("image/"))) {
    push({
      severity: "important",
      category: "drawings",
      title: "Missing drawings / 3D callouts",
      detail: "No 3D components and no image evidence yet.",
      followUpQuestion: "Do you have a sketch, photo, or CAD screenshot to hash into the vault?",
      suggestedAction: "Upload a drawing or build a preliminary 3D model in Copilot.",
    });
  }
  if (bundle.evidence.length === 0) {
    push({
      severity: "critical",
      category: "evidence",
      title: "No supporting evidence",
      detail: "Evidence vault is empty for this invention.",
      suggestedAction: "Upload sketches, photos, or CAD files to ProofChain.",
    });
  }

  // Contradiction heuristics (simple)
  if (/plastic/i.test(f.materials) && /all[- ]metal|entirely metal/i.test(f.description + f.howItWorks)) {
    push({
      severity: "important",
      category: "contradiction",
      title: "Possible materials contradiction",
      detail: "Materials mention plastic while description suggests an all-metal construction.",
      followUpQuestion: "Which parts are metal vs plastic in the preferred embodiment?",
      suggestedAction: "Clarify materials per component.",
    });
  }

  const critical = issues.filter((i) => i.severity === "critical").length;
  const important = issues.filter((i) => i.severity === "important").length;
  const suggested = issues.filter((i) => i.severity === "suggested").length;
  const penalty = critical * 18 + important * 10 + suggested * 4;
  const completenessScore = Math.max(5, Math.min(100, 100 - penalty));

  const checklist = [
    { id: "desc", label: "Clear technical description (≥40 chars)", done: !thin(f.description, 40) },
    { id: "how", label: "Operating mechanism documented", done: !thin(f.howItWorks, 30) },
    { id: "comp", label: "Component inventory", done: !thin(f.componentsText, 10) },
    { id: "mat", label: "Materials listed", done: !thin(f.materials, 4) },
    { id: "spec", label: "Technical specs / dimensions", done: !thin(f.technicalSpecs, 10) },
    { id: "alt", label: "Alternative embodiment noted", done: !thin(f.alternativeImplementations, 10) },
    { id: "draw", label: "Drawing or 3D callout present", done: bundle.components.length > 0 || bundle.evidence.some((e) => e.fileType.startsWith("image/")) },
    { id: "ev", label: "At least one evidence file hashed", done: bundle.evidence.length > 0 },
    { id: "ver", label: "At least one sealed version", done: bundle.versions.length >= 1 },
  ];

  return {
    id: `aud_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    inventionId: bundle.invention.id,
    createdAt: new Date().toISOString(),
    completenessScore,
    issues,
    checklist,
    disclaimer: DISCLAIMER,
  };
}

export function buildReadinessPrompt(bundle: InventionBundle): string {
  return `Analyze this USER-PROVIDED invention disclosure for documentation gaps only.
Never invent specs, test results, or dates.
Never claim patentability.
Return JSON with keys: issues (array of {severity, category, title, detail, followUpQuestion, suggestedAction}).

USER RECORD:
${JSON.stringify(bundle.invention.fields, null, 2)}
Evidence count: ${bundle.evidence.length}
3D components: ${bundle.components.length}
`;
}
