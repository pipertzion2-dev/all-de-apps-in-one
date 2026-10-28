import type { InventionFields } from "./types";

export type AiAssistKind =
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

const SYSTEM = `You are the ZZAI Invention Protection Studio assistant inside Poor Man Protection (Cube Protect).
Rules:
- Separate USER-PROVIDED facts from AI suggestions. Never present AI text as evidence.
- NEVER fabricate evidence, dates, test results, measurements, materials, or technical specs the user did not provide.
- If information is missing, ask clarifying questions or mark gaps as [MISSING — user must provide].
- Do not claim this is a filed patent or USPTO submission.
- Prefer precise, technical language suitable for an invention disclosure draft.
- When suggesting preliminary claim concepts, label them clearly as NON-LEGAL draft concepts for counsel review.`;

function fieldsBlock(fields: InventionFields): string {
  return JSON.stringify(
    {
      title: fields.title,
      description: fields.description,
      category: fields.category,
      inventors: fields.inventors.map((i) => i.name),
      conceptionDate: fields.conceptionDate || null,
      problemSolved: fields.problemSolved || null,
      howItWorks: fields.howItWorks || null,
      uniqueFeatures: fields.uniqueFeatures || null,
      technicalSpecs: fields.technicalSpecs || null,
      materials: fields.materials || null,
      componentsText: fields.componentsText || null,
      alternativeImplementations: fields.alternativeImplementations || null,
      prototypeStatus: fields.prototypeStatus,
      developmentHistory: fields.developmentHistory || null,
    },
    null,
    2,
  );
}

export function buildAiMessages(
  kind: AiAssistKind,
  fields: InventionFields,
  userNote?: string,
): { system: string; user: string } {
  const base = `USER-PROVIDED INVENTION RECORD (treat as the only factual source):\n${fieldsBlock(fields)}\n\nUser note: ${userNote || "(none)"}`;

  const tasks: Record<AiAssistKind, string> = {
    improve_description:
      "Improve clarity of the user description without inventing new facts. Mark any speculative phrasing.",
    clarifying_questions:
      "Ask up to 8 clarifying questions that would strengthen enablement. Do not invent answers.",
    missing_details:
      "List missing details that a disclosure typically needs, based only on gaps in the record.",
    summary: "Write a short invention summary using only provided facts. Flag gaps.",
    abstract: "Draft a technical abstract from provided facts only. No fabricated performance claims.",
    detailed_description:
      "Draft a detailed description outline/sections using provided facts; use [MISSING] for gaps.",
    embodiments:
      "Suggest alternative embodiments as ideas for the user to confirm — clearly labeled AI suggestions.",
    components: "Organize components into a structured inventory from provided text only.",
    claim_concepts:
      "Propose preliminary claim concepts for counsel review. Label as non-legal AI drafts. Do not invent elements not in the record.",
    disclosure:
      "Assemble a structured invention disclosure draft from provided facts; separate an 'AI notes' section for suggestions.",
  };

  return {
    system: SYSTEM,
    user: `${base}\n\nTASK: ${tasks[kind]}\n\nRespond in Markdown. Start with a line: **Source: AI-generated suggestion (not evidence)**.`,
  };
}

