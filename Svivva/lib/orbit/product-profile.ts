import { getSiteUrl } from "@/lib/site-url";

export type ProductProfile = {
  name: string;
  tagline: string;
  url: string;
  toolsHubUrl: string;
  description: string;
  shortDescription: string;
  audience: string;
  competitors: string[];
  keywords: string[];
  pricing: string;
  category: string;
};

export function getSvivvaProductProfile(): ProductProfile {
  const base = getSiteUrl();
  return {
    name: "Svivva",
    tagline: "From seed to symphony — natural language to production AI APIs",
    url: base,
    toolsHubUrl: `${base}/ai-tools-hub`,
    description:
      "Svivva turns natural language prompts into production-ready AI APIs with schema enforcement, version control, evaluations, and a marketplace. Ship backends in minutes without hiring infrastructure engineers.",
    shortDescription:
      "Build production AI APIs from plain English. Schema-safe, versioned, and ready to scale.",
    audience: "developers, founders, and teams shipping AI products",
    competitors: ["Zapier", "Make", "n8n", "LangChain", "Retool", "Bubble"],
    keywords: ["AI API builder", "no-code AI", "GPT API", "AI automation", "AI tools"],
    pricing: "Free tier available; paid plans for production scale",
    category: "AI / Developer Tools",
  };
}
