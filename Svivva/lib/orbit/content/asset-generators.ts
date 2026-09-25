import type { OrbitApprovalPolicy, OrbitContentPlatform } from "../graph-constants";
import type { PlannedAsset } from "../campaign/plan-types";
import type {
  AssetGenerationContext,
  GeneratedAssetDraft,
  ValidateAssetInput,
  ValidationIssue,
  ValidationResult,
} from "./asset-types";
import { PLATFORM_LIMITS } from "./asset-types";
import {
  generateBlogPost,
  generateComparisonPage,
  generateSchemaOrg,
  generateSEOPage,
  generateSocialPack,
} from "../content-templates";
import { generateText } from "../ai-client";
import { isOrbitFreeAIConfigured } from "@/lib/llm/openai";

const PROMPT_VERSION = "orbit-content-v1";

function entityNames(ctx: AssetGenerationContext, ids?: string[]): string[] {
  if (!ids?.length) return [];
  const map = new Map(ctx.entities.map((e) => [e.id, e.name]));
  return ids.map((id) => map.get(id)).filter(Boolean) as string[];
}

function primaryKeyword(planned: PlannedAsset, ctx: AssetGenerationContext): string {
  return (
    planned.keywords?.[0] ||
    ctx.entities.find((e) => e.entityType === "keyword")?.name ||
    ctx.projectName
  );
}

function landingMarkdown(ctx: AssetGenerationContext, planned: PlannedAsset): GeneratedAssetDraft {
  const kw = primaryKeyword(planned, ctx);
  const targets = entityNames(ctx, planned.targetEntityIds);
  const body = `# ${planned.title}

${ctx.description || planned.purpose}

## Why ${ctx.projectName}

${planned.purpose}

## Key highlights

${targets.length ? targets.map((t) => `- ${t}`).join("\n") : "- Core value proposition from ingested graph"}

## Primary keyword

**${kw}**

## Call to action

Learn more about ${ctx.projectName}${ctx.canonicalUrl ? `: ${ctx.canonicalUrl}` : ""}.
`;
  return {
    title: planned.title,
    body,
    bodyFormat: "markdown",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", plannedAssetId: planned.id },
  };
}

function faqMarkdown(ctx: AssetGenerationContext, planned: PlannedAsset): GeneratedAssetDraft {
  const body = `# ${planned.title}

## What is ${ctx.projectName}?

${ctx.description || planned.purpose}

## Who is it for?

Teams and creators who need ${planned.purpose.toLowerCase()}.

## How do I get started?

Visit ${ctx.canonicalUrl || "the project homepage"} to begin.

## FAQ metadata

Generated from Orbit campaign plan — review before publish.
`;
  return {
    title: planned.title,
    body,
    bodyFormat: "markdown",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", plannedAssetId: planned.id },
  };
}

function socialMarkdown(ctx: AssetGenerationContext, planned: PlannedAsset): GeneratedAssetDraft {
  const pack = generateSocialPack();
  let body: string;
  switch (planned.platform) {
    case "x":
      body = pack.twitterThread.join("\n\n---\n\n");
      break;
    case "linkedin":
      body = pack.linkedInPost;
      break;
    case "reddit": {
      const sub = pack.redditPosts[0];
      body = sub ? `**${sub.title}**\n\n${sub.body}` : planned.purpose;
      break;
    }
    case "instagram":
      body = `${planned.title}\n\n${planned.purpose}\n\n#${ctx.projectName.replace(/\s+/g, "")}`;
      break;
    default:
      body = `${planned.title}\n\n${planned.purpose}\n\n${ctx.projectName}${ctx.canonicalUrl ? ` — ${ctx.canonicalUrl}` : ""}`;
  }
  body = body.replace(/ZZAI|zzaizzai\.com/gi, ctx.projectName);
  return {
    title: planned.title,
    body,
    bodyFormat: "markdown",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", platform: planned.platform, plannedAssetId: planned.id },
  };
}

function blogMarkdown(ctx: AssetGenerationContext, planned: PlannedAsset): GeneratedAssetDraft {
  const post = generateBlogPost(0);
  const body = `# ${planned.title}

${planned.purpose}

---

${post.content.replace(/ZZAI|Svivva/gi, ctx.projectName)}

${ctx.canonicalUrl ? `\n\nRead more: ${ctx.canonicalUrl}` : ""}
`;
  return {
    title: planned.title,
    body,
    bodyFormat: "markdown",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", plannedAssetId: planned.id },
  };
}

