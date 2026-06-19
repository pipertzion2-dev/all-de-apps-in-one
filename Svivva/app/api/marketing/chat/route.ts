import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getPrimaryAdminUserId, hasAdminAccess } from "@/lib/auth/admin";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { sql, like } from "drizzle-orm";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

async function callInternal(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-admin": getPrimaryAdminUserId() || "",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function getStatus() {
  try {
    const [pages, posts] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(seoLandingPages)
        .where(like(seoLandingPages.toolUrl, "replit:%")),
      db.select({ count: sql<number>`count(*)` }).from(seoLandingPages),
    ]);
    return { miniAppPages: Number(pages[0]?.count || 0), totalPages: Number(posts[0]?.count || 0) };
  } catch {
    return { miniAppPages: 0, totalPages: 0 };
  }
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "run_autopilot",
      description:
        "Run the AI content autopilot to auto-generate SEO landing pages and blog articles and submit them to search engines. Use when user wants to create content, run autopilot, generate pages/posts, or grow traffic.",
      parameters: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["conservative", "balanced", "aggressive"],
            description: "How many pieces of content to create. Default: balanced.",
          },
          reply: {
            type: "string",
            description: "Friendly 1-sentence confirmation of what you're about to do.",
          },
        },
        required: ["mode", "reply"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "setup_indexnow",
      description:
        "Set up IndexNow to get pages indexed on Bing and Yandex, or submit all URLs. Use when user mentions Bing, Yandex, IndexNow, getting indexed, or search engine submission.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["setup", "submit", "both"],
            description: "setup = generate key, submit = submit all URLs, both = do both.",
          },
          reply: { type: "string", description: "Friendly 1-sentence confirmation." },
        },
        required: ["action", "reply"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_mini_apps",
      description:
        "Generate 50 individual SEO marketing pages for a Replit app's tools/features. Use when user mentions generating pages for their app, seeds, mini-apps, tools, or 50 pages.",
      parameters: {
        type: "object",
        properties: {
          appName: {
            type: "string",
            description: "Name of the app. Extract from user message or default to 'Svivva Seeds'.",
          },
          appUrl: { type: "string", description: "URL of the app. Extract from user message." },
          replId: {
            type: "string",
            description:
              "Identifier for the repl. Extract slug from URL or use a sanitized appName.",
          },
          appDescription: {
            type: "string",
            description:
              "What the app does. Extract from user message or generate a reasonable description based on the appName.",
          },
          count: { type: "number", description: "Number of mini-apps to discover. Default 50." },
          reply: {
            type: "string",
            description: "Friendly confirmation of what you're about to do.",
          },
        },
        required: ["appName", "appUrl", "replId", "appDescription", "count", "reply"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_social",
      description:
        "Generate social media posts (Twitter, LinkedIn, Reddit) for recent pages. Use when user asks for social posts, tweets, LinkedIn content, or Reddit posts.",
      parameters: {
        type: "object",
        properties: {
          reply: { type: "string", description: "Friendly 1-sentence confirmation." },
        },
        required: ["reply"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_comparisons",
      description:
        "Generate 'Tool vs Competitor' comparison pages for the top mini-apps. Use when user mentions comparisons, vs pages, competitors.",
      parameters: {
        type: "object",
        properties: {
          competitors: {
            type: "array",
            items: { type: "string" },
            description: "List of competitor names. Extract from user message or use defaults.",
          },
          replId: {
            type: "string",
            description: "replId to generate comparisons for. Default: svivva-seeds.",
          },
          reply: { type: "string", description: "Friendly 1-sentence confirmation." },
        },
        required: ["competitors", "replId", "reply"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_status",
      description:
        "Show current marketing status, stats, and what's set up. Use when user asks what's done, status, progress, how many pages, etc.",
      parameters: {
        type: "object",
        properties: {
          reply: { type: "string", description: "Friendly intro to the status report." },
        },
        required: ["reply"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "give_advice",
      description:
        "Answer a general question about marketing strategy, explain what something does, or give advice. Use when no specific action is requested.",
      parameters: {
        type: "object",
        properties: {
          response: {
            type: "string",
            description: "A clear, helpful, concise answer (2-4 sentences max).",
          },
        },
        required: ["response"],
      },
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { message, history = [], context = {} } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const connStatus = [
      context.hasGodaddy
        ? `✓ GoDaddy connected (${context.godaddyDomain || "domain set"})`
        : "✗ GoDaddy not connected",
      context.hasGoogle
        ? "✓ Google Search Console connected"
        : "✗ Google Search Console not connected",
    ].join(" | ");

    // Build conversation for OpenAI
    const messages = [
      {
        role: "system" as const,
        content: `You are the Svivva Marketing AI — a smart, concise assistant that helps grow traffic for Svivva (an AI SaaS platform). You take action immediately when the user asks. You are friendly but brief.

Current service connections: ${connStatus}

When giving advice, reference what's connected and what isn't. If GoDaddy is connected, mention that DNS records can be created automatically. If Google is not connected, mention they should add their site URL in the Traffic Connections panel above.

When the user gives you an app URL or name, extract it accurately. If they say "my app" without details, ask for the app URL. Always prefer taking action over asking clarifying questions unless you truly cannot proceed.`,
      },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "required",
    });

    const choice = response.choices[0];
    const toolCall = choice.message.tool_calls?.[0];
    if (!toolCall)
      return NextResponse.json({
        reply:
          "I couldn't understand that. Try asking me to generate pages, run autopilot, or check your status.",
        action: null,
      });

    const fn = (toolCall as any).function?.name;
    const args = JSON.parse((toolCall as any).function?.arguments || "{}");

    // ── Execute actions ──────────────────────────────────────────────────────
    if (fn === "give_advice") {
      return NextResponse.json({ reply: args.response, action: { type: "advice" } });
    }

    if (fn === "check_status") {
      const status = await getStatus();
      return NextResponse.json({
        reply: args.reply,
        action: {
          type: "status",
          data: { miniAppPages: status.miniAppPages, totalPages: status.totalPages },
        },
      });
    }

    if (fn === "setup_indexnow") {
      let setupResult = null;
      let submitResult = null;
      const errors: string[] = [];

      if (args.action === "setup" || args.action === "both") {
        try {
          const res = await fetch(`${BASE_URL}/api/marketing/google-search`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: req.headers.get("cookie") || "",
            },
            body: JSON.stringify({ action: "indexnow-setup" }),
          });
          setupResult = await res.json();
        } catch (e) {
          errors.push("Setup failed: " + String(e));
        }
      }
      if (args.action === "submit" || args.action === "both") {
        try {
          const res = await fetch(`${BASE_URL}/api/marketing/google-search`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: req.headers.get("cookie") || "",
            },
            body: JSON.stringify({ action: "indexnow-submit" }),
          });
          submitResult = await res.json();
        } catch (e) {
          errors.push("Submit failed: " + String(e));
        }
      }

      const successMsg = [
        setupResult && !setupResult.error ? "IndexNow key generated" : null,
        submitResult?.success
          ? `${submitResult.count || "all"} URLs submitted to Bing & Yandex`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

      return NextResponse.json({
        reply: args.reply,
        action: {
          type: "indexnow",
          success: !errors.length,
          message: successMsg || errors.join("; "),
          submitted: submitResult?.count || 0,
        },
      });
    }

    if (fn === "run_autopilot") {
      const res = await fetch(`${BASE_URL}/api/marketing/ai-autopilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({ action: "run-autopilot", mode: args.mode }),
      });
      const data = await res.json();
      return NextResponse.json({
        reply: args.reply,
        action: {
          type: "autopilot",
          success: data.success,
          created: data.created || 0,
          errors: data.errors || 0,
          indexnow: data.indexnow,
          message: data.message,
          log: (data.log || []).slice(0, 8),
        },
      });
    }

    if (fn === "generate_social") {
      const res = await fetch(`${BASE_URL}/api/marketing/ai-autopilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({ action: "generate-social-batch" }),
      });
      const data = await res.json();
      return NextResponse.json({
        reply: args.reply,
        action: { type: "social", posts: (data.posts || []).slice(0, 6) },
      });
    }

    if (fn === "generate_mini_apps") {
      // Step 1: discover app names with AI
      const discoverRes = await fetch(`${BASE_URL}/api/marketing/mini-apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({
          action: "ai-discover-apps",
          appName: args.appName,
          appUrl: args.appUrl,
          appDescription: args.appDescription,
          count: args.count,
        }),
      });
      const discovered = await discoverRes.json();
      const apps = (discovered.apps || []).slice(0, args.count);

      if (!apps.length) {
        return NextResponse.json({
          reply:
            "I couldn't discover your app's tools. Can you tell me more about what tools your app has?",
          action: { type: "error" },
        });
      }

      // Step 2: generate first batch (5) immediately, return progress + total to generate
      const batchRes = await fetch(`${BASE_URL}/api/marketing/mini-apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({
          action: "generate-pages-batch",
          apps,
          replId: args.replId,
          replTitle: args.appName,
          replUrl: args.appUrl,
          batchStart: 0,
          batchSize: 5,
        }),
      });
      const batchData = await batchRes.json();

      return NextResponse.json({
        reply: args.reply,
        action: {
          type: "mini_apps",
          appName: args.appName,
          appUrl: args.appUrl,
          replId: args.replId,
          totalApps: apps.length,
          apps,
          firstBatch: batchData.created || [],
          indexnow: batchData.indexnow,
          remaining: batchData.remaining,
          message: `Discovered ${apps.length} mini-apps. First 5 pages generated${batchData.indexnow?.submitted ? " and submitted to Bing/Yandex" : ""}. ${batchData.remaining} pages remaining — open the wizard to generate the rest.`,
        },
      });
    }

    if (fn === "generate_comparisons") {
      // Get existing mini-app pages for this replId
      const pages = await db
        .select({ slug: seoLandingPages.slug, title: seoLandingPages.title })
        .from(seoLandingPages)
        .where(like(seoLandingPages.toolUrl, `replit:${args.replId}:%`))
        .limit(10);

      if (!pages.length) {
        return NextResponse.json({
          reply:
            "I need some mini-app pages first. Ask me to generate your mini-app pages before creating comparisons.",
          action: { type: "info" },
        });
      }

      const fakeApps = pages.map((p) => ({
        name: p.title,
        path: `/${p.slug}`,
        description: p.title,
      }));
      const res = await fetch(`${BASE_URL}/api/marketing/mini-apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({
          action: "generate-comparison-pages",
          apps: fakeApps,
          replId: args.replId,
          replTitle: "Svivva Seeds",
          replUrl: BASE_URL,
          competitors: args.competitors,
        }),
      });
      const data = await res.json();

      return NextResponse.json({
        reply: args.reply,
        action: {
          type: "comparisons",
          created: data.created || [],
          total: data.total || 0,
          indexnow: data.indexnow,
        },
      });
    }

    return NextResponse.json({
      reply:
        "I'm not sure how to handle that. Try asking me to generate pages, run autopilot, or check your status.",
      action: null,
    });
  } catch (e) {
    console.error("Marketing chat error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
