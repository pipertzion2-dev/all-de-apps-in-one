import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PromptForge — Free AI Prompt Testing Tool | Svivva",
  description: "Test and refine AI prompts instantly with GPT-4o, GPT-4o mini, and GPT-4 Turbo. Free prompt playground — no signup, no API key. See tokens, latency, and cost per run.",
  openGraph: {
    title: "PromptForge — Free AI Prompt Testing Tool",
    description: "Test AI prompts with GPT-4o, see token counts and costs, then deploy to production with Svivva.",
    type: "website",
  },
  keywords: ["prompt testing tool", "ai prompt playground", "test ai prompts", "gpt-4o playground", "prompt tester free", "ai prompt generator"],
};

export default function PromptForgeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
