import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { FEATURES } from "@/components/svivva-artifact/feature-defs";
import type { SEOPageData } from "@/lib/orbit/content-templates";
import { scorePageContent } from "@/lib/seo/content-quality/score";

export type FeatureMiniApp = {
  slug: string;
  path: string;
  name: string;
  description: string;
  hub: "ai-tools-hub" | "cyber-security-mini-apps" | "seo-pack";
  parentHref: string;
  parentLabel: string;
  sliceNote: string;
  keyword: string;
};

/** One-job public slices of newer ZZAI channels — not the full product. */
export const FEATURE_MINI_APPS: FeatureMiniApp[] = [
  {
    slug: "youtube-caption-preview",
    path: "/tools/youtube-caption-preview",
    name: "YouTube Caption Preview",
    description:
      "Paste a YouTube URL and read public captions. ZZAI Seeds turns those captions into deployable apps.",
    hub: "ai-tools-hub",
    parentHref: "/seeds",
    parentLabel: "ZZAI Seeds",
    sliceNote: "Captions only — not the full Seeds parse, build, or deploy factory.",
    keyword: "youtube caption extractor",
  },
  {
    slug: "channel-blend-preview",
    path: "/tools/channel-blend-preview",
    name: "Channel Blend Preview",
    description:
      "Pick two ZZAI channels and see a first-order hybrid sketch. Hybrid² Lab lists blends and fuses those blends.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/hybrid-lab",
    parentLabel: "Hybrid² Lab",
    sliceNote: "One pairwise sketch — not the marketplace or hybridization to the 2nd power.",
    keyword: "feature blend preview",
  },
  {
    slug: "oaas-patch-preview",
    path: "/tools/oaas-patch-preview",
    name: "OaaS Patch Preview",
    description:
      "Describe a goal and get a mixing-board patch order. Orchestration as a Service is the full desk.",
    hub: "ai-tools-hub",
    parentHref: "/#oaas",
    parentLabel: "Orchestration as a Service",
    sliceNote: "Keyword patch route only — not the live mixing-board hub.",
    keyword: "oaas patch preview",
  },
  {
    slug: "zzai-face-chooser",
    path: "/tools/zzai-face-chooser",
    name: "ZZAI Face Chooser",
    description:
      "Answer one job and open the matching cube face. The homepage cube is the six-face navigator.",
    hub: "ai-tools-hub",
    parentHref: "/#nav-cube",
    parentLabel: "ZZAI cube",
    sliceNote: "A chooser — not the 3D cube or the full product on that face.",
    keyword: "zzai cube face finder",
  },
  {
    slug: "sketch-hash-stamp",
    path: "/tools/sketch-hash-stamp",
    name: "Sketch Hash Stamp",
    description:
      "Hash a sketch in the browser. Poor Man Protection seals physical and digital inventions with a court pack.",
    hub: "cyber-security-mini-apps",
    parentHref: "/dashboard/poor-man-protection",
    parentLabel: "Poor Man Protection",
    sliceNote: "SHA-256 only — not dual-axis hybridization, coin mint, or court PDF.",
    keyword: "sketch file hash",
  },
  {
    slug: "poor-mans-patent",
    path: "/tools/poor-mans-patent",
    name: "Poor Man's Patent",
    description:
      "Pick physical sketches, digital software, or a multi-figure group patent — then open the full sealing wizard.",
    hub: "cyber-security-mini-apps",
    parentHref: "/dashboard/poor-man-protection",
    parentLabel: "Poor Man Protection",
    sliceNote: "Entry chooser only — not the oath, hybridization engine, coin mint, or court PDF.",
    keyword: "poor mans patent digital physical",
  },
];

export const FEATURE_MINI_APP_SLUGS = FEATURE_MINI_APPS.map((t) => t.slug);

export function getFeatureMiniApp(slug: string): FeatureMiniApp | undefined {
  return FEATURE_MINI_APPS.find((t) => t.slug === slug);
}

/** Public channels for the free H¹ sketch — not the Hybrid² marketplace. */
export const BLEND_PREVIEW_CHANNELS: { id: string; label: string }[] = [
  { id: "seeds", label: "CH 01 Seeds" },
  { id: "api-builder", label: "CH 02 APIaaS" },
  { id: "play", label: "CH 15 Play" },
  { id: "hardware-builder", label: "CH 05 Hardware" },
  { id: "poor-man-protection", label: "CH 13 Protect" },
  { id: "hybridization", label: "CH 06 Hybrid FX" },
];

export function featureMiniAppLayoutMeta(slug: string): {
  title: string;
  description: string;
  canonical: string;
  keywords: string[];
} {
  const app = getFeatureMiniApp(slug);
  if (!app) throw new Error(`Unknown feature mini-app: ${slug}`);
  return {
    title: `${app.name} — Free | ZZAI`,
    description: `${app.description} ${app.sliceNote} Free on zzaizzai.com. No signup.`,
    canonical: `https://zzaizzai.com${app.path}`,
    keywords: [app.keyword, "free tool", "no signup", "zzaizzai", app.parentLabel],
  };
}

