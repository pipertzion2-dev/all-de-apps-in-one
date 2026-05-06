import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface MidiEvent {
  type: string;
  time: number;
  note?: number;
  velocity?: number;
  duration?: number;
}

interface Stem {
  name: string;
  role: string;
  instrumentHint: string;
  midiEvents: MidiEvent[];
}

interface Analysis {
  bpm: number;
  key: string;
  timeSignature: string;
  chords: Array<{
    t0: number;
    t1: number;
    symbol: string;
    confidence: number;
  }>;
  sections: Array<{
    name: string;
    t0: number;
    t1: number;
  }>;
}

interface Config {
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  duration?: number;
  quality?: string;
}

interface RequestBody {
  analysis: Analysis;
  stems: Stem[];
  style?: string;
  mode: string;
  config?: Config;
}

interface PromptResponse {
  prompt: string;
  tags: string[];
  qualityScore: number;
  modelSettings: {
    steps: number;
    cfgScale: number;
    duration: number;
  };
}

function formatStemAnalysis(stems: Stem[]): string {
  return stems
    .map((stem) => {
      const noteCount = stem.midiEvents.filter((e) => e.type === "noteOn").length;
      const avgVelocity = Math.round(
        stem.midiEvents
          .filter((e) => e.type === "noteOn" && e.velocity)
          .reduce((sum, e) => sum + (e.velocity || 0), 0) /
          Math.max(noteCount, 1)
      );

      return `- ${stem.name} (${stem.role}): ${stem.instrumentHint}, ${noteCount} notes, avg velocity ${avgVelocity}`;
    })
    .join("\n");
}

function formatChordProgression(chords: Analysis["chords"]): string {
  if (!chords || chords.length === 0) return "No chord data available";

  const sortedChords = [...chords].sort((a, b) => a.t0 - b.t0);
  return sortedChords
    .slice(0, 16)
    .map((c) => c.symbol)
    .join(" - ");
}

function formatSections(sections: Analysis["sections"]): string {
  if (!sections || sections.length === 0) return "Single section composition";

  return sections.map((s) => `${s.name} (${s.t0.toFixed(1)}s - ${s.t1.toFixed(1)}s)`).join(", ");
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    const { analysis, stems, style = "", mode = "composition", config = {} } = body;

    if (!analysis || !stems || stems.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: analysis and stems" },
        { status: 400 }
      );
    }

    if (!analysis.bpm || !analysis.key || !analysis.timeSignature) {
      return NextResponse.json(
        { error: "Missing required analysis fields: bpm, key, timeSignature" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a neural audio prompt engineer specializing in generating optimized prompts for advanced audio synthesis systems like Suno, Udio, and similar neural audio models.

Your task is to translate musical MIDI analysis data and stem information into rich, detailed, production-ready prompts that capture:
1. Genre and style characteristics
2. Instrumentation and orchestration details
3. Tempo, rhythm feel, and groove characteristics
4. Harmonic characteristics and chord progressions
5. Dynamic and energy arc throughout the composition
6. Production quality descriptors (warm, crisp, lush, clean, saturated, etc.)
7. Reference artists/sounds when appropriate
8. Special effects, textures, and production techniques

Return a JSON object with:
{
  "prompt": "A detailed, evocative prompt (2-4 sentences) optimized for neural audio generation",
  "tags": ["genre1", "mood1", "instrument1", "style1", ...],
  "qualityScore": 0-100 estimate of how well this prompt will generate high-quality audio,
  "modelSettings": {
    "steps": 50-100 (inference steps, higher for complex compositions),
    "cfgScale": 7.0-9.5 (guidance scale for adherence to prompt),
    "duration": seconds (recommended generation duration based on composition)
  }
}

Focus on creating prompts that are:
- Specific and descriptive (avoid generic terms)
- Technically grounded in the actual musical data
- Evocative and inspiring to the model
- Optimized for the audio generation model's strengths`;

    const userMessage = `Analyze this musical composition and generate an optimized neural audio prompt:

MODE: ${mode}
USER STYLE: ${style || "Not specified"}

ANALYSIS DATA:
- BPM: ${analysis.bpm}
- Key: ${analysis.key}
- Time Signature: ${analysis.timeSignature}
- Chord Progression: ${formatChordProgression(analysis.chords)}
- Structure: ${formatSections(analysis.sections)}

STEMS:
${formatStemAnalysis(stems)}

CONFIG:
${
  Object.entries(config)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n") || "No additional config specified"
}

Generate a comprehensive prompt optimized for neural audio generation that captures all the musical characteristics of this composition.`;

    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 1,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const contentBlock = response.choices[0].message.content;
    if (!contentBlock) {
      return NextResponse.json(
        { error: "No response content from OpenAI" },
        { status: 500 }
      );
    }

    let parsedResponse: PromptResponse;
    try {
      parsedResponse = JSON.parse(contentBlock) as PromptResponse;
    } catch {
      return NextResponse.json(
        { error: "Failed to parse OpenAI response as JSON" },
        { status: 500 }
      );
    }

    // Validate response structure
    if (
      !parsedResponse.prompt ||
      !Array.isArray(parsedResponse.tags) ||
      typeof parsedResponse.qualityScore !== "number" ||
      !parsedResponse.modelSettings
    ) {
      return NextResponse.json(
        { error: "Invalid response structure from OpenAI" },
        { status: 500 }
      );
    }

    // Ensure quality score is within bounds
    parsedResponse.qualityScore = Math.max(0, Math.min(100, parsedResponse.qualityScore));

    // Ensure model settings are within reasonable bounds
    parsedResponse.modelSettings.steps = Math.max(
      20,
      Math.min(100, parsedResponse.modelSettings.steps)
    );
    parsedResponse.modelSettings.cfgScale = Math.max(
      1,
      Math.min(15, parsedResponse.modelSettings.cfgScale)
    );
    parsedResponse.modelSettings.duration = Math.max(
      10,
      Math.min(600, parsedResponse.modelSettings.duration)
    );

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Neural prompt generation error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Neural prompt generation failed" },
      { status: 500 }
    );
  }
}
