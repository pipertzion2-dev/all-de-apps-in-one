import { NextRequest, NextResponse } from "next/server";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { projectRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { projectBrands } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const SuggestionRequestSchema = z.object({
  type: z.enum(["names", "icons", "palettes", "questions", "complete"]),
  context: z
    .object({
      prompt: z.string().optional(),
      category: z.string().optional(),
      personality: z.string().optional(),
      existingAnswers: z.record(z.unknown()).optional(),
    })
    .optional(),
});

const ICON_OPTIONS = [
  "Zap",
  "Brain",
  "Sparkles",
  "Target",
  "Rocket",
  "Shield",
  "Globe",
  "Code",
  "MessageSquare",
  "Image",
  "FileText",
  "BarChart",
  "Database",
  "Lock",
  "Cpu",
  "Layers",
  "Bot",
  "Wand2",
  "Flame",
  "Heart",
  "Star",
  "Gem",
  "Crown",
  "Trophy",
  "Lightbulb",
  "Compass",
  "Anchor",
  "Feather",
];

const PALETTE_PRESETS = [
  { name: "Ocean", colors: { primary: "#0EA5E9", secondary: "#06B6D4", accent: "#22D3EE" } },
  { name: "Sunset", colors: { primary: "#F97316", secondary: "#FB923C", accent: "#FBBF24" } },
  { name: "Forest", colors: { primary: "#22C55E", secondary: "#10B981", accent: "#34D399" } },
  { name: "Lavender", colors: { primary: "#8B5CF6", secondary: "#A78BFA", accent: "#C4B5FD" } },
  { name: "Rose", colors: { primary: "#EC4899", secondary: "#F472B6", accent: "#F9A8D4" } },
  { name: "Vivva", colors: { primary: "#5BA8A0", secondary: "#6B2C4A", accent: "#7BA3AC" } },
  { name: "Midnight", colors: { primary: "#3B82F6", secondary: "#1D4ED8", accent: "#60A5FA" } },
  { name: "Earth", colors: { primary: "#78716C", secondary: "#A8A29E", accent: "#D6D3D1" } },
];

const ONBOARDING_QUESTIONS = [
  {
    id: "purpose",
    question: "What will your API do?",
    options: [
      {
        value: "analyze",
        label: "Analyze & Extract",
        icon: "Brain",
        description: "Process text, images, or data to extract insights",
      },
      {
        value: "generate",
        label: "Generate & Create",
        icon: "Sparkles",
        description: "Create content, text, images, or code",
      },
      {
        value: "classify",
        label: "Classify & Categorize",
        icon: "Target",
        description: "Sort and label data into categories",
      },
      {
        value: "transform",
        label: "Transform & Convert",
        icon: "Wand2",
        description: "Convert between formats or restructure data",
      },
    ],
  },
  {
    id: "domain",
    question: "What domain does it serve?",
    options: [
      { value: "business", label: "Business & Enterprise", icon: "Briefcase" },
      { value: "creative", label: "Creative & Content", icon: "Palette" },
      { value: "developer", label: "Developer Tools", icon: "Code" },
      { value: "data", label: "Data & Analytics", icon: "BarChart" },
      { value: "communication", label: "Communication", icon: "MessageSquare" },
      { value: "health", label: "Health & Wellness", icon: "Heart" },
    ],
  },
  {
    id: "personality",
    question: "What personality should your API have?",
    options: [
      {
        value: "professional",
        label: "Professional",
        icon: "Briefcase",
        description: "Formal, precise, business-focused",
      },
      {
        value: "friendly",
        label: "Friendly",
        icon: "Smile",
        description: "Warm, approachable, conversational",
      },
      {
        value: "technical",
        label: "Technical",
        icon: "Cpu",
        description: "Detailed, accurate, developer-oriented",
      },
      {
        value: "creative",
        label: "Creative",
        icon: "Palette",
        description: "Imaginative, expressive, artistic",
      },
    ],
  },
];

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, context } = SuggestionRequestSchema.parse(body);

    switch (type) {
      case "names": {
        const prompt = context?.prompt || project.systemPrompt;
        const names = await generateNameSuggestions(prompt, context?.category);
        return NextResponse.json({ suggestions: names });
      }

      case "icons": {
        const prompt = context?.prompt || project.systemPrompt;
        const icons = await generateIconSuggestions(prompt, context?.category);
        return NextResponse.json({ suggestions: icons });
      }

      case "palettes": {
        const personality = context?.personality || "professional";
        const palettes = generatePaletteSuggestions(personality);
        return NextResponse.json({ suggestions: palettes });
      }

      case "questions": {
        const answers = context?.existingAnswers || {};
        const nextQuestion = getNextQuestion(answers);
        return NextResponse.json({ question: nextQuestion, allQuestions: ONBOARDING_QUESTIONS });
      }

      case "complete": {
        const answers = context?.existingAnswers || {};
        const prompt = context?.prompt || project.systemPrompt;
        const branding = await generateCompleteBranding(prompt, answers);

        const existingBrand = await db
          .select()
          .from(projectBrands)
          .where(eq(projectBrands.projectId, projectId))
          .limit(1);

        if (existingBrand.length > 0) {
          await db
            .update(projectBrands)
            .set({
              suggestedNames: branding.names,
              suggestedIcons: branding.icons,
              suggestedPalettes: branding.palettes,
              category: answers.domain as string,
              personality: answers.personality as string,
              onboardingAnswers: answers,
              updatedAt: new Date(),
            })
            .where(eq(projectBrands.projectId, projectId));
        } else {
          await db.insert(projectBrands).values({
            id: uuidv4(),
            projectId,
            suggestedNames: branding.names,
            suggestedIcons: branding.icons,
            suggestedPalettes: branding.palettes,
            category: answers.domain as string,
            personality: answers.personality as string,
            onboardingAnswers: answers,
          });
        }

        return NextResponse.json({ branding });
      }

      default:
        return NextResponse.json({ error: "Invalid suggestion type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Suggestion error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate suggestions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {
    const brand = await db
      .select()
      .from(projectBrands)
      .where(eq(projectBrands.projectId, projectId))
      .limit(1);

    if (brand.length === 0) {
      return NextResponse.json({
        brand: null,
        questions: ONBOARDING_QUESTIONS,
        iconOptions: ICON_OPTIONS,
        palettePresets: PALETTE_PRESETS,
      });
    }

    return NextResponse.json({
      brand: brand[0],
      questions: ONBOARDING_QUESTIONS,
      iconOptions: ICON_OPTIONS,
      palettePresets: PALETTE_PRESETS,
    });
  } catch (error) {
    console.error("Get brand error:", error);
    return NextResponse.json({ error: "Failed to get brand data" }, { status: 500 });
  }
}

async function generateNameSuggestions(prompt: string, category?: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a creative API naming expert. Generate 6 unique, memorable API brand names based on the given prompt and category. Names should be:
- Short (1-2 words)
- Easy to pronounce
- Professional yet memorable
- Relevant to the API's purpose
Return ONLY a JSON array of 6 name strings, no explanation.`,
      },
      {
        role: "user",
        content: `API Purpose: ${prompt}\n${category ? `Category: ${category}` : ""}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  try {
    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    return (
      parsed.names || ["API Pro", "DataFlow", "SmartAPI", "IntelliCore", "NexusAI", "PulseAPI"]
    );
  } catch {
    return ["API Pro", "DataFlow", "SmartAPI", "IntelliCore", "NexusAI", "PulseAPI"];
  }
}

async function generateIconSuggestions(prompt: string, category?: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an icon selection expert. Based on the API purpose and category, select the 6 most relevant icons from this list: ${ICON_OPTIONS.join(", ")}.
Return ONLY a JSON object with an "icons" array of 6 icon names from the list.`,
      },
      {
        role: "user",
        content: `API Purpose: ${prompt}\n${category ? `Category: ${category}` : ""}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  try {
    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.icons || ["Zap", "Brain", "Sparkles", "Code", "Rocket", "Target"];
  } catch {
    return ["Zap", "Brain", "Sparkles", "Code", "Rocket", "Target"];
  }
}

function generatePaletteSuggestions(personality: string): typeof PALETTE_PRESETS {
  const personalityPalettes: Record<string, string[]> = {
    professional: ["Midnight", "Ocean", "Earth"],
    friendly: ["Ocean", "Sunset", "Forest"],
    technical: ["Midnight", "Vivva", "Lavender"],
    creative: ["Lavender", "Rose", "Sunset"],
  };

  const preferred = personalityPalettes[personality] || personalityPalettes.professional;
  const sorted = [...PALETTE_PRESETS].sort((a, b) => {
    const aIndex = preferred.indexOf(a.name);
    const bIndex = preferred.indexOf(b.name);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return sorted;
}

function getNextQuestion(
  answers: Record<string, unknown>,
): (typeof ONBOARDING_QUESTIONS)[0] | null {
  for (const question of ONBOARDING_QUESTIONS) {
    if (!(question.id in answers)) {
      return question;
    }
  }
  return null;
}

async function generateCompleteBranding(prompt: string, answers: Record<string, unknown>) {
  const [names, icons] = await Promise.all([
    generateNameSuggestions(prompt, answers.domain as string),
    generateIconSuggestions(prompt, answers.domain as string),
  ]);

  const palettes = generatePaletteSuggestions((answers.personality as string) || "professional");

  return {
    names,
    icons,
    palettes,
  };
}
