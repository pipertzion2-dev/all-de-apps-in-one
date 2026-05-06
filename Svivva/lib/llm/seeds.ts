import { openai, DEFAULT_MODEL } from "./openai";
import type { SeedAppSpec, SeedEngineeringDocs, SeedMarketingContent } from "../schema";
import { getSiteUrl } from "@/lib/site-url";

export interface ParsedSeeds {
  success: boolean;
  seeds: SeedAppSpec[];
  error?: string;
}

const PARSE_PDF_PROMPT = `You are the Svivva Seeds PDF Parser. Your job is to analyze the text content of a structured multi-application PDF blueprint and extract each individual application specification.

Each app inside the document should follow a structured schema. Look for clear boundaries between apps (headers, delimiters, section breaks, numbered apps).

For each app found, extract:
- appName: The application name
- problemStatement: What problem it solves
- targetUsers: Who the target users are
- features: List of features
- userFlows: List of user flows/journeys
- databaseSchema: Database schema description
- apiEndpoints: List of API endpoints
- uiComponents: List of UI components
- businessModel: How it makes money
- deploymentPreferences: Deployment configuration preferences

If fields are missing, infer reasonable defaults from context.

Return JSON:
{
  "seeds": [
    {
      "appName": "...",
      "problemStatement": "...",
      "targetUsers": "...",
      "features": ["..."],
      "userFlows": ["..."],
      "databaseSchema": "...",
      "apiEndpoints": ["..."],
      "uiComponents": ["..."],
      "businessModel": "...",
      "deploymentPreferences": "..."
    }
  ]
}`;

export async function parsePdfToSeeds(pdfText: string): Promise<ParsedSeeds> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: PARSE_PDF_PROMPT },
        { role: "user", content: `Parse the following document into separate application seeds:\n\n${pdfText}` },
      ],
      response_format: { type: "json_object" },
      temperature: 1,
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { success: false, seeds: [], error: "No response from AI" };

    const parsed = JSON.parse(content);
    const seeds: SeedAppSpec[] = (parsed.seeds || []).map((s: Record<string, unknown>) => ({
      appName: String(s.appName || "Untitled App"),
      problemStatement: String(s.problemStatement || ""),
      targetUsers: String(s.targetUsers || ""),
      features: Array.isArray(s.features) ? s.features.map(String) : [],
      userFlows: Array.isArray(s.userFlows) ? s.userFlows.map(String) : [],
      databaseSchema: String(s.databaseSchema || ""),
      apiEndpoints: Array.isArray(s.apiEndpoints) ? s.apiEndpoints.map(String) : [],
      uiComponents: Array.isArray(s.uiComponents) ? s.uiComponents.map(String) : [],
      businessModel: String(s.businessModel || ""),
      deploymentPreferences: String(s.deploymentPreferences || ""),
    }));

    return { success: true, seeds };
  } catch (error) {
    console.error("Seeds PDF parse error:", error);
    return { success: false, seeds: [], error: String(error) };
  }
}

const EDIT_SEED_PROMPT = `You are the Svivva Seeds Editor. You receive an existing application specification (JSON) and a user instruction describing changes to make. Apply the user's instruction to modify the spec and return the COMPLETE updated spec.

Rules:
- Preserve all existing fields unless the user explicitly wants them changed
- Apply the changes described by the user across ALL relevant fields
- If the user asks for a new feature, add it to features, relevant apiEndpoints, uiComponents, etc.
- If the user asks to change the business model, target users, etc., update accordingly
- Always return the complete spec with all fields

Return JSON:
{
  "appName": "...",
  "problemStatement": "...",
  "targetUsers": "...",
  "features": ["..."],
  "userFlows": ["..."],
  "databaseSchema": "...",
  "apiEndpoints": ["..."],
  "uiComponents": ["..."],
  "businessModel": "...",
  "deploymentPreferences": "..."
}`;

