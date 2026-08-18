import type { IfmPairing } from "../ifm/ifm-types";
import type { IfmFusionProductSpec, OrbitRoadmapItem } from "./roadmap-types";

export const IFM_FUSION_SPEC_MARKER = "<!-- IFM_FUSION_SPEC:";

export function fusionProductSlug(roadmapSlug: string): string {
  return roadmapSlug.replace(/^ifm-/, "");
}

export function fusionProductPath(roadmapSlug: string): string {
  return `/tools/ifm-fusion/${fusionProductSlug(roadmapSlug)}`;
}

export function fusionSeoSlug(roadmapSlug: string): string {
  return `ifm-fusion-${fusionProductSlug(roadmapSlug)}`;
}

export function buildFusionProductSpec(
  item: OrbitRoadmapItem,
  pairing?: IfmPairing,
): IfmFusionProductSpec {
  const slug = fusionProductSlug(item.slug);
  const hub =
    pairing?.toolA.hub === "cyber-security-mini-apps" || pairing?.toolB.hub === "cyber-security-mini-apps"
      ? "cyber-security-mini-apps"
      : pairing?.toolA.hub === "seo-pack" || pairing?.toolB.hub === "seo-pack"
        ? "seo-pack"
        : "ai-tools-hub";

  return {
    slug,
    fusionTitle: item.fusionTitle,
    toolAPath: item.toolAPath,
    toolBPath: item.toolBPath,
    toolAName: item.toolAName,
    toolBName: item.toolBName,
    microToolIdea: pairing?.microToolIdea,
    hub,
    keyword: `${item.toolAName} ${item.toolBName} fusion workflow`,
    description:
      pairing?.microToolIdea ||
      `Fused workflow combining ${item.toolAName} and ${item.toolBName} — promoted from IFM roadmap.`,
    workflowSteps: [
      `Run ${item.toolAName} and capture the output.`,
      `Paste the hand-off into this fusion workspace.`,
      `Continue in ${item.toolBName} to complete the fused intent.`,
    ],
  };
}

export function embedFusionSpecInContent(content: string, spec: IfmFusionProductSpec): string {
  const payload = Buffer.from(JSON.stringify(spec), "utf8").toString("base64url");
  const marker = `${IFM_FUSION_SPEC_MARKER}${payload} -->`;
  if (content.includes(IFM_FUSION_SPEC_MARKER)) return content;
  return `${content}\n\n${marker}`;
}

export function parseFusionSpecFromContent(content: string): IfmFusionProductSpec | null {
  const start = content.indexOf(IFM_FUSION_SPEC_MARKER);
  if (start < 0) return null;
  const end = content.indexOf(" -->", start);
  if (end < 0) return null;
  const encoded = content.slice(start + IFM_FUSION_SPEC_MARKER.length, end);
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as IfmFusionProductSpec;
  } catch {
    return null;
  }
}
