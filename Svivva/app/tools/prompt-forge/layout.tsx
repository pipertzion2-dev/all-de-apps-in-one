import type { Metadata } from "next";
import { nativeToolMetadata } from "@/lib/tools/native-tool-meta";

export const metadata: Metadata = nativeToolMetadata({
  path: "/tools/prompt-forge",
  title: "PromptForge | ZZAI",
  description:
    "Test and refine prompts with GPT-4o, GPT-4o mini, and GPT-4 Turbo. Free playground — no signup, no API key. See tokens, latency, and cost per run.",
  keywords: [
    "prompt testing tool",
    "ai prompt playground",
    "test ai prompts",
    "gpt-4o playground",
    "prompt tester free",
    "ai prompt generator",
  ],
});

export default function PromptForgeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
