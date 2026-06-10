import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";

interface TrackDescriptor {
  title: string;
  description: string;
  emotionalProfile: string[];
  spectralDescription: string;
  rhythmicPattern: string;
  harmonicLanguage: string;
}

interface RequestBody {
  trackA: TrackDescriptor;
  trackB: TrackDescriptor;
  hybridizationPoint: "tonal" | "rhythmic" | "timbral" | "structural" | "emotional";
  targetEmotion: string;
  outputFormat: "song-structure" | "production-spec" | "stem-blueprint";
}

interface PsychoacousticVector {
  valence: number;
  arousal: number;
  tension: number;
  complexity: number;
  brightness: number;
  warmth: number;
  roughness: number;
  pulseClarity: number;
  tonalStability: number;
  spectralSpread: number;
  harmonicDensity: number;
  rhythmicEntropy: number;
}

interface ArrangementSection {
  section: string;
  bars: number;
  description: string;
}

interface ProductionSpec {
  tempo: string;
  key: string;
  timeSignature: string;
  arrangement: ArrangementSection[];
  instrumentStack: string[];
  mixingNotes: string[];
  referenceArtists: string[];
}

interface GenomeResponse {
  genomeA: PsychoacousticVector;
  genomeB: PsychoacousticVector;
  hybridGenome: PsychoacousticVector;
  crossoverPoints: string[];
  dominantStreams: {
    A: string[];
    B: string[];
  };
  hybridStreams: string[];
  productionSpec: ProductionSpec;
  uniquenessScore: number;
  emotionalArc: string;
  novelMusicologicalConcept: string;
  psychoacousticExplanation: string;
}

const GENOME_SYSTEM_PROMPT = `You are a computational musicologist and psychoacoustic engineer with deep expertise in:
- Auditory Scene Analysis (Bregman 1990) and perceptual stream segregation
- Fletcher-Munson equal-loudness contours and frequency-domain perception
- Helmholtz dissonance theory and tonal roughness
- Spectral centroid analysis, onset density metrics, and rhythmic entropy
- Formal music theory across Western, non-Western, and electronic paradigms

Your task is to perform a **Psychoacoustic Genome Hybridization** — a scientifically-grounded fusion of two musical "genomes."

## Step 1: Genomic Decomposition
Represent each track as a 12-dimensional psychoacoustic vector. Each dimension is a float in [0.0, 1.0]:
- valence: negative→positive emotional valence (Russell circumplex)
- arousal: calm→energetic (Russell circumplex)
- tension: resolved→unresolved harmonic tension
- complexity: simple→dense structural complexity
- brightness: dark/warm→bright/present (spectral centroid proxy)
- warmth: cold/thin→warm/full (low-mid energy)
- roughness: smooth→rough (Helmholtz dissonance, harmonic beating)
- pulseClarity: arhythmic→metronomic pulse strength
- tonalStability: atonal→tonally anchored
- spectralSpread: narrow-band→broadband frequency spread
- harmonicDensity: sparse harmonics→dense chord voicings
- rhythmicEntropy: metronomic→complex polyrhythmic entropy

## Step 2: ASA Stream Analysis
Using Bregman's Auditory Scene Analysis, identify the dominant perceptual streams:
- melody stream (primary melodic voice)
- bass stream (low-frequency foundation)
- rhythm stream (percussive/groove layer)
- ambience stream (texture, reverb tail, pads)
- ornament stream (fills, countermelody, stabs)

## Step 3: Crossover Point Identification
Find the hybridization point — the perceptual boundary where the two genomes can fuse without introducing psychoacoustic discontinuity (jarring transitions, tonal clash, rhythmic displacement).

## Step 4: Hybrid Genome Synthesis
Apply a genetic crossover at the identified perceptual boundary. Use weighted interpolation based on the hybridizationPoint parameter:
- tonal: weight tonalStability, harmonicDensity, tension toward crossover blend
- rhythmic: weight pulseClarity, rhythmicEntropy, arousal toward crossover blend
- timbral: weight brightness, warmth, roughness, spectralSpread toward crossover blend
- structural: weight complexity, all streams equally
- emotional: weight valence, arousal, tension toward target emotion

## Step 5: Production Blueprint
Translate the hybrid genome back into concrete, actionable production specifications.

Return a single JSON object (no markdown, no explanation outside JSON) matching this exact schema:
{
  "genomeA": { "valence": float, "arousal": float, "tension": float, "complexity": float, "brightness": float, "warmth": float, "roughness": float, "pulseClarity": float, "tonalStability": float, "spectralSpread": float, "harmonicDensity": float, "rhythmicEntropy": float },
  "genomeB": { same 12 fields },
  "hybridGenome": { same 12 fields — the weighted crossover result },
  "crossoverPoints": [ "description of each crossover boundary found" ],
  "dominantStreams": {
    "A": [ "stream:descriptor", ... ],
    "B": [ "stream:descriptor", ... ]
  },
  "hybridStreams": [ "stream:descriptor for the hybrid", ... ],
  "productionSpec": {
    "tempo": "BPM range or specific value",
    "key": "key and mode",
    "timeSignature": "time signature",
    "arrangement": [
      { "section": "Intro/Verse/Chorus/Bridge/Outro etc.", "bars": integer, "description": "what happens here" }
    ],
    "instrumentStack": [ "instrument description", ... ],
    "mixingNotes": [ "mixing/mastering insight", ... ],
    "referenceArtists": [ "artist or track reference", ... ]
  },
  "uniquenessScore": integer 0-100 (how novel this hybrid is vs. existing music),
  "emotionalArc": "description of how the emotion evolves through the hybrid piece",
  "novelMusicologicalConcept": "name and explanation of the novel theoretical concept this hybrid exemplifies",
  "psychoacousticExplanation": "explain in 2-3 sentences why this hybridization works at the perceptual level, citing ASA streams, roughness curves, or equal-loudness effects"
}`;

