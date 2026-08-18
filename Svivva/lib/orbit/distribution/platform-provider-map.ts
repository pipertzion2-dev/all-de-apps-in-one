import type { OrbitContentPlatform } from "../graph-constants";
import type { DistributionIntent, PublishProvider } from "./distribution-types";

const MANUAL_PLATFORMS = new Set<OrbitContentPlatform>([
  "hn",
  "product_hunt",
  "instagram",
  "facebook",
  "pinterest",
  "youtube",
  "tiktok",
]);

/** Map content platform + intent to distribution provider. */
export function resolvePublishProvider(
  platform: string,
  distributionIntent: DistributionIntent,
): PublishProvider | null {
  if (distributionIntent === "indexing") return null;
  if (distributionIntent === "manual_ready") return "manual";

  switch (platform as OrbitContentPlatform) {
    case "devto":
      return "devto";
    case "hashnode":
      return "hashnode";
    case "reddit":
      return "reddit";
    case "x":
    case "linkedin":
      return "omnisocials";
    case "email":
      return "resend";
    default:
      if (MANUAL_PLATFORMS.has(platform as OrbitContentPlatform)) return "manual";
      return "manual";
  }
}

/** Fallback when OmniSocials is not configured — x can use direct Twitter OAuth. */
export function fallbackProvider(platform: string, primary: PublishProvider): PublishProvider {
  if (primary === "omnisocials" && platform === "x") return "twitter";
  return primary;
}

export function omnisocialsPlatforms(platform: string): string[] {
  if (platform === "x") return ["x", "twitter"];
  if (platform === "linkedin") return ["linkedin"];
  return [platform];
}