/** Deterministic offline fallback when no LLM is configured. */
export function localAiFallback(kind: AiAssistKind, fields: InventionFields): string {
  const gaps: string[] = [];
  if (!fields.problemSolved.trim()) gaps.push("Problem being solved");
  if (!fields.howItWorks.trim()) gaps.push("How it works");
  if (!fields.uniqueFeatures.trim()) gaps.push("Unique features");
  if (!fields.technicalSpecs.trim()) gaps.push("Technical specifications");
  if (!fields.materials.trim()) gaps.push("Materials");
  if (!fields.alternativeImplementations.trim()) gaps.push("Alternative implementations");
  if (!fields.conceptionDate.trim()) gaps.push("User-entered conception date");

  const header = "**Source: AI-generated suggestion (not evidence)**\n\n";

  switch (kind) {
    case "clarifying_questions":
      return (
        header +
        [
          "1. What is the primary technical problem this solves that existing approaches do not?",
          "2. Which components are essential vs optional?",
          "3. What materials or processes are required for the preferred embodiment?",
          "4. Have you built a prototype, and what did testing show? (Do not invent results — only record what you observed.)",
          "5. What alternative constructions would still achieve the same result?",
          "6. Who contributed inventively, and what did each person contribute?",
          "7. When did you first conceive this (your date), and when was it first reduced to practice?",
          "8. Are there sketches, CAD, or videos that should be hashed into the Evidence Vault?",
        ].join("\n")
      );
    case "missing_details":
      return (
        header +
        (gaps.length
          ? `Missing or thin fields in the user record:\n${gaps.map((g) => `- ${g}`).join("\n")}`
          : "Core narrative fields look populated. Consider adding drawings/callouts and sealing a version.")
      );
    case "summary":
      return (
        header +
        `**Summary (from user text only)**\n\n${fields.title}: ${fields.description.slice(0, 600)}${
          fields.description.length > 600 ? "…" : ""
        }\n\nCategory: ${fields.category}. Prototype status: ${fields.prototypeStatus}.` +
        (gaps.length ? `\n\n[MISSING — user must provide]: ${gaps.join("; ")}` : "")
      );
    case "abstract":
      return (
        header +
        `A ${fields.category} invention titled “${fields.title}.” ${fields.description} ` +
        (fields.problemSolved ? `It addresses: ${fields.problemSolved}. ` : "[MISSING — problem]. ") +
        (fields.howItWorks ? `Operation: ${fields.howItWorks}` : "[MISSING — how it works].")
      );
    case "claim_concepts":
      return (
        header +
        [
          "**Preliminary claim concepts — NON-LEGAL drafts for counsel only**",
          "1. A system/apparatus comprising the elements described by the user in “How it works” and “Components.”",
          "2. The invention of concept 1, wherein unique features stated by the user further distinguish the preferred embodiment.",
          "3. A method comprising the steps the user described — only those steps actually written by the user.",
          "",
          "No new elements were invented by this assistant. Empty fields stay empty.",
        ].join("\n")
      );
    case "embodiments":
      return (
        header +
        (fields.alternativeImplementations.trim()
          ? `User-provided alternatives:\n${fields.alternativeImplementations}\n\nAI note: Consider whether each alternative shares the same inventive principle — confirm with counsel.`
          : "No user-provided alternatives yet. Suggestion: describe at least one different material, layout, or process that still solves the same problem — you must write the facts.")
      );
    case "components":
      return (
        header +
        (fields.componentsText.trim()
          ? `Organized from user text:\n${fields.componentsText
              .split(/[\n,;]+/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, i) => `${i + 1}. ${p}`)
              .join("\n")}`
          : "[MISSING — user must provide component list]")
      );
    case "improve_description":
      return (
        header +
        `Revised for clarity (no new facts):\n\n${fields.description.trim() || "[MISSING]"}\n\n` +
        (fields.uniqueFeatures
          ? `Emphasized distinction: ${fields.uniqueFeatures}`
          : "Add unique features in your own words.")
      );
    case "detailed_description":
      return (
        header +
        [
          "## Field of the invention",
          fields.category,
          "",
          "## Background / problem",
          fields.problemSolved || "[MISSING — user must provide]",
          "",
          "## Summary",
          fields.description || "[MISSING]",
          "",
          "## Detailed description",
          fields.howItWorks || "[MISSING — user must provide]",
          "",
          "## Unique features",
          fields.uniqueFeatures || "[MISSING]",
          "",
          "## Specs / materials / components",
          fields.technicalSpecs || "[MISSING specs]",
          fields.materials || "[MISSING materials]",
          fields.componentsText || "[MISSING components]",
        ].join("\n")
      );
    case "disclosure":
      return localAiFallback("detailed_description", fields);
    default:
      return header + "Unsupported task.";
  }
}
