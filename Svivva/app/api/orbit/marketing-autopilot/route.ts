import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runMarketingAutopilot } from "@/lib/orbit/marketing-autopilot";
import {
  getMarketingCredentialStatus,
  loadLastAutopilotRun,
  loadMarketingPlatformCredentials,
  saveMarketingPlatformCredentials,
} from "@/lib/orbit/marketing-autopilot-credentials";
import { maskCredentialsForClient } from "@/lib/orbit/marketing-autopilot-types";
import { MARKETING_AUTOPILOT_TASKS } from "@/lib/orbit/marketing-autopilot-tasks";
import type { MarketingPlatformCredentials } from "@/lib/orbit/marketing-autopilot-types";
import { ORBIT_SETUP_PROVIDERS } from "@/lib/orbit/orbit-setup-providers";
import {
  isOrbitAiConfigured,
  getOrbitActiveAiProvider,
  getOrbitAiProviderLabel,
} from "@/lib/llm/providers";
import { getMarketingModel } from "@/lib/orbit/ai-client";
import { ensureEasyPeasyForOrbit } from "@/lib/easypeasy/ensure";
import { isEasyPeasyActive, loadEasyPeasyConfig } from "@/lib/easypeasy/config";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { isCopyOnlyDistributionMode } from "@/lib/orbit/distribution-mode";
import { ensureOrbitDbReady } from "@/lib/ensure-core-db-tables";
import { formatOrbitDbSetupError } from "@/lib/db-connection-error";

export const maxDuration = 300;

const MASK = "••••••••";

function isMasked(v: unknown): boolean {
  return typeof v === "string" && (v === MASK || v.startsWith("••••"));
}

/** GET — credential status, masked values, last run, task catalog */
export async function GET(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await hydratePlatformSecrets();
    const creds = await loadMarketingPlatformCredentials();
    const status = await getMarketingCredentialStatus();
    const lastRun = await loadLastAutopilotRun();
    const copyOnlyMode = isCopyOnlyDistributionMode(creds);
    const easypeasyConfig = await loadEasyPeasyConfig();

    return NextResponse.json({
      credentials: maskCredentialsForClient(creds),
      status,
      lastRun,
      tasks: MARKETING_AUTOPILOT_TASKS,
      gscConnectUrl: "/dashboard/gsc-connect",
      setupProviders: ORBIT_SETUP_PROVIDERS,
      copyOnlyMode,
      easypeasy: {
        active: isEasyPeasyActive(easypeasyConfig),
        tierId: easypeasyConfig.tierId,
        model: easypeasyConfig.model,
      },
      ai: {
        configured: isOrbitAiConfigured(),
        provider: getOrbitActiveAiProvider(),
        providerLabel: getOrbitAiProviderLabel(),
        marketingModel: getMarketingModel(),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** POST — save credentials and/or run autopilot */
export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      action?: "save" | "run" | "save_and_run";
      credentials?: Partial<MarketingPlatformCredentials>;
      skipOnSite?: boolean;
    };

    if (body.credentials && Object.keys(body.credentials).length > 0) {
      const patch: Partial<MarketingPlatformCredentials> = {};
      const existing = await loadMarketingPlatformCredentials();
      for (const [k, v] of Object.entries(body.credentials)) {
        const key = k as keyof MarketingPlatformCredentials;
        if (v === undefined || v === null) continue;
        if (isMasked(v)) {
          patch[key] = existing[key];
          continue;
        }
        if (typeof v === "string" && v.trim() === "") continue;
        patch[key] = String(v);
      }
      await saveMarketingPlatformCredentials(patch);
    }

    const action = body.action ?? "run";
    if (action === "save") {
      return NextResponse.json({ ok: true, saved: true });
    }

    try {
      await ensureOrbitDbReady();
    } catch (e) {
      const msg = formatOrbitDbSetupError(e) || String(e);
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const easypeasy = await ensureEasyPeasyForOrbit({
      testConnection: true,
    });

    const result = await runMarketingAutopilot({ skipOnSite: body.skipOnSite });
    return NextResponse.json({
      ...result,
      ok: result.ok,
      easypeasy,
      ai: {
        configured: isOrbitAiConfigured(),
        provider: getOrbitActiveAiProvider(),
        providerLabel: getOrbitAiProviderLabel(),
        marketingModel: getMarketingModel(),
      },
    });
  } catch (e) {
    const setupMsg = formatOrbitDbSetupError(e);
    return NextResponse.json({ error: setupMsg || String(e) }, { status: setupMsg ? 503 : 500 });
  }
}