function launchMarkdown(ctx: AssetGenerationContext, planned: PlannedAsset): GeneratedAssetDraft {
  const pack = generateSocialPack();
  let body: string;
  if (planned.platform === "hn") {
    body = `${pack.showHN}\n\n---\n\nProject: ${ctx.projectName}\n${planned.purpose}`;
  } else if (planned.platform === "product_hunt") {
    body = `TAGLINE: ${ctx.projectName} — ${planned.purpose.slice(0, 55)}

DESCRIPTION:
${ctx.description || planned.purpose}

${ctx.canonicalUrl ? `URL: ${ctx.canonicalUrl}` : ""}

FIRST_COMMENT:
Sharing ${ctx.projectName} with the community — feedback welcome!`;
  } else {
    body = `${planned.title}\n\n${planned.purpose}\n\n${ctx.projectName}`;
  }
  return {
    title: planned.title,
    body,
    bodyFormat: "markdown",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", plannedAssetId: planned.id },
  };
}

function seoPageMarkdown(ctx: AssetGenerationContext, planned: PlannedAsset): GeneratedAssetDraft {
  const kw = primaryKeyword(planned, ctx);
  const page =
    planned.assetType === "comparison_page" ? generateComparisonPage(kw) : generateSEOPage(kw, 1);
  const body = `# ${page.headline}

${page.subheadline}

${page.content.replace(/ZZAI|zzaizzai\.com/gi, ctx.projectName)}

---
*Planned purpose:* ${planned.purpose}
`;
  return {
    title: planned.title || page.title,
    body,
    bodyFormat: "markdown",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", keyword: kw, plannedAssetId: planned.id },
  };
}

function structuredDataJson(
  ctx: AssetGenerationContext,
  planned: PlannedAsset,
): GeneratedAssetDraft {
  const schema = generateSchemaOrg().replace(/ZZAI|zzaizzai\.com/gi, ctx.projectName);
  return {
    title: planned.title,
    body: schema,
    bodyFormat: "html",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", plannedAssetId: planned.id },
  };
}

function checklistMarkdown(
  ctx: AssetGenerationContext,
  planned: PlannedAsset,
): GeneratedAssetDraft {
  const targets = entityNames(ctx, planned.targetEntityIds);
  const body = `# ${planned.title}

## Purpose

${planned.purpose}

## Checklist

- [ ] Review ingested entities (${ctx.entities.length} total)
${targets.map((t) => `- [ ] Validate target: ${t}`).join("\n")}
- [ ] Confirm messaging aligns with ${ctx.projectName}
- [ ] Mark complete when ready for next phase

## Notes

Product type: **${ctx.productType}**
`;
  return {
    title: planned.title,
    body,
    bodyFormat: "markdown",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", plannedAssetId: planned.id },
  };
}

function plainTextAsset(ctx: AssetGenerationContext, planned: PlannedAsset): GeneratedAssetDraft {
  const body = `${planned.title}

${planned.purpose}

Project: ${ctx.projectName}
${ctx.description ? `\n${ctx.description}` : ""}
${ctx.canonicalUrl ? `\nLink: ${ctx.canonicalUrl}` : ""}
`;
  return {
    title: planned.title,
    body,
    bodyFormat: "plain",
    promptTemplateVersion: PROMPT_VERSION,
    metadata: { generator: "template", plannedAssetId: planned.id },
  };
}

async function maybeEnhanceWithAi(
  draft: GeneratedAssetDraft,
  ctx: AssetGenerationContext,
  planned: PlannedAsset,
  templateOnly?: boolean,
): Promise<GeneratedAssetDraft> {
  if (templateOnly || !isOrbitFreeAIConfigured()) return draft;

  try {
    const prompt = `Improve this marketing draft for "${ctx.projectName}" (${ctx.productType}).

Asset type: ${planned.assetType}
Platform: ${planned.platform}
Purpose: ${planned.purpose}

Current draft:
${draft.body.slice(0, 2000)}

Return only the improved body text. Keep format (${draft.bodyFormat}). Do not add preamble.`;
    const enhanced = await generateText(prompt, { maxTokens: 1200 });
    if (enhanced.length > 50) {
      return {
        ...draft,
        body: enhanced,
        model: process.env.ORBIT_AI_MODEL || "default",
        metadata: { ...draft.metadata, generator: "ai+template" },
      };
    }
  } catch {
    /* keep template draft */
  }
  return draft;
}