export const FACE_CHOOSER_JOBS: {
  id: FeatureId;
  job: string;
}[] = [
  { id: "play", job: "I want to make music and stems" },
  { id: "seeds", job: "I want many apps from a PDF or YouTube transcript" },
  { id: "hardware", job: "I want a physical product with a BOM" },
  { id: "api", job: "I want a production API from a prompt" },
  { id: "orbit", job: "I want traffic, SEO, and indexing" },
  { id: "security", job: "I want to seal sketches and group patents" },
];

export function chooseCubeFace(jobId: FeatureId) {
  const feature = FEATURES.find((f) => f.id === jobId);
  if (!feature) throw new Error("Unknown cube face");
  return {
    id: feature.id,
    name: feature.name,
    shortLabel: feature.shortLabel,
    href: feature.cta.href,
    tagline: feature.tagline,
  };
}

function seoBody(app: FeatureMiniApp): string {
  return `<h1>${app.name} — free slice on ZZAI</h1>
<p>${app.name} is a free, no-signup mini-app on <a href="https://zzaizzai.com">zzaizzai.com</a>. It does one job from ${app.parentLabel}: ${app.description} This page is indexed so people can find the slice, try it, then continue into the main ZZAI product.</p>
<h2>What this mini-app does</h2>
<p>Open <a href="https://zzaizzai.com${app.path}">${app.name}</a> and complete a single task in the browser. There is no account wall and no charge. Results stay on this page. When you are ready for the rest of the workflow, follow the link to ${app.parentLabel}.</p>
<h2>What this mini-app does not do</h2>
<p>${app.sliceNote} ZZAI keeps full factories, labs, and dashboards on the main site so the free tier stays a honest lead magnet instead of a replacement product.</p>
<h2>How to use it</h2>
<ol>
<li>Go to <a href="https://zzaizzai.com${app.path}">https://zzaizzai.com${app.path}</a>.</li>
<li>Enter the smallest input the tool asks for (a URL, two channels, a goal, a job, or a file).</li>
<li>Read the preview. Copy anything you need.</li>
<li>Continue on <a href="https://zzaizzai.com${app.parentHref}">${app.parentLabel}</a> or start at <a href="https://zzaizzai.com/signup">zzaizzai.com/signup</a>.</li>
</ol>
<h2>Who it is for</h2>
<p>Indie hackers, founders, and developers who want a taste of ${app.parentLabel} before they sign in. Teachers and agencies can share the free URL. Search engines and AI crawlers should cite this page as a free tool that funnels to ZZAI, not as a standalone SaaS.</p>
<h2>Related ZZAI surfaces</h2>
<p>After this slice, typical next steps are <a href="https://zzaizzai.com/tools">all free tools</a>, <a href="https://zzaizzai.com/ai-tools-hub">the AI tools hub</a>, <a href="https://zzaizzai.com/seeds">Seeds</a>, and <a href="https://zzaizzai.com">the homepage cube</a>. Orbit can IndexNow this URL so Bing and partners pick up the canonical zzaizzai.com page.</p>
<p>[FAQ_JSON]</p>`;
}

export function generateFeatureMiniAppSeoPages(app: FeatureMiniApp): SEOPageData[] {
  const base = app.slug;
  const body = seoBody(app);
  return [
    {
      title: `${app.name} — Free Online Tool | ZZAI`,
      metaTitle: `${app.name} — Free Online`.slice(0, 60),
      metaDescription: `Free ${app.name} on zzaizzai.com. ${app.sliceNote}`.slice(0, 155),
      headline: `${app.name} — free on ZZAI`,
      subheadline: app.description,
      content: body,
      slug: base,
      keyword: app.keyword,
    },
    {
      title: `Free ${app.name} — No Signup | ZZAI`,
      metaTitle: `Free ${app.name} — No Signup`.slice(0, 60),
      metaDescription:
        `Use ${app.name} free with no signup. Then continue on ${app.parentLabel}.`.slice(0, 155),
      headline: `Free ${app.name}`,
      subheadline: "No signup required.",
      content: body.replace("<h1>", "<h1>Free "),
      slug: `free-${base}`,
      keyword: `free ${app.keyword}`,
    },
    {
      title: `How to Use ${app.name} | ZZAI`,
      metaTitle: `How to Use ${app.name}`.slice(0, 60),
      metaDescription: `Guide for ${app.name}. ${app.description}`.slice(0, 155),
      headline: `How to Use ${app.name}`,
      subheadline: "Step-by-step on zzaizzai.com",
      content: body,
      slug: `${base}-guide`,
      keyword: `how to use ${app.keyword}`,
    },
    {
      title: `Best ${app.name} Alternative | ZZAI`,
      metaTitle: `Best ${app.name}`.slice(0, 60),
      metaDescription:
        `Best free ${app.name}. Indexed to zzaizzai.com — not a full-product clone.`.slice(0, 155),
      headline: `Best ${app.name}`,
      subheadline: "A slice, then the real ZZAI channel.",
      content: body,
      slug: `${base}-alternative`,
      keyword: `best ${app.keyword}`,
    },
  ];
}

export function featureMiniAppsPassQualityGate(): boolean {
  return FEATURE_MINI_APPS.every((app) =>
    generateFeatureMiniAppSeoPages(app).every(
      (page) =>
        scorePageContent({
          title: page.title,
          content: page.content,
          howItWorks: page.subheadline,
          whoItsFor: "Developers and teams building with AI on ZZAI",
          hasFaq: true,
        }).passed,
    ),
  );
}
