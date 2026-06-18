import { NextRequest, NextResponse } from "next/server";
import { runMidiEvolution, type EvolutionRequest } from "@/lib/svivva-play/midi-evolution";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EvolutionRequest;
    if (!body.action) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }

    const result = await runMidiEvolution(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("midi-evolution error:", error);
    const message = error instanceof Error ? error.message : "Evolution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
