import type { OrbitContentAsset } from "../schema";
import type { DistributionPayload } from "./distribution-types";

export function parseAssetPayload(asset: OrbitContentAsset): DistributionPayload {
  const meta = (asset.metadata as Record<string, unknown>) || {};
  const body = asset.body || "";
  const title = asset.title || undefined;

  switch (asset.platform) {
    case "reddit":
      return parseRedditPayload(body, title, meta);
    case "x":
      return parseTwitterPayload(body, title, meta);
    case "devto":
    case "hashnode":
      return {
        title: title || extractFirstHeading(body) || "Untitled",
        body: stripLeadingHeading(body),
        tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : ["ai", "tools"],
        linkUrl: meta.linkUrl as string | undefined,
      };
    case "linkedin":
      return {
        title,
        body: body.slice(0, 3000),
        platforms: ["linkedin"],
        linkUrl: meta.linkUrl as string | undefined,
      };
    case "email":
      return {
        title,
        subject: title || "Update from Orbit",
        body,
        to: (meta.to as string) || undefined,
      };
    default:
      return { title, body, linkUrl: meta.linkUrl as string | undefined };
  }
}

function extractFirstHeading(body: string): string | undefined {
  const match = body.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function stripLeadingHeading(body: string): string {
  return body.replace(/^#\s+.+\n+/, "").trim();
}

export function parseRedditPayload(
  body: string,
  title?: string,
  meta?: Record<string, unknown>,
): DistributionPayload {
  const boldMatch = body.match(/^\*\*(.+?)\*\*\s*\n+/);
  const parsedTitle = boldMatch?.[1] || title || "Launch post";
  const parsedBody = boldMatch ? body.slice(boldMatch[0].length).trim() : body;
  return {
    title: parsedTitle,
    body: parsedBody,
    subreddit: (meta?.subreddit as string) || "SideProject",
  };
}

export function parseTwitterPayload(
  body: string,
  title?: string,
  meta?: Record<string, unknown>,
): DistributionPayload {
  const parts = body
    .split(/\n---\n|\n\n---\n\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const numbered = parts.flatMap((p) =>
    p
      .split(/\n(?=\[\d+\/\d+\])/)
      .map((s) => s.replace(/^\[\d+\/\d+\]\s*/, "").trim())
      .filter(Boolean),
  );

  const thread = numbered.length > 1 ? numbered : parts.length > 1 ? parts : [body.slice(0, 280)];

  return {
    title,
    body: thread[0] || body.slice(0, 280),
    thread,
    platforms: ["x"],
    linkUrl: meta?.linkUrl as string | undefined,
  };
}

export function formatManualCopyText(asset: OrbitContentAsset): string {
  const payload = parseAssetPayload(asset);
  const lines = [`# ${payload.title || asset.title || asset.assetType}`, "", payload.body];
  if (payload.subreddit) lines.unshift(`Subreddit: r/${payload.subreddit.replace(/^r\//, "")}`);
  return lines.join("\n");
}
