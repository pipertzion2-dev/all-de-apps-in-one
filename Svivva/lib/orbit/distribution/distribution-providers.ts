import type { MarketingPlatformCredentials } from "../marketing-autopilot-types";
import { loadMarketingPlatformCredentials } from "../marketing-autopilot-credentials";
import {
  publishDevToArticle,
  publishHashnodeArticle,
  publishOmniSocialsPost,
  publishRedditPost,
  publishTwitterThread,
  sendResendEmail,
} from "../marketing-autopilot-publishers";
import type { OrbitContentAsset } from "../schema";
import { parseAssetPayload, formatManualCopyText } from "./asset-payload-parser";
import {
  fallbackProvider,
  omnisocialsPlatforms,
  resolvePublishProvider,
} from "./platform-provider-map";
import type {
  DistributionIntent,
  DistributionPayload,
  DistributionPublishResult,
  PublishProvider,
} from "./distribution-types";
import { getDistributionIntent } from "./distribution-types";

function hasDevToCreds(creds: MarketingPlatformCredentials): boolean {
  return Boolean(creds.devtoApiKey?.trim());
}

function hasHashnodeCreds(creds: MarketingPlatformCredentials): boolean {
  return Boolean(creds.hashnodeApiKey?.trim() && creds.hashnodePublicationId?.trim());
}

function hasRedditCreds(creds: MarketingPlatformCredentials): boolean {
  return Boolean(
    creds.redditClientId?.trim() &&
    creds.redditClientSecret?.trim() &&
    creds.redditRefreshToken?.trim(),
  );
}

function hasOmniSocialsCreds(creds: MarketingPlatformCredentials): boolean {
  return Boolean(creds.omnisocialsApiKey?.trim());
}

function hasTwitterCreds(creds: MarketingPlatformCredentials): boolean {
  return Boolean(
    creds.twitterApiKey?.trim() &&
    creds.twitterApiSecret?.trim() &&
    creds.twitterAccessToken?.trim() &&
    creds.twitterAccessSecret?.trim(),
  );
}

function hasResendCreds(creds: MarketingPlatformCredentials): boolean {
  return Boolean(creds.resendApiKey?.trim() && creds.outreachFromEmail?.trim());
}

export function credentialsConfigured(
  provider: PublishProvider,
  creds: MarketingPlatformCredentials,
): boolean {
  switch (provider) {
    case "devto":
      return hasDevToCreds(creds);
    case "hashnode":
      return hasHashnodeCreds(creds);
    case "reddit":
      return hasRedditCreds(creds);
    case "omnisocials":
      return hasOmniSocialsCreds(creds);
    case "twitter":
      return hasTwitterCreds(creds);
    case "resend":
      return hasResendCreds(creds);
    case "manual":
      return true;
    default:
      return false;
  }
}

export function resolveProviderForAsset(
  asset: OrbitContentAsset,
  creds?: MarketingPlatformCredentials,
): PublishProvider | null {
  const intent = getDistributionIntent(asset);
  if (!intent) return null;

  let provider = resolvePublishProvider(asset.platform, intent);
  if (!provider) return null;

  if (provider === "omnisocials" && creds && !hasOmniSocialsCreds(creds)) {
    provider = fallbackProvider(asset.platform, provider);
  }

  return provider;
}

export async function publishToProvider(
  provider: PublishProvider,
  asset: OrbitContentAsset,
  creds?: MarketingPlatformCredentials,
): Promise<DistributionPublishResult> {
  const credentials = creds ?? (await loadMarketingPlatformCredentials());
  const payload = parseAssetPayload(asset);

  if (provider === "manual") {
    return {
      provider,
      ok: true,
      manualReady: true,
      copyText: formatManualCopyText(asset),
    };
  }

  if (!credentialsConfigured(provider, credentials)) {
    return {
      provider,
      ok: false,
      manualReady: true,
      copyText: formatManualCopyText(asset),
      error: `${provider} credentials not configured — copy ready for manual publish`,
    };
  }

  switch (provider) {
    case "devto": {
      const result = await publishDevToArticle(credentials.devtoApiKey!, {
        title: payload.title || asset.title || "Orbit post",
        content: payload.body,
        tags: payload.tags,
      });
      return {
        provider,
        ok: result.ok,
        externalId: result.id,
        externalUrl: result.url,
        error: result.error,
      };
    }
    case "hashnode": {
      const result = await publishHashnodeArticle(
        credentials.hashnodeApiKey!,
        credentials.hashnodePublicationId!,
        {
          title: payload.title || asset.title || "Orbit post",
          content: payload.body,
          tags: payload.tags,
        },
      );
      return {
        provider,
        ok: result.ok,
        externalUrl: result.url,
        error: result.error,
      };
    }
    case "reddit": {
      const subreddit = payload.subreddit || credentials.redditDefaultSubreddit || "SideProject";
      const result = await publishRedditPost(credentials, {
        subreddit,
        title: payload.title || asset.title || "Launch",
        body: payload.body,
      });
      return {
        provider,
        ok: result.ok,
        externalId: result.id,
        externalUrl: result.url,
        error: result.error,
      };
    }
    case "omnisocials": {
      const platforms = payload.platforms || omnisocialsPlatforms(asset.platform);
      const result = await publishOmniSocialsPost(credentials.omnisocialsApiKey!, {
        text: payload.body,
        platforms,
        linkUrl: payload.linkUrl,
        linkTitle: payload.title,
      });
      return {
        provider,
        ok: result.ok,
        externalId: result.id,
        externalUrl: result.url,
        error: result.error,
      };
    }
    case "twitter": {
      const tweets = payload.thread?.length ? payload.thread : [payload.body.slice(0, 280)];
      const result = await publishTwitterThread(credentials, tweets);
      return {
        provider,
        ok: result.ok,
        externalId: result.id,
        externalUrl: result.url,
        error: result.error,
      };
    }
    case "resend": {
      if (!payload.to) {
        return {
          provider,
          ok: false,
          manualReady: true,
          copyText: formatManualCopyText(asset),
          error: "Email recipient not set on asset metadata.to",
        };
      }
      const result = await sendResendEmail(credentials, {
        to: payload.to,
        subject: payload.subject || payload.title || "Orbit update",
        html: payload.body.replace(/\n/g, "<br/>"),
      });
      return {
        provider,
        ok: result.ok,
        externalId: result.id,
        error: result.error,
      };
    }
    default:
      return {
        provider: provider as PublishProvider,
        ok: false,
        error: `Unsupported provider: ${String(provider)}`,
      };
  }
}

export function providerForIntentAndPlatform(
  platform: string,
  intent: DistributionIntent,
): PublishProvider | null {
  return resolvePublishProvider(platform, intent);
}
