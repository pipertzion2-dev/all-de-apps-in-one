"use client";

import { JsonLd } from "@/components/seo/json-ld";
import { faqPageSchema, howToSchema } from "@/lib/seo/schema/builders";

const FAQ_ITEMS = [
  {
    q: "What is ZZAI?",
    a: "From seed to symphony: ZZAI turns plain-language intent into shipped product — with validation, evaluations, versioning, and rollback so quality does not drift.",
  },
  {
    q: "How long does it take to ship with ZZAI?",
    a: "Most teams get a working, tested endpoint live quickly. Describe what you need, define the output schema, deploy — ZZAI handles validation, rollback, and ops.",
  },
  {
    q: "Does ZZAI work with OpenAI and other AI models?",
    a: "Yes. ZZAI supports OpenAI (GPT-4o, GPT-4, GPT-3.5), Anthropic Claude, Google Gemini, and other LLMs. You can route between models automatically based on cost or quality thresholds.",
  },
  {
    q: "Do I need to write code to use ZZAI?",
    a: "No. ZZAI's core workflow is entirely no-code — describe your API in plain English, set your output schema, and deploy. A TypeScript SDK is available for developers who want programmatic access.",
  },
  {
    q: "Is ZZAI free to start?",
    a: "Yes. ZZAI has a free tier with no credit card required. Paid plans unlock unlimited endpoints, higher request volumes, and team features.",
  },
  {
    q: "What happens if my endpoint returns bad data?",
    a: "ZZAI validates every response against your JSON schema and automatically retries or repairs malformed outputs. If quality drops below your threshold, auto-rollback reverts to the last good version.",
  },
];

const HOW_TO_STEPS = [
  { name: "Describe your API", text: "Write what you want your API to do in plain English — no code required." },
  { name: "Define your output schema", text: "Set the JSON structure you expect back. ZZAI will enforce and validate it on every call." },
  { name: "Auto-generate evaluations", text: "ZZAI writes up to 200 test cases automatically — edge cases, adversarial inputs, and boundary conditions." },
  { name: "Deploy your endpoint", text: "One click publishes a live, auto-scaling API endpoint with full OpenAPI documentation." },
  { name: "Monitor and rollback", text: "Watch latency, success rate, and token costs in real time. Enable auto-rollback for hands-free quality control." },
];

export function HomeFaqSection() {
  const faqSchema = faqPageSchema(FAQ_ITEMS.map(({ q, a }) => ({ q, a })));
  const howTo = howToSchema({
    name: "How to ship with ZZAI",
    description:
      "Build a production-ready endpoint from a plain-language prompt with ZZAI — schema validation, evaluations, and rollback included.",
    steps: HOW_TO_STEPS,
  });

  return (
    <section
      className="border-t border-white/10 bg-background py-16 sm:py-20"
      aria-labelledby="home-faq-heading"
    >
      <div className="max-w-3xl mx-auto px-6">
        <h2 id="home-faq-heading" className="text-2xl sm:text-3xl font-bold text-center mb-10">
          Frequently asked questions
        </h2>
        <dl className="space-y-6">
          {FAQ_ITEMS.map(({ q, a }) => (
            <div key={q} className="border border-border rounded-lg p-5">
              <dt className="font-semibold text-foreground mb-2">{q}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
      <JsonLd data={[faqSchema, howTo].filter(Boolean) as object[]} />
    </section>
  );
}
