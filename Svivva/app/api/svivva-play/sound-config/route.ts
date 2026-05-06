import { NextRequest, NextResponse } from "next/server";
import { resolveInstrumentPreset, getAvailableInstruments } from "@/lib/svivva-play/instruments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instrumentHint, role, register, batch } = body;

    if (batch && Array.isArray(batch)) {
      const configs = batch.map((item: { instrumentHint: string; role?: string; register?: string }) => {
        const preset = resolveInstrumentPreset(item.instrumentHint, item.role);
        return {
          instrumentHint: item.instrumentHint,
          role: item.role,
          register: item.register,
          preset,
        };
      });
      return NextResponse.json({ configs });
    }

    if (!instrumentHint) {
      return NextResponse.json({ error: "instrumentHint is required" }, { status: 400 });
    }

    const preset = resolveInstrumentPreset(instrumentHint, role);
    return NextResponse.json({
      instrumentHint,
      role,
      register,
      preset,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  const instruments = getAvailableInstruments();
  return NextResponse.json({
    availableInstruments: instruments,
    synthFamilies: ["synth", "fm", "am", "mono", "membrane", "metal", "pluck", "noise"],
    effectTypes: ["reverb", "delay", "chorus", "distortion", "phaser", "compressor", "eq"],
  });
}
