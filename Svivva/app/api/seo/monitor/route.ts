import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runSeoMonitor } from "@/lib/seo/monitoring/detector";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isOrbitAdminAllowed())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const report = await runSeoMonitor();
  return NextResponse.json(report, { status: report.ok ? 200 : 207 });
}
