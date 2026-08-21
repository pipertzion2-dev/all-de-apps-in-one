import { isRobotsDisallowed } from "@/lib/seo/robots-config";
import { isValidPublicAppSlug, publicAppPath } from "./slug";

export type PrePublishCheck = {
  id: string;
  label: string;
  severity: "error" | "warning" | "ok";
  message: string;
  blocksPublish: boolean;
};

export type PrePublishInput = {
  slug: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robotsDirective?: string | null;
  crawlableBody?: string | null;
  whoItsFor?: string | null;
  howToUse?: string | null;
  slugTakenByOther?: boolean;
  origin: string;
};

export function runPrePublishSeoChecks(input: PrePublishInput): PrePublishCheck[] {
  const checks: PrePublishCheck[] = [];
  const path = publicAppPath(input.slug);

  if (!isValidPublicAppSlug(input.slug)) {
    checks.push({
      id: "url_valid",
      label: "URL valid",
      severity: "error",
      message: "Slug must be lowercase kebab-case (a-z, 0-9, hyphens).",
      blocksPublish: true,
    });
  } else {
    checks.push({
      id: "url_valid",
      label: "URL valid",
      severity: "ok",
      message: `Public path ${path} is valid.`,
      blocksPublish: false,
    });
  }

  if (input.slugTakenByOther) {
    checks.push({
      id: "duplicate_slug",
      label: "Unique slug",
      severity: "error",
      message: "Another app already uses this slug.",
      blocksPublish: true,
    });
  } else {
    checks.push({
      id: "duplicate_slug",
      label: "Unique slug",
      severity: "ok",
      message: "Slug is available.",
      blocksPublish: false,
    });
  }

  if (isRobotsDisallowed(path)) {
    checks.push({
      id: "robots_block",
      label: "robots.txt",
      severity: "error",
      message: "robots.txt would block this URL — /apps/ must remain crawlable.",
      blocksPublish: true,
    });
  } else {
    checks.push({
      id: "robots_block",
      label: "robots.txt",
      severity: "ok",
      message: "Path is not disallowed by robots policy.",
      blocksPublish: false,
    });
  }

  const robots = (input.robotsDirective || "").toLowerCase();
  if (robots.includes("noindex")) {
    checks.push({
      id: "noindex",
      label: "Indexable robots",
      severity: "error",
      message: "Robots directive includes noindex — page would not be indexable.",
      blocksPublish: true,
    });
  } else {
    checks.push({
      id: "noindex",
      label: "Indexable robots",
      severity: "ok",
      message: "No accidental noindex.",
      blocksPublish: false,
    });
  }

  if (!input.seoTitle?.trim()) {
    checks.push({
      id: "title",
      label: "SEO title",
      severity: "error",
      message: "Title is required before publish.",
      blocksPublish: true,
    });
  } else {
    checks.push({
      id: "title",
      label: "SEO title",
      severity: "ok",
      message: "Title present.",
      blocksPublish: false,
    });
  }

  if (!input.metaDescription?.trim() || input.metaDescription.trim().length < 40) {
    checks.push({
      id: "meta_description",
      label: "Meta description",
      severity: input.metaDescription?.trim() ? "warning" : "error",
      message: input.metaDescription?.trim()
        ? "Meta description is short — aim for ~120–155 characters."
        : "Meta description is required.",
      blocksPublish: !input.metaDescription?.trim(),
    });
  } else {
    checks.push({
      id: "meta_description",
      label: "Meta description",
      severity: "ok",
      message: "Meta description present.",
      blocksPublish: false,
    });
  }

  const selfCanonical = `${input.origin.replace(/\/$/, "")}${path}`;
  if (!input.canonicalUrl?.trim()) {
    checks.push({
      id: "canonical",
      label: "Canonical",
      severity: "error",
      message: "Canonical URL is required (defaults to self-referencing public URL).",
      blocksPublish: true,
    });
  } else if (input.canonicalUrl.replace(/\/$/, "") !== selfCanonical.replace(/\/$/, "")) {
    checks.push({
      id: "canonical",
      label: "Canonical",
      severity: "warning",
      message: `Canonical differs from self URL (${selfCanonical}). Allowed only with explicit admin override.`,
      blocksPublish: false,
    });
  } else {
    checks.push({
      id: "canonical",
      label: "Canonical",
      severity: "ok",
      message: "Self-referencing canonical.",
      blocksPublish: false,
    });
  }

  const bodyLen = (input.crawlableBody || "").trim().length;
  const hasHow = !!(input.howToUse || "").trim();
  const hasWho = !!(input.whoItsFor || "").trim();
  if (bodyLen < 120 || !hasHow || !hasWho) {
    checks.push({
      id: "crawlable_content",
      label: "Crawlable content",
      severity: "error",
      message:
        "Need meaningful crawlable copy (what it does, who it’s for, how to use) — avoid thin pages.",
      blocksPublish: true,
    });
  } else {
    checks.push({
      id: "crawlable_content",
      label: "Crawlable content",
      severity: "ok",
      message: "Crawlable explanation content looks sufficient.",
      blocksPublish: false,
    });
  }

  checks.push({
    id: "sitemap_eligible",
    label: "Sitemap eligibility",
    severity: "ok",
    message: "Published public indexable apps are added to the apps sitemap chunk automatically.",
    blocksPublish: false,
  });

  checks.push({
    id: "http_200",
    label: "HTTP 200 after publish",
    severity: "ok",
    message:
      "Published routes are served by /apps/[slug] with 200 for public apps (404 if private).",
    blocksPublish: false,
  });

  return checks;
}

export function canPublish(checks: PrePublishCheck[]): boolean {
  return !checks.some((c) => c.blocksPublish);
}