export async function applyPromptToSeed(
  spec: SeedAppSpec,
  prompt: string
): Promise<{ success: boolean; spec: SeedAppSpec | null; error?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: EDIT_SEED_PROMPT },
        {
          role: "user",
          content: `Current spec:\n${JSON.stringify(spec, null, 2)}\n\nUser instruction:\n${prompt}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 1,
      max_tokens: 6000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { success: false, spec: null, error: "No response from AI" };

    const parsed = JSON.parse(content);
    const updatedSpec: SeedAppSpec = {
      appName: String(parsed.appName || spec.appName),
      problemStatement: String(parsed.problemStatement || spec.problemStatement),
      targetUsers: String(parsed.targetUsers || spec.targetUsers),
      features: Array.isArray(parsed.features) ? parsed.features.map(String) : spec.features,
      userFlows: Array.isArray(parsed.userFlows) ? parsed.userFlows.map(String) : spec.userFlows,
      databaseSchema: String(parsed.databaseSchema || spec.databaseSchema),
      apiEndpoints: Array.isArray(parsed.apiEndpoints) ? parsed.apiEndpoints.map(String) : spec.apiEndpoints,
      uiComponents: Array.isArray(parsed.uiComponents) ? parsed.uiComponents.map(String) : spec.uiComponents,
      businessModel: String(parsed.businessModel || spec.businessModel),
      deploymentPreferences: String(parsed.deploymentPreferences || spec.deploymentPreferences),
    };

    return { success: true, spec: updatedSpec };
  } catch (error) {
    console.error("Seeds edit error:", error);
    return { success: false, spec: null, error: String(error) };
  }
}

function seedMarketingPageSystemPrompt(): string {
  const site = getSiteUrl();
  const host = new URL(site).hostname;
  return `You are an expert SEO copywriter and growth marketer. Given a software application specification, generate a compelling, SEO-optimized landing page for it. The platform is Svivva (${site}, ${host}) — an AI-powered micro-app factory.

Return JSON:
{
  "title": "App name + tagline (5-8 words)",
  "headline": "Powerful H1 for the app (6-10 words)",
  "subheadline": "Supporting sentence under headline",
  "content": "2-3 paragraphs describing the app, the problem it solves, and why users need it",
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "howItWorks": "Step-by-step explanation paragraph of how the app works",
  "whoItsFor": "Paragraph describing the ideal user for this app",
  "faq": [{"q": "...", "a": "..."}, {"q": "...", "a": "..."}, {"q": "...", "a": "..."}, {"q": "...", "a": "..."}],
  "metaTitle": "SEO meta title under 60 chars",
  "metaDescription": "SEO meta description under 160 chars",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;
}

export interface SeedMarketingPageData {
  slug: string;
  keyword: string;
  title: string;
  headline: string;
  subheadline: string;
  content: string;
  benefits: string[];
  howItWorks: string;
  whoItsFor: string;
  metaTitle: string;
  metaDescription: string;
}

export async function generateSeedMarketingPages(
  spec: SeedAppSpec,
  seedId: string
): Promise<{ success: boolean; pages: SeedMarketingPageData[]; error?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: seedMarketingPageSystemPrompt() },
        {
          role: "user",
          content: `App: ${spec.appName}\nProblem: ${spec.problemStatement}\nTarget Users: ${spec.targetUsers}\nFeatures: ${spec.features.join(", ")}\nBusiness Model: ${spec.businessModel}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 1,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { success: false, pages: [], error: "No response from AI" };

    const g = JSON.parse(content);
    const baseSlug = spec.appName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
    const ts = Date.now().toString(36);
    const faqJson = g.faq && Array.isArray(g.faq) ? `\n\n[FAQ_JSON]${JSON.stringify(g.faq)}[/FAQ_JSON]` : "";
    const fullContent = (g.content || "") + faqJson;

    const variants = [
      { suffix: ts, keyword: spec.appName },
      { suffix: `gen-${ts}`, keyword: `${spec.appName} generator` },
      { suffix: `online-${ts}`, keyword: `${spec.appName} online` },
    ];

    const pages: SeedMarketingPageData[] = variants.map(({ suffix, keyword }) => ({
      slug: `${baseSlug}-${suffix}`,
      keyword,
      title: g.title || spec.appName,
      headline: g.headline || spec.appName,
      subheadline: g.subheadline || spec.problemStatement,
      content: fullContent,
      benefits: Array.isArray(g.benefits) ? g.benefits.map(String) : [],
      howItWorks: g.howItWorks || "",
      whoItsFor: g.whoItsFor || "",
      metaTitle: g.metaTitle || spec.appName,
      metaDescription: g.metaDescription || spec.problemStatement?.slice(0, 155) || "",
    }));

    void seedId;
    return { success: true, pages };
  } catch (error) {
    return { success: false, pages: [], error: String(error) };
  }
}

const ENGINEERING_DOCS_PROMPT = `You are an expert software architect. Given an application specification, generate comprehensive engineering documentation.

Return JSON:
{
  "apiDocumentation": "Full API documentation with endpoints, methods, request/response schemas",
  "systemArchitecture": "System architecture explanation with component diagram (text)",
  "databaseDiagram": "Database schema diagram as text description with tables, columns, relationships",
  "deploymentGuide": "Step-by-step deployment guide",
  "testingStrategy": "Testing strategy covering unit, integration, e2e tests",
  "cicdPipeline": "CI/CD pipeline explanation with stages"
}`;

export async function generateEngineeringDocs(spec: SeedAppSpec): Promise<{ success: boolean; docs: SeedEngineeringDocs | null; error?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: ENGINEERING_DOCS_PROMPT },
        { role: "user", content: `Generate engineering documentation for:\n\nApp: ${spec.appName}\nProblem: ${spec.problemStatement}\nTarget Users: ${spec.targetUsers}\nFeatures: ${spec.features.join(", ")}\nAPI Endpoints: ${spec.apiEndpoints.join(", ")}\nDatabase: ${spec.databaseSchema}\nUI Components: ${spec.uiComponents.join(", ")}` },
      ],
      response_format: { type: "json_object" },
      temperature: 1,
      max_tokens: 6000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { success: false, docs: null, error: "No response" };

    const parsed = JSON.parse(content);
    return {
      success: true,
      docs: {
        apiDocumentation: String(parsed.apiDocumentation || ""),
        systemArchitecture: String(parsed.systemArchitecture || ""),
        databaseDiagram: String(parsed.databaseDiagram || ""),
        deploymentGuide: String(parsed.deploymentGuide || ""),
        testingStrategy: String(parsed.testingStrategy || ""),
        cicdPipeline: String(parsed.cicdPipeline || ""),
      },
    };
  } catch (error) {
    return { success: false, docs: null, error: String(error) };
  }
}

const MARKETING_PROMPT = `You are an expert product marketer and startup strategist. Given an application specification, generate comprehensive marketing content.

Return JSON:
{
  "landingPageCopy": "Complete landing page copy with headline, subheading, features section, testimonial placeholders, and CTA",
  "valueProposition": "Clear, compelling value proposition statement",
  "competitiveDifferentiation": "How this product stands out from competitors",
  "investorPitchSummary": "Investor-ready pitch summary (1-2 paragraphs)",
  "appStoreDescription": "App store / product listing description",
  "launchEmailSequence": "3-email launch sequence with subject lines and body copy"
}`;

export async function generateMarketingContent(spec: SeedAppSpec): Promise<{ success: boolean; content: SeedMarketingContent | null; error?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: MARKETING_PROMPT },
        { role: "user", content: `Generate marketing content for:\n\nApp: ${spec.appName}\nProblem: ${spec.problemStatement}\nTarget Users: ${spec.targetUsers}\nFeatures: ${spec.features.join(", ")}\nBusiness Model: ${spec.businessModel}\nUnique Value: ${spec.deploymentPreferences}` },
      ],
      response_format: { type: "json_object" },
      temperature: 1,
      max_tokens: 6000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { success: false, content: null, error: "No response" };

    const parsed = JSON.parse(content);
    return {
      success: true,
      content: {
        landingPageCopy: String(parsed.landingPageCopy || ""),
        valueProposition: String(parsed.valueProposition || ""),
        competitiveDifferentiation: String(parsed.competitiveDifferentiation || ""),
        investorPitchSummary: String(parsed.investorPitchSummary || ""),
        appStoreDescription: String(parsed.appStoreDescription || ""),
        launchEmailSequence: String(parsed.launchEmailSequence || ""),
      },
    };
  } catch (error) {
    return { success: false, content: null, error: String(error) };
  }
}

const CODE_GEN_PROMPT = `You are a senior full-stack engineer. Given an application specification, generate a production-ready code scaffold.

Return JSON with file paths as keys and file content as values:
{
  "package.json": "...",
  "src/index.ts": "...",
  "src/routes.ts": "...",
  "src/db/schema.ts": "...",
  "src/components/App.tsx": "...",
  ".env.example": "...",
  "Dockerfile": "...",
  "README.md": "..."
}

Generate clean, modular, production-ready code. Use React/Next.js for frontend, Node/Express for backend, PostgreSQL for database. Include authentication scaffolding and environment configuration.`;

export async function generateCodeScaffold(spec: SeedAppSpec): Promise<{ success: boolean; code: Record<string, string> | null; error?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: CODE_GEN_PROMPT },
        { role: "user", content: `Generate a production-ready code scaffold for:\n\nApp: ${spec.appName}\nProblem: ${spec.problemStatement}\nFeatures: ${spec.features.join(", ")}\nAPI Endpoints: ${spec.apiEndpoints.join(", ")}\nDatabase Schema: ${spec.databaseSchema}\nUI Components: ${spec.uiComponents.join(", ")}\nDeployment: ${spec.deploymentPreferences}` },
      ],
      response_format: { type: "json_object" },
      temperature: 1,
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { success: false, code: null, error: "No response" };

    const parsed = JSON.parse(content);
    const code: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") code[key] = value;
    }

    return { success: true, code };
  } catch (error) {
    return { success: false, code: null, error: String(error) };
  }
}
