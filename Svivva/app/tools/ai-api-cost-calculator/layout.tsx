import type { Metadata } from "next";
import { nativeToolMetadata } from "@/lib/tools/native-tool-meta";

export const metadata: Metadata = nativeToolMetadata({
  path: "/tools/ai-api-cost-calculator",
  title: "AI API Cost Calculator | ZZAI",
  description:
    "Estimate token spend across GPT-4o, Claude, Gemini, and other models. Compare input/output pricing before you deploy on ZZAI.",
  keywords: [
    "ai api cost calculator",
    "llm pricing calculator",
    "token cost estimator",
    "gpt-4o pricing",
    "openai cost calculator",
  ],
});

export default function AiApiCostCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
