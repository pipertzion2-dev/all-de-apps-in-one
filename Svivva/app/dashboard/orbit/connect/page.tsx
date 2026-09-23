"use client";

import { OrbitSeoAiConnect } from "@/components/orbit-seo-ai-connect";

/** Shareable admin link: wire OpenAI/Gemini + GSC for Orbit SEO. */
export default function OrbitSeoConnectPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <OrbitSeoAiConnect />
    </div>
  );
}
