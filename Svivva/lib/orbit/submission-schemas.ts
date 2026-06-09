/** Per-platform form fields — matches external submit forms for copy-paste or API publish */

export type SubmissionFieldType = "text" | "textarea" | "url" | "tags";

export type SubmissionField = {
  key: string;
  label: string;
  type: SubmissionFieldType;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  hint?: string;
};

export type SubmissionItemKind = "directory" | "publish" | "account";

export type SubmissionItemDef = {
  id: string;
  checklistId: string;
  kind: SubmissionItemKind;
  label: string;
  submitUrl: string;
  tip?: string;
  estimatedVisitors?: number;
  fields: SubmissionField[];
  /** Maps to growth_submissions.directoryId when kind === directory */
  directoryId?: string;
};

const DIR_FIELDS: SubmissionField[] = [
  { key: "productName", label: "Product / tool name", type: "text", required: true },
  { key: "websiteUrl", label: "Website URL", type: "url", required: true },
  {
    key: "tagline",
    label: "Tagline (≤60 chars)",
    type: "text",
    maxLength: 60,
    required: true,
  },
  {
    key: "shortDescription",
    label: "Short description",
    type: "textarea",
    maxLength: 260,
    hint: "One paragraph for listing cards",
  },
  {
    key: "longDescription",
    label: "Full description",
    type: "textarea",
    hint: "Paste into the main description field on the directory form",
  },
  { key: "category", label: "Category", type: "text", placeholder: "AI Tools, Developer Tools" },
  { key: "tags", label: "Tags (comma-separated)", type: "tags" },
  { key: "pricing", label: "Pricing model", type: "text", placeholder: "Free / Freemium" },
  {
    key: "alternatives",
    label: "Alternatives to (if asked)",
    type: "tags",
    hint: "e.g. Zapier, Make, n8n",
  },
];

function dir(
  checklistId: string,
  directoryId: string,
  label: string,
  submitUrl: string,
  tip?: string,
  visitors?: number,
  extra?: SubmissionField[],
): SubmissionItemDef {
  return {
    id: `dir-${directoryId}`,
    checklistId,
    kind: "directory",
    directoryId,
    label,
    submitUrl,
    tip,
    estimatedVisitors: visitors,
    fields: extra ? [...DIR_FIELDS, ...extra] : DIR_FIELDS,
  };
}

