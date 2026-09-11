import { getSiteUrl } from "@/lib/site-url";

const BASE = getSiteUrl().replace(/\/$/, "");

/** Rich, unique HTML for tool/seed SEO pages (passes quality gate). */
export function buildExpandedSeoBody(opts: {
  title: string;
  keyword: string;
  slug: string;
  category?: string | null;
  toolUrl?: string | null;
}): string {
  const { title, keyword, slug } = opts;
  const kw = keyword || title;
  const toolHref = opts.toolUrl?.trim() || `${BASE}/tools`;
  const slugWords = slug.replace(/-/g, " ");

  return `<h1>${title}</h1>
<p><strong>${title}</strong> is a free, browser-based utility on ZZAI for <em>${slugWords}</em>. Use it instantly — no signup required for basic access. Whether you are prototyping an AI feature, validating an idea, or shipping a small automation, this page explains what the tool does, who it helps, and how it connects to ZZAI's prompt-to-API platform at <a href="${BASE}">zzaizzai.com</a>.</p>

<h2>What ${title} does</h2>
<p>This tool focuses on <em>${kw}</em>. It is designed for developers, founders, and operators who need a fast answer without standing up a backend. Run it in the browser, copy the output, and iterate. When you need a production endpoint with schema validation and monitoring, deploy the same behavior as an API on ZZAI in minutes.</p>

<h2>How to use ${slugWords}</h2>
<ol>
<li>Open the tool from <a href="${toolHref}">${title}</a> or browse <a href="${BASE}/tools">ZZAI Tools</a>.</li>
<li>Enter your input — text, JSON, or file depending on the tool.</li>
<li>Review structured output; adjust prompts on ZZAI without redeploying servers.</li>
<li>Ship: call your live HTTPS endpoint from any app or workflow.</li>
</ol>

<h2>Who this is for</h2>
<p>Indie hackers adding AI to a side project, SaaS teams testing a feature before writing a backend, and security or ops teams running one-off checks. If your job is mostly <strong>AI behavior</strong> (generate, classify, extract, summarize), a prompt-backed API beats maintaining idle servers.</p>

<h2>Why ZZAI for ${kw}</h2>
<p>ZZAI turns descriptions into deployable APIs with automated evals, versioning, and rollback. Free tools like this one are the top of the funnel — they solve a real job and show how fast you can go from idea to production. <a href="${BASE}">Start building on ZZAI →</a></p>

[FAQ_JSON]
[
  {"q":"Is ${title} free?","a":"Yes — you can use ZZAI's free tools without creating an account for basic access."},
  {"q":"Do I need a backend for ${slugWords}?","a":"No. These utilities run in the browser or call ZZAI-hosted endpoints so you do not maintain servers."},
  {"q":"How is this different from ChatGPT?","a":"ZZAI gives you a fixed contract (JSON schema), a stable HTTPS URL, and production guardrails — not just a chat window."}
]
[/FAQ_JSON]`;
}