function buildUserMessage(body: RequestBody): string {
  const { trackA, trackB, hybridizationPoint, targetEmotion, outputFormat } = body;

  return `## TRACK A: "${trackA.title}"
Description: ${trackA.description}
Emotional Profile: ${trackA.emotionalProfile.join(", ")}
Spectral Character: ${trackA.spectralDescription}
Rhythmic Pattern: ${trackA.rhythmicPattern}
Harmonic Language: ${trackA.harmonicLanguage}

## TRACK B: "${trackB.title}"
Description: ${trackB.description}
Emotional Profile: ${trackB.emotionalProfile.join(", ")}
Spectral Character: ${trackB.spectralDescription}
Rhythmic Pattern: ${trackB.rhythmicPattern}
Harmonic Language: ${trackB.harmonicLanguage}

## HYBRIDIZATION PARAMETERS
Hybridization Point: ${hybridizationPoint}
Target Emotion: ${targetEmotion}
Output Format Emphasis: ${outputFormat}

Perform the full Psychoacoustic Genome Hybridization. For the productionSpec, emphasize the "${outputFormat}" perspective. Return only the JSON object.`;
}

export async function POST(req: Request) {
  try {
    if (!(await isOrbitAdminAllowed())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 401 });
    }

    const body: RequestBody = await req.json();
    const { trackA, trackB, hybridizationPoint, targetEmotion, outputFormat } = body;

    if (!trackA || !trackB) {
      return NextResponse.json({ error: "trackA and trackB are required" }, { status: 400 });
    }
    if (!trackA.title || !trackB.title) {
      return NextResponse.json({ error: "Both tracks must have a title" }, { status: 400 });
    }
    if (!hybridizationPoint || !targetEmotion || !outputFormat) {
      return NextResponse.json(
        { error: "hybridizationPoint, targetEmotion, and outputFormat are required" },
        { status: 400 },
      );
    }

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: GENOME_SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(body) },
      ],
      temperature: 0.75,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "No response from AI model" }, { status: 500 });
    }

    let result: GenomeResponse;
    try {
      result = JSON.parse(raw) as GenomeResponse;
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response as JSON" }, { status: 500 });
    }

    if (!result.genomeA || !result.genomeB || !result.hybridGenome) {
      return NextResponse.json({ error: "Invalid genome response structure" }, { status: 500 });
    }

    result.uniquenessScore = Math.max(0, Math.min(100, Math.round(result.uniquenessScore)));

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("psychoacoustic-genome error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
