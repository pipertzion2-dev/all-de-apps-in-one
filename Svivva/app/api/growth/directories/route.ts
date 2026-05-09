import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { growthSubmissions } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export type Directory = {
  id: string;
  name: string;
  url: string;
  submitUrl: string;
  category: "ai_tools" | "saas" | "developer" | "pr" | "social" | "security";
  estimatedVisitors: number;
  isFree: boolean;
  products: ("svivva" | "pyracrypt" | "mini_apps")[];
  tip?: string;
};

export const ALL_DIRECTORIES: Directory[] = [
  // AI Tool Directories
  {
    id: "futurepedia",
    name: "Futurepedia",
    url: "https://www.futurepedia.io",
    submitUrl: "https://www.futurepedia.io/submit-tool",
    category: "ai_tools",
    estimatedVisitors: 500000,
    isFree: true,
    products: ["svivva", "mini_apps"],
    tip: "Largest AI directory. High DR backlink.",
  },
  {
    id: "theresanaiforthat",
    name: "There's An AI For That",
    url: "https://theresanaiforthat.com",
    submitUrl: "https://theresanaiforthat.com/submit/",
    category: "ai_tools",
    estimatedVisitors: 2000000,
    isFree: true,
    products: ["svivva", "mini_apps"],
    tip: "2M monthly visitors. One of the best.",
  },
  {
    id: "aitoolhunt",
    name: "AI Tool Hunt",
    url: "https://www.aitoolhunt.com",
    submitUrl: "https://www.aitoolhunt.com/submit",
    category: "ai_tools",
    estimatedVisitors: 150000,
    isFree: true,
    products: ["svivva", "pyracrypt", "mini_apps"],
  },
  {
    id: "toolify",
    name: "Toolify.ai",
    url: "https://www.toolify.ai",
    submitUrl: "https://www.toolify.ai/submit",
    category: "ai_tools",
    estimatedVisitors: 800000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "topai",
    name: "TopAI.tools",
    url: "https://topai.tools",
    submitUrl: "https://topai.tools/submit",
    category: "ai_tools",
    estimatedVisitors: 300000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "aitools_fyi",
    name: "AItools.fyi",
    url: "https://aitools.fyi",
    submitUrl: "https://aitools.fyi/submit",
    category: "ai_tools",
    estimatedVisitors: 200000,
    isFree: true,
    products: ["svivva", "pyracrypt", "mini_apps"],
  },
  {
    id: "aicollection",
    name: "AI Collection",
    url: "https://aicollection.com",
    submitUrl: "https://aicollection.com/en/submit-tool/",
    category: "ai_tools",
    estimatedVisitors: 100000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "insidr",
    name: "Insidr.ai",
    url: "https://www.insidr.ai",
    submitUrl: "https://www.insidr.ai/submit-ai-tool/",
    category: "ai_tools",
    estimatedVisitors: 80000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "aitoptools",
    name: "AI Top Tools",
    url: "https://aitoptools.com",
    submitUrl: "https://aitoptools.com/submit-tool/",
    category: "ai_tools",
    estimatedVisitors: 120000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "ailib",
    name: "AI Library",
    url: "https://library.phidata.com",
    submitUrl: "https://library.phidata.com/submit",
    category: "ai_tools",
    estimatedVisitors: 50000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "gpte_io",
    name: "GPTE.io",
    url: "https://gpte.io",
    submitUrl: "https://gpte.io/submit-tool",
    category: "ai_tools",
    estimatedVisitors: 70000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "easy_with_ai",
    name: "Easy With AI",
    url: "https://easywithai.com",
    submitUrl: "https://easywithai.com/submit-ai-tool/",
    category: "ai_tools",
    estimatedVisitors: 90000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "supertools",
    name: "Supertools",
    url: "https://supertools.therundown.ai",
    submitUrl: "https://supertools.therundown.ai/submit",
    category: "ai_tools",
    estimatedVisitors: 200000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "aimaster",
    name: "AI Master",
    url: "https://aimaster.cc",
    submitUrl: "https://aimaster.cc/submit",
    category: "ai_tools",
    estimatedVisitors: 40000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "aisuperstar",
    name: "AI Superstar",
    url: "https://aisuperstar.co",
    submitUrl: "https://aisuperstar.co/submit",
    category: "ai_tools",
    estimatedVisitors: 30000,
    isFree: true,
    products: ["svivva"],
  },
  // SaaS Directories
  {
    id: "producthunt",
    name: "Product Hunt",
    url: "https://www.producthunt.com",
    submitUrl: "https://www.producthunt.com/posts/new",
    category: "saas",
    estimatedVisitors: 4000000,
    isFree: true,
    products: ["svivva", "pyracrypt"],
    tip: "Biggest launch. Prep followers beforehand. Launch Tuesday–Thursday.",
  },
  {
    id: "alternativeto",
    name: "AlternativeTo",
    url: "https://alternativeto.net",
    submitUrl: "https://alternativeto.net/add-app/",
    category: "saas",
    estimatedVisitors: 5000000,
    isFree: true,
    products: ["svivva", "pyracrypt", "mini_apps"],
    tip: "List as alternative to Zapier, Make, Bubble, n8n.",
  },
  {
    id: "saashub",
    name: "SaaSHub",
    url: "https://www.saashub.com",
    submitUrl: "https://www.saashub.com/add-tool",
    category: "saas",
    estimatedVisitors: 600000,
    isFree: true,
    products: ["svivva", "pyracrypt"],
  },
  {
    id: "betalist",
    name: "BetaList",
    url: "https://betalist.com",
    submitUrl: "https://betalist.com/submit-startup",
    category: "saas",
    estimatedVisitors: 300000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "startupstash",
    name: "Startup Stash",
    url: "https://startupstash.com",
    submitUrl: "https://startupstash.com/add-listing/",
    category: "saas",
    estimatedVisitors: 200000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "g2",
    name: "G2",
    url: "https://www.g2.com",
    submitUrl: "https://sell.g2.com/",
    category: "saas",
    estimatedVisitors: 8000000,
    isFree: true,
    products: ["svivva"],
    tip: "Highest-traffic SaaS review site. Requires a few reviews to rank.",
  },
  {
    id: "capterra",
    name: "Capterra",
    url: "https://www.capterra.com",
    submitUrl: "https://www.capterra.com/vendors/sign-up",
    category: "saas",
    estimatedVisitors: 5000000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "launchingnext",
    name: "Launching Next",
    url: "https://www.launchingnext.com",
    submitUrl: "https://www.launchingnext.com/submit/",
    category: "saas",
    estimatedVisitors: 80000,
    isFree: true,
    products: ["svivva", "pyracrypt"],
  },
  {
    id: "startupbutton",
    name: "Startup Button",
    url: "https://startupbutton.com",
    submitUrl: "https://startupbutton.com/submit-startup/",
    category: "saas",
    estimatedVisitors: 30000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "getapp",
    name: "GetApp",
    url: "https://www.getapp.com",
    submitUrl: "https://www.getapp.com/add-product/",
    category: "saas",
    estimatedVisitors: 2000000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "crunchbase",
    name: "Crunchbase",
    url: "https://www.crunchbase.com",
    submitUrl: "https://www.crunchbase.com/add-new",
    category: "saas",
    estimatedVisitors: 10000000,
    isFree: true,
    products: ["svivva"],
    tip: "Must-have for startup credibility. High DR backlink.",
  },
  {
    id: "stackshare",
    name: "StackShare",
    url: "https://stackshare.io",
    submitUrl: "https://stackshare.io/settings/tool",
    category: "developer",
    estimatedVisitors: 500000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "devhunt",
    name: "DevHunt",
    url: "https://devhunt.org",
    submitUrl: "https://devhunt.org/tool/add",
    category: "developer",
    estimatedVisitors: 50000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  // Developer Communities
  {
    id: "hackernews",
    name: "Hacker News (Show HN)",
    url: "https://news.ycombinator.com",
    submitUrl: "https://news.ycombinator.com/submit",
    category: "developer",
    estimatedVisitors: 10000000,
    isFree: true,
    products: ["svivva"],
    tip: "Title must start with 'Show HN: '. Can spike 10k+ visitors in a day.",
  },
  {
    id: "devto",
    name: "DEV Community",
    url: "https://dev.to",
    submitUrl: "https://dev.to/new",
    category: "developer",
    estimatedVisitors: 5000000,
    isFree: true,
    products: ["svivva", "mini_apps"],
    tip: "Write a 'how I built this' tutorial. Ranks fast on Google.",
  },
  {
    id: "indiehackers",
    name: "Indie Hackers",
    url: "https://www.indiehackers.com",
    submitUrl: "https://www.indiehackers.com/products",
    category: "developer",
    estimatedVisitors: 1000000,
    isFree: true,
    products: ["svivva"],
    tip: "Great for milestones posts ('$X MRR in Y months').",
  },
  {
    id: "hashnode",
    name: "Hashnode",
    url: "https://hashnode.com",
    submitUrl: "https://hashnode.com/onboard",
    category: "developer",
    estimatedVisitors: 2000000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  // Social Platforms
  {
    id: "reddit_saas",
    name: "Reddit r/SaaS",
    url: "https://reddit.com/r/SaaS",
    submitUrl: "https://reddit.com/r/SaaS/submit",
    category: "social",
    estimatedVisitors: 500000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "reddit_artificial",
    name: "Reddit r/artificial",
    url: "https://reddit.com/r/artificial",
    submitUrl: "https://reddit.com/r/artificial/submit",
    category: "social",
    estimatedVisitors: 2000000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "reddit_nocode",
    name: "Reddit r/nocode",
    url: "https://reddit.com/r/nocode",
    submitUrl: "https://reddit.com/r/nocode/submit",
    category: "social",
    estimatedVisitors: 300000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "reddit_chatgpt",
    name: "Reddit r/ChatGPT",
    url: "https://reddit.com/r/ChatGPT",
    submitUrl: "https://reddit.com/r/ChatGPT/submit",
    category: "social",
    estimatedVisitors: 5000000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "reddit_machinelearning",
    name: "Reddit r/MachineLearning",
    url: "https://reddit.com/r/MachineLearning",
    submitUrl: "https://reddit.com/r/MachineLearning/submit",
    category: "social",
    estimatedVisitors: 3000000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "reddit_privacy",
    name: "Reddit r/privacy",
    url: "https://reddit.com/r/privacy",
    submitUrl: "https://reddit.com/r/privacy/submit",
    category: "social",
    estimatedVisitors: 1500000,
    isFree: true,
    products: ["pyracrypt"],
  },
  // Free PR Sites
  {
    id: "prlog",
    name: "PRLog",
    url: "https://www.prlog.org",
    submitUrl: "https://www.prlog.org/submit-press-release/",
    category: "pr",
    estimatedVisitors: 500000,
    isFree: true,
    products: ["svivva", "pyracrypt"],
    tip: "Free press releases get indexed by Google within 24h.",
  },
  {
    id: "openpr",
    name: "OpenPR",
    url: "https://www.openpr.com",
    submitUrl: "https://www.openpr.com/news/submit",
    category: "pr",
    estimatedVisitors: 200000,
    isFree: true,
    products: ["svivva", "pyracrypt"],
  },
  {
    id: "pr_com",
    name: "PR.com",
    url: "https://www.pr.com",
    submitUrl: "https://www.pr.com/press-release/submit",
    category: "pr",
    estimatedVisitors: 150000,
    isFree: true,
    products: ["svivva", "pyracrypt"],
  },
  {
    id: "newswire_free",
    name: "Newswire (Free)",
    url: "https://newswire.com",
    submitUrl: "https://newswire.com/publish-press-release/",
    category: "pr",
    estimatedVisitors: 300000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "i_newswire",
    name: "i-Newswire",
    url: "https://i-newswire.com",
    submitUrl: "https://i-newswire.com/submit.php",
    category: "pr",
    estimatedVisitors: 100000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "prfree",
    name: "PRFree",
    url: "https://prfree.org",
    submitUrl: "https://prfree.org/?q=publish",
    category: "pr",
    estimatedVisitors: 80000,
    isFree: true,
    products: ["svivva", "pyracrypt"],
  },
  // Security/Privacy (Pyracrypt-focused)
  {
    id: "privacytools",
    name: "PrivacyTools.io",
    url: "https://www.privacytools.io",
    submitUrl: "https://github.com/privacytools/privacytools.io/issues/new",
    category: "security",
    estimatedVisitors: 1000000,
    isFree: true,
    products: ["pyracrypt"],
    tip: "Getting listed here is a massive trust signal for encryption tools.",
  },
  {
    id: "prism_break",
    name: "PRISM Break",
    url: "https://prism-break.org",
    submitUrl: "https://github.com/nylira/prism-break/issues/new",
    category: "security",
    estimatedVisitors: 500000,
    isFree: true,
    products: ["pyracrypt"],
  },
  {
    id: "securitynewsletter",
    name: "Security Newsletter",
    url: "https://securitynewsletter.co",
    submitUrl: "https://securitynewsletter.co/submit",
    category: "security",
    estimatedVisitors: 50000,
    isFree: true,
    products: ["pyracrypt"],
  },
  {
    id: "fossbytes",
    name: "Fossbytes",
    url: "https://fossbytes.com",
    submitUrl: "https://fossbytes.com/contact/",
    category: "security",
    estimatedVisitors: 3000000,
    isFree: true,
    products: ["pyracrypt"],
    tip: "Pitch them a guest post about browser encryption.",
  },
  {
    id: "ghacks",
    name: "gHacks",
    url: "https://www.ghacks.net",
    submitUrl: "https://www.ghacks.net/contact/",
    category: "security",
    estimatedVisitors: 2000000,
    isFree: true,
    products: ["pyracrypt"],
  },
  // More AI Tools
  {
    id: "aitrendz",
    name: "AiTrendz",
    url: "https://aitrendz.xyz",
    submitUrl: "https://aitrendz.xyz/submit",
    category: "ai_tools",
    estimatedVisitors: 20000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "nextgentools",
    name: "NextGen Tools",
    url: "https://nextgentools.me",
    submitUrl: "https://nextgentools.me/submit-tool",
    category: "ai_tools",
    estimatedVisitors: 25000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "ainavigator",
    name: "AI Navigator",
    url: "https://ai-navigator.net",
    submitUrl: "https://ai-navigator.net/submit",
    category: "ai_tools",
    estimatedVisitors: 30000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "ainave",
    name: "AI Nave",
    url: "https://ainave.com",
    submitUrl: "https://ainave.com/submit",
    category: "ai_tools",
    estimatedVisitors: 15000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "aitoolsdirectory",
    name: "AI Tools Directory",
    url: "https://aitoolsdirectory.com",
    submitUrl: "https://aitoolsdirectory.com/submit",
    category: "ai_tools",
    estimatedVisitors: 40000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "aitools_wiki",
    name: "AI Tools Wiki",
    url: "https://www.aitools.wiki",
    submitUrl: "https://www.aitools.wiki/submit",
    category: "ai_tools",
    estimatedVisitors: 10000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "aipedia",
    name: "AI Pedia Hub",
    url: "https://aipediahub.com",
    submitUrl: "https://aipediahub.com/submit-tool/",
    category: "ai_tools",
    estimatedVisitors: 20000,
    isFree: true,
    products: ["svivva", "mini_apps"],
  },
  {
    id: "madewithml",
    name: "Made With ML",
    url: "https://madewithml.com",
    submitUrl: "https://madewithml.com/projects/submit/",
    category: "developer",
    estimatedVisitors: 500000,
    isFree: true,
    products: ["svivva"],
  },
  {
    id: "medium",
    name: "Medium",
    url: "https://medium.com",
    submitUrl: "https://medium.com/new-story",
    category: "social",
    estimatedVisitors: 200000000,
    isFree: true,
    products: ["svivva", "pyracrypt", "mini_apps"],
    tip: "Write a tutorial. Medium articles rank on Google within days.",
  },
  {
    id: "quora",
    name: "Quora",
    url: "https://www.quora.com",
    submitUrl: "https://www.quora.com/answer",
    category: "social",
    estimatedVisitors: 300000000,
    isFree: true,
    products: ["svivva", "pyracrypt"],
    tip: "Answer questions about AI APIs. Each answer is a backlink.",
  },
];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const product = req.nextUrl.searchParams.get("product") as
    | "svivva"
    | "pyracrypt"
    | "mini_apps"
    | null;

  const submissions = await db
    .select()
    .from(growthSubmissions)
    .orderBy(growthSubmissions.createdAt);

  const dirs = product
    ? ALL_DIRECTORIES.filter((d) => d.products.includes(product))
    : ALL_DIRECTORIES;

  const result = dirs.map((d) => {
    const sub = submissions.find(
      (s) => s.directoryId === d.id && (!product || s.product === product),
    );
    return {
      ...d,
      status: sub?.status ?? "pending",
      submittedAt: sub?.submittedAt ?? null,
      liveUrl: sub?.liveUrl ?? null,
    };
  });

  const submitted = result.filter((d) => d.status !== "pending").length;
  const live = result.filter((d) => d.status === "live").length;

  return NextResponse.json({
    directories: result,
    stats: { total: result.length, submitted, live },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { directoryId, product, status, liveUrl, notes } = await req.json();

  const existing = await db
    .select({ id: growthSubmissions.id })
    .from(growthSubmissions)
    .where(
      and(eq(growthSubmissions.directoryId, directoryId), eq(growthSubmissions.product, product)),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(growthSubmissions)
      .set({
        status,
        liveUrl: liveUrl || null,
        notes: notes || null,
        submittedAt: status !== "pending" ? new Date() : null,
      })
      .where(
        and(eq(growthSubmissions.directoryId, directoryId), eq(growthSubmissions.product, product)),
      );
  } else {
    await db.insert(growthSubmissions).values({
      directoryId,
      product,
      status,
      liveUrl: liveUrl || null,
      notes: notes || null,
      submittedAt: status !== "pending" ? new Date() : null,
    });
  }

  return NextResponse.json({ success: true });
}
