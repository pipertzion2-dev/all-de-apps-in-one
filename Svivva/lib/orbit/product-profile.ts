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
    name: "ZZAI",
    tagline: "From seed to symphony — natural language to production AI APIs",
    url: base,
    toolsHubUrl: `${base}/ai-tools-hub`,
    description:
      "ZZAI turns natural language prompts into production-ready AI APIs with schema enforcement, version control, evaluations, and a marketplace. ZZAI Security embeds feed filtering, threat scanning, and the former Pyracrypt suite — plus YouTube-to-seeds and Orbit hybrid growth automation.",
    shortDescription:
      "Build production AI APIs from plain English. Security, seeds, and marketing on one domain.",
    audience: "developers, founders, and teams shipping AI products",
    competitors: ["Zapier", "Make", "n8n", "LangChain", "Retool", "Bubble"],
    keywords: [
      "ZZAI",
      "zzaizzai",
      "AI API builder",
      "no-code AI",
      "GPT API",
      "AI automation",
      "ZZAI Security",
      "SaaS marketing automation",
    ],
    pricing: "Free tier available; paid plans for production scale",
    category: "AI / Developer Tools",
  };
}
