import { NextRequest, NextResponse } from "next/server";
import { mockHypotheses } from "@/lib/clutety/pipeline-mock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { system?: string };
  const system = body.system?.trim() || "feed.example.com";
  return NextResponse.json(mockHypotheses(system));
}