/** Deterministic template generator with optional AI polish. */
export async function generateAssetDraft(
  ctx: AssetGenerationContext,
  planned: PlannedAsset,
  opts: { templateOnly?: boolean } = {},
): Promise<GeneratedAssetDraft> {
  let draft: GeneratedAssetDraft;

  switch (planned.assetType) {
    case "landing_page":
    case "release_page":
    case "documentation_page":
      draft = landingMarkdown(ctx, planned);
      break;
    case "faq_page":
      draft = faqMarkdown(ctx, planned);
      break;
    case "use_case_page":
    case "comparison_page":
      draft = seoPageMarkdown(ctx, planned);
      break;
    case "social_post":
      draft = socialMarkdown(ctx, planned);
      break;
    case "blog_post":
      draft = blogMarkdown(ctx, planned);
      break;
    case "launch_announcement":
      draft = launchMarkdown(ctx, planned);
      break;
    case "structured_data":
      draft = structuredDataJson(ctx, planned);
      break;
    case "seo_audit":
    case "audience_research":
    case "positioning_doc":
    case "indexing_submit":
      draft = checklistMarkdown(ctx, planned);
      break;
    default:
      draft = plainTextAsset(ctx, planned);
  }

  const entityId = planned.targetEntityIds?.[0];
  if (entityId) draft.entityId = entityId;

  return maybeEnhanceWithAi(draft, ctx, planned, opts.templateOnly);
}

export function validateAssetContent(input: ValidateAssetInput): ValidationResult {
  const issues: ValidationIssue[] = [];
  const checkedAt = new Date().toISOString();

  if (!input.body.trim()) {
    issues.push({ code: "empty_body", message: "Body is empty", severity: "error", field: "body" });
  }

  const limits = PLATFORM_LIMITS[input.platform];
  if (limits?.bodyMax && input.body.length > limits.bodyMax) {
    issues.push({
      code: "body_too_long",
      message: `Body exceeds ${limits.bodyMax} chars for ${input.platform} (${input.body.length})`,
      severity: "error",
      field: "body",
    });
  }
  if (limits?.titleMax && input.title && input.title.length > limits.titleMax) {
    issues.push({
      code: "title_too_long",
      message: `Title exceeds ${limits.titleMax} chars for ${input.platform}`,
      severity: "error",
      field: "title",
    });
  }

  const policy = input.policy;
  if (policy?.blockedTerms?.length) {
    const lower = input.body.toLowerCase();
    for (const term of policy.blockedTerms) {
      if (term && lower.includes(term.toLowerCase())) {
        issues.push({
          code: "blocked_term",
          message: `Contains blocked term: ${term}`,
          severity: "error",
        });
      }
    }
  }

  if (policy?.allowedPlatforms?.length && !policy.allowedPlatforms.includes(input.platform)) {
    issues.push({
      code: "platform_not_allowed",
      message: `Platform ${input.platform} not in approval policy`,
      severity: "error",
      field: "platform",
    });
  }

  if (
    policy?.allowedContentTypes?.length &&
    !policy.allowedContentTypes.includes(input.assetType)
  ) {
    issues.push({
      code: "asset_type_not_allowed",
      message: `Asset type ${input.assetType} not in approval policy`,
      severity: "error",
      field: "assetType",
    });
  }

  if (policy?.requiredDisclaimers?.length) {
    const lower = input.body.toLowerCase();
    for (const disclaimer of policy.requiredDisclaimers) {
      if (disclaimer && !lower.includes(disclaimer.toLowerCase())) {
        issues.push({
          code: "missing_disclaimer",
          message: `Required disclaimer missing: ${disclaimer}`,
          severity: "error",
        });
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  return {
    status: hasErrors ? "failed" : "passed",
    issues,
    checkedAt,
  };
}

export function validationToRecord(result: ValidationResult): Record<string, unknown> {
  return {
    status: result.status,
    issues: result.issues,
    checkedAt: result.checkedAt,
  };
}

export function publishStatusForIntent(
  distributionIntent: string,
  validationPassed: boolean,
): string {
  if (!validationPassed) return "draft";
  if (distributionIntent === "manual_ready") return "ready_for_manual";
  if (distributionIntent === "auto_if_configured") return "scheduled";
  if (distributionIntent === "indexing") return "draft";
  return "draft";
}