export const SUBMISSION_ITEMS: SubmissionItemDef[] = [
  dir(
    "dir-futurepedia",
    "futurepedia",
    "Futurepedia",
    "https://www.futurepedia.io/submit-tool",
    "Largest AI directory — high DR backlink",
    500_000,
  ),
  dir(
    "dir-taaft",
    "theresanaiforthat",
    "There's An AI For That",
    "https://theresanaiforthat.com/submit/",
    "2M monthly visitors",
    2_000_000,
  ),
  dir(
    "dir-g2",
    "g2",
    "G2",
    "https://sell.g2.com",
    "Biggest SaaS review site — needs a few reviews to rank",
    8_000_000,
  ),
  dir(
    "dir-alternativeto",
    "alternativeto",
    "AlternativeTo",
    "https://alternativeto.net/add-app/",
    "List as alternative to Zapier, Make, n8n",
    4_000_000,
    [{ key: "alternatives", label: "Alternative to", type: "tags", required: true }],
  ),
  dir(
    "dir-crunchbase",
    "crunchbase",
    "Crunchbase",
    "https://www.crunchbase.com/add-new",
    "Startup credibility + high-DA backlink",
    10_000_000,
    [
      { key: "foundedYear", label: "Founded year", type: "text" },
      { key: "headquarters", label: "Headquarters", type: "text", placeholder: "City, Country" },
    ],
  ),
  dir(
    "dir-producthunt",
    "producthunt",
    "Product Hunt listing",
    "https://www.producthunt.com/posts/new",
    "Separate from launch day — get listed in directory",
    5_000_000,
    [
      { key: "tagline", label: "Tagline (≤60 chars)", type: "text", maxLength: 60 },
      {
        key: "shortDescription",
        label: "Description",
        type: "textarea",
        maxLength: 260,
      },
    ],
  ),
  // ── Manual publishing (inline copy fields) ────────────────────────────────
  {
    id: "pub-devto",
    checklistId: "manual-devto",
    kind: "publish",
    label: "Dev.to article",
    submitUrl: "https://dev.to/new",
    tip: "DA 94 — ranks within days. Auto-posts if Dev.to API key is set in Autopilot.",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "tags", label: "Tags", type: "tags" },
      { key: "body", label: "Body (Markdown)", type: "textarea", required: true },
    ],
  },
  {
    id: "pub-medium",
    checklistId: "manual-medium",
    kind: "publish",
    label: "Medium article",
    submitUrl: "https://medium.com/new-story",
    tip: "DA 96 — paste title + body at medium.com/new-story",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "body", label: "Body", type: "textarea", required: true },
    ],
  },
  {
    id: "pub-hashnode",
    checklistId: "manual-hashnode",
    kind: "publish",
    label: "Hashnode article",
    submitUrl: "https://hashnode.com",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "tags", label: "Tags", type: "tags" },
      { key: "body", label: "Body (Markdown)", type: "textarea", required: true },
    ],
  },
  {
    id: "pub-reddit",
    checklistId: "manual-reddit-sideproject",
    kind: "publish",
    label: "Reddit r/SideProject",
    submitUrl: "https://reddit.com/r/SideProject/submit",
    tip: "Start with one sub — don't cross-post same day",
    fields: [
      { key: "subreddit", label: "Subreddit", type: "text", placeholder: "SideProject" },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "body", label: "Post body", type: "textarea", required: true },
    ],
  },
  {
    id: "pub-showhn",
    checklistId: "manual-showhn",
    kind: "publish",
    label: "Show HN",
    submitUrl: "https://news.ycombinator.com/submit",
    tip: "Title must start with 'Show HN:' — best 9am–12pm EST weekdays",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "url", label: "URL", type: "url" },
      { key: "body", label: "Text (optional)", type: "textarea" },
    ],
  },
  {
    id: "pub-producthunt",
    checklistId: "manual-producthunt",
    kind: "publish",
    label: "Product Hunt launch",
    submitUrl: "https://www.producthunt.com/posts/new",
    tip: "Launch at 12:01am PST for full voting day",
    fields: [
      { key: "tagline", label: "Tagline (≤60 chars)", type: "text", maxLength: 60 },
      { key: "description", label: "Description", type: "textarea", maxLength: 260 },
      { key: "firstComment", label: "First comment", type: "textarea" },
    ],
  },
  {
    id: "pub-twitter",
    checklistId: "manual-twitter-thread",
    kind: "publish",
    label: "Twitter/X thread",
    submitUrl: "https://twitter.com/compose/tweet",
    fields: [
      {
        key: "thread",
        label: "Thread (tweets separated by ---)",
        type: "textarea",
        hint: "Tweet 1 is the hook. Auto-posts if Twitter keys are set.",
      },
    ],
  },
  {
    id: "pub-linkedin",
    checklistId: "manual-linkedin",
    kind: "publish",
    label: "LinkedIn post",
    submitUrl: "https://www.linkedin.com/feed/",
    fields: [
      { key: "headline", label: "Headline", type: "text" },
      { key: "body", label: "Post body", type: "textarea", required: true },
    ],
  },
  {
    id: "pub-indiehackers",
    checklistId: "manual-indiehackers",
    kind: "publish",
    label: "Indie Hackers",
    submitUrl: "https://www.indiehackers.com/products",
    fields: [
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "description", label: "Product description", type: "textarea" },
      { key: "milestone", label: "Milestone post", type: "textarea" },
    ],
  },
  {
    id: "pub-newsletter",
    checklistId: "manual-newsletters",
    kind: "publish",
    label: "Newsletter pitch",
    submitUrl: "mailto:",
    fields: [
      { key: "recipient", label: "Send to", type: "text", placeholder: "tips@tldr.tech" },
      { key: "subject", label: "Subject", type: "text" },
      { key: "body", label: "Email body", type: "textarea" },
    ],
  },
  {
    id: "pub-podcast",
    checklistId: "manual-podcasts",
    kind: "publish",
    label: "Podcast pitch",
    submitUrl: "mailto:",
    fields: [
      { key: "recipient", label: "Show contact email", type: "text" },
      { key: "subject", label: "Subject", type: "text" },
      { key: "body", label: "Pitch email", type: "textarea" },
    ],
  },
  // ── Accounts ──────────────────────────────────────────────────────────────
  {
    id: "acc-beehiiv",
    checklistId: "acc-email-list",
    kind: "account",
    label: "Newsletter (Beehiiv / Substack)",
    submitUrl: "https://www.beehiiv.com",
    tip: "Create newsletter → link from homepage footer",
    fields: [
      { key: "newsletterName", label: "Newsletter name", type: "text" },
      { key: "welcomeEmail", label: "Welcome email draft", type: "textarea" },
      { key: "homepageBlurb", label: "Homepage signup blurb", type: "textarea" },
    ],
  },
  {
    id: "acc-twitter-bio",
    checklistId: "acc-twitter",
    kind: "account",
    label: "Twitter/X profile",
    submitUrl: "https://twitter.com/settings/profile",
    fields: [
      { key: "bio", label: "Bio (160 chars)", type: "text", maxLength: 160 },
      { key: "pinnedTweet", label: "Pinned tweet", type: "textarea" },
    ],
  },
  {
    id: "acc-linkedin-co",
    checklistId: "acc-linkedin",
    kind: "account",
    label: "LinkedIn company page",
    submitUrl: "https://www.linkedin.com/company/setup/new/",
    fields: [
      { key: "companyName", label: "Company name", type: "text" },
      { key: "about", label: "About section", type: "textarea" },
      { key: "tagline", label: "Tagline", type: "text", maxLength: 120 },
    ],
  },
];

export function getSubmissionItem(id: string): SubmissionItemDef | undefined {
  return SUBMISSION_ITEMS.find((s) => s.id === id || s.checklistId === id);
}

export function itemsByKind(kind: SubmissionItemKind): SubmissionItemDef[] {
  return SUBMISSION_ITEMS.filter((s) => s.kind === kind);
}

/** Format fields for clipboard — labeled blocks easy to paste into web forms */
export function formatFieldsForClipboard(
  item: SubmissionItemDef,
  fields: Record<string, string>,
): string {
  const lines: string[] = [`══ ${item.label} ══`, ""];
  for (const f of item.fields) {
    const v = fields[f.key]?.trim();
    if (!v) continue;
    lines.push(`${f.label}:`, v, "");
  }
  lines.push(`Submit: ${item.submitUrl}`);
  return lines.join("\n");
}
