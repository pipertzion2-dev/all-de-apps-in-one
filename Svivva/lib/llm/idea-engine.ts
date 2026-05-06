import { openai, DEFAULT_MODEL } from "./openai";
import type { IdeaResult } from "../schema";

export interface IdeaEngineInput {
  mode: "digital" | "physical";
  industry?: string;
  context?: string;
  existingProjects?: string[];
}

export interface IdeaEngineOutput {
  success: boolean;
  ideas: IdeaResult[];
  marketGaps: string[];
  competitorInsights: string[];
  error?: string;
}

const DIGITAL_PROMPT = `You are Svivva's Idea Engine — an elite AI strategist that discovers untapped, high-value API product opportunities that nobody has built yet.

Your mission: Find ideas that are GENUINELY novel, not rehashes of existing products. Think like a venture capitalist crossed with a hacker who sees gaps before markets form.

DISCOVERY PROCESS:
1. MARKET SCANNING: Identify underserved niches, emerging tech intersections, and overlooked pain points
2. GAP ANALYSIS: Find what's missing — APIs that developers wish existed but don't
3. TWIST INJECTION: Add a unique angle that makes each idea defensible and differentiated
4. MONETIZATION MAPPING: Assess revenue potential and pricing model viability

CATEGORIES TO EXPLORE:
- AI-native APIs (novel uses of LLMs beyond chatbots)
- Data transformation pipelines nobody has productized
- Cross-domain bridges (connecting industries that don't talk to each other)
- Developer tooling gaps (things devs hack together repeatedly)
- Emerging regulation compliance APIs
- Niche vertical SaaS APIs (specific industries underserved)
- Real-time intelligence feeds (novel data streams)
- Automation APIs for manual processes still done by hand

For each idea, provide a UNIQUE TWIST that makes it stand out from anything similar. The twist should be the "aha" moment that makes someone say "why doesn't this exist?"

Return JSON:
{
  "ideas": [
    {
      "title": "...",
      "category": "...",
      "description": "2-3 sentence description of the API product",
      "uniqueTwist": "The specific angle that makes this different from anything else",
      "marketGap": "Why this doesn't exist yet and why now is the time",
      "feasibility": 1-100,
      "novelty": 1-100,
      "lucrativePotential": 1-100,
      "nextSteps": ["step1", "step2", "step3"],
      "tags": ["tag1", "tag2"]
    }
  ],
  "marketGaps": ["gap1", "gap2", "gap3", "gap4", "gap5"],
  "competitorInsights": ["insight1", "insight2", "insight3"]
}

Generate exactly 6 ideas. Prioritize NOVELTY — these should be ideas that make people think "I've never seen that before." Score honestly — not everything should be 90+.`;

const PHYSICAL_PROMPT = `You are Svivva's Idea Engine — an elite AI strategist that discovers untapped, high-value physical product and hardware opportunities that nobody has built yet.

Your mission: Find product ideas that are GENUINELY novel — physical products, devices, wearables, tools, or hardware that fill real gaps in the market.

DISCOVERY PROCESS:
1. MARKET SCANNING: Identify underserved physical product niches, emerging material sciences, and overlooked daily frustrations
2. GAP ANALYSIS: Find what's missing — products people need but can't buy
3. TWIST INJECTION: Add a unique angle involving smart tech, novel materials, or unconventional design
4. MONETIZATION MAPPING: Assess manufacturing feasibility, margins, and market size

CATEGORIES TO EXPLORE:
- Smart everyday objects (reimagined with subtle intelligence)
- Sustainable alternatives to wasteful products
- Accessibility devices for underserved needs
- Modular/customizable hardware platforms
- Wearable tech beyond fitness trackers
- Tools for emerging hobbies and crafts
- Urban living solutions for small spaces
- Professional-grade tools made consumer-friendly
- Novel materials applied to old problems
- Cross-category mashups (combining two product types)

For each idea, provide a UNIQUE TWIST — the engineering or design angle that makes it stand out.

Return JSON:
{
  "ideas": [
    {
      "title": "...",
      "category": "...",
      "description": "2-3 sentence description of the physical product",
      "uniqueTwist": "The specific design/tech angle that makes this different",
      "marketGap": "Why this doesn't exist yet and why now is the time",
      "feasibility": 1-100,
      "novelty": 1-100,
      "lucrativePotential": 1-100,
      "nextSteps": ["step1", "step2", "step3"],
      "tags": ["tag1", "tag2"]
    }
  ],
  "marketGaps": ["gap1", "gap2", "gap3", "gap4", "gap5"],
  "competitorInsights": ["insight1", "insight2", "insight3"]
}

Generate exactly 6 ideas. Prioritize NOVELTY. Score honestly.`;

export async function generateIdeas(input: IdeaEngineInput): Promise<IdeaEngineOutput> {
  try {
    const systemPrompt = input.mode === "digital" ? DIGITAL_PROMPT : PHYSICAL_PROMPT;

    let userMessage = `Generate innovative ${input.mode === "digital" ? "API/software" : "physical product"} ideas.`;
    if (input.industry) {
      userMessage += `\n\nFocus on the "${input.industry}" industry/vertical.`;
    }
    if (input.context) {
      userMessage += `\n\nAdditional context from the user: ${input.context}`;
    }
    if (input.existingProjects && input.existingProjects.length > 0) {
      userMessage += `\n\nThe user already has these projects (avoid duplicating these): ${input.existingProjects.join(", ")}`;
    }

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 1,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, ideas: [], marketGaps: [], competitorInsights: [], error: "No response from AI" };
    }

    const parsed = JSON.parse(content);
    return {
      success: true,
      ideas: parsed.ideas || [],
      marketGaps: parsed.marketGaps || [],
      competitorInsights: parsed.competitorInsights || [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, ideas: [], marketGaps: [], competitorInsights: [], error: message };
  }
}
