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
import { isAnyAiProviderAvailable, getActiveAiProvider } from "@/lib/llm/openai";

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

    const creds = await loadMarketingPlatformCredentials();
    const status = await getMarketingCredentialStatus();
    const lastRun = await loadLastAutopilotRun();

    return NextResponse.json({
      credentials: maskCredentialsForClient(creds),
      status,
      lastRun,
      tasks: MARKETING_AUTOPILOT_TASKS,
      gscConnectUrl: "/dashboard/gsc-connect",
      setupProviders: ORBIT_SETUP_PROVIDERS,
      ai: {
        configured: isAnyAiProviderAvailable(),
        provider: getActiveAiProvider(),
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

    const result = await runMarketingAutopilot({ skipOnSite: body.skipOnSite });
    return NextResponse.json({ ...result, ok: result.ok });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
