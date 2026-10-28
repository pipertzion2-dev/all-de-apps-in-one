import type { InventionFields, PriorArtHit, PriorArtReport } from "./types";

export const PRIOR_ART_DISCLAIMER =
  "Prior-Art Radar helps organize research. Results do not guarantee novelty or patentability. Always verify publications on the cited official sources. Cube Protect never fabricates patent numbers.";

/** Build search queries from user text — no invented hits. */
export function buildPatentSearchQueries(
  fields: InventionFields,
  extraQuestion?: string,
  imageConcepts: string[] = [],
): string[] {
  const bits = [
    fields.title,
    fields.category,
    fields.problemSolved,
    fields.uniqueFeatures,
    fields.componentsText,
    extraQuestion || "",
    ...imageConcepts,
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const uniq = [...new Set(bits)].slice(0, 12);
  const core = uniq.slice(0, 6).join(" ");
  const alt = [fields.category, ...uniq.slice(2, 8)].join(" ");
  const componentQ = fields.componentsText
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");

  return [
    core || fields.title,
    alt,
    componentQ ? `${componentQ} ${fields.category}` : `${fields.title} apparatus method`,
    extraQuestion?.trim() || `${fields.problemSolved} ${fields.uniqueFeatures}`.trim(),
  ].filter((q) => q.length >= 4);
}

export function googlePatentsSearchUrl(query: string): string {
  return `https://patents.google.com/?q=${encodeURIComponent(query)}`;
}

export function usptoPublicSearchUrl(query: string): string {
  return `https://ppubs.uspto.gov/pubwebapp/static/pages/landing.html`;
}

export function wipoSearchUrl(query: string): string {
  return `https://patentscope.wipo.int/search/en/search.jsf?query=${encodeURIComponent(query)}`;
}

export function linkHitsFromQueries(queries: string[]): PriorArtHit[] {
  const now = new Date().toISOString();
  const hits: PriorArtHit[] = [];
  for (const q of queries.slice(0, 3)) {
    hits.push({
      id: `link_gp_${crypto.randomUUID().slice(0, 8)}`,
      source: "google_patents_link",
      title: `Google Patents search: ${q}`,
      similarityNotes:
        "Search link only — open the source to review real publications. No fabricated results.",
      differencesNotes: "Compare claims and figures yourself after opening the link.",
      sourceUrl: googlePatentsSearchUrl(q),
      queriedAt: now,
      fromLiveApi: false,
    });
    hits.push({
      id: `link_wipo_${crypto.randomUUID().slice(0, 8)}`,
      source: "wipo_link",
      title: `WIPO PATENTSCOPE search: ${q}`,
      similarityNotes: "Official WIPO search entry point for the generated query.",
      differencesNotes: "Review WIPO hits on the official site before saving citations.",
      sourceUrl: wipoSearchUrl(q),
      queriedAt: now,
      fromLiveApi: false,
    });
  }
  hits.push({
    id: `link_uspto_${crypto.randomUUID().slice(0, 8)}`,
    source: "google_patents_link",
    title: "USPTO Patent Public Search",
    similarityNotes: "Open USPTO Patent Public Search and paste your generated queries.",
    differencesNotes: "USPTO interactive search requires manual query entry in their UI.",
    sourceUrl: usptoPublicSearchUrl(queries[0] || "invention"),
    queriedAt: now,
    fromLiveApi: false,
  });
  return hits;
}

type PatentsViewPatent = {
  patent_id?: string;
  patent_number?: string;
  patent_title?: string;
  patent_abstract?: string;
  patent_date?: string;
};

/**
 * Live PatentsView search when API key / public endpoint is available.
 * Returns [] on failure — never invents patents.
 */
export async function searchPatentsView(query: string): Promise<PriorArtHit[]> {
  const apiKey = process.env.PATENTSVIEW_API_KEY?.trim();
  const endpoint =
    process.env.PATENTSVIEW_API_URL?.trim() || "https://search.patentsview.org/api/v1/patent/";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (apiKey) headers["X-Api-Key"] = apiKey;

    const body = {
      q: { _text_any: { patent_abstract: query } },
      f: ["patent_id", "patent_number", "patent_title", "patent_abstract", "patent_date"],
      o: { size: 8 },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as { patents?: PatentsViewPatent[]; error?: string };
    if (!Array.isArray(data.patents)) return [];

    const now = new Date().toISOString();
    return data.patents
      .filter((p) => p.patent_number || p.patent_id)
      .map((p) => {
        const num = p.patent_number || p.patent_id || "";
        return {
          id: `pv_${num}`,
          source: "uspto_patentsview" as const,
          publicationNumber: num,
          title: p.patent_title || `Patent ${num}`,
          abstract: p.patent_abstract?.slice(0, 600),
          publicationDate: p.patent_date,
          similarityNotes:
            "Returned by PatentsView API based on abstract text match. Review full document before relying on similarity.",
          differencesNotes:
            "Open the Google Patents / USPTO link and compare claims, figures, and embodiments yourself.",
          sourceUrl: googlePatentsSearchUrl(num),
          queriedAt: now,
          fromLiveApi: true,
        };
      });
  } catch {
    return [];
  }
}

export function buildPriorArtReportMarkdown(
  queryText: string,
  queries: string[],
  hits: PriorArtHit[],
  imageConcepts: string[],
): string {
  const live = hits.filter((h) => h.fromLiveApi);
  const links = hits.filter((h) => !h.fromLiveApi);
  const lines = [
    "# Prior-Art Radar research report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `> ${PRIOR_ART_DISCLAIMER}`,
    "",
    "## User query / disclosure excerpt",
    queryText.slice(0, 2000) || "(empty)",
    "",
    "## Generated search queries",
    ...queries.map((q) => `- \`${q}\``),
    "",
  ];
  if (imageConcepts.length) {
    lines.push(
      "## Image / sketch concepts (AI-assisted labels)",
      ...imageConcepts.map((c) => `- ${c}`),
      "",
    );
  }
  lines.push("## Live API hits (PatentsView / configured sources)", "");
  if (!live.length) {
    lines.push(
      "_No live patent API hits in this run._ If `PATENTSVIEW_API_KEY` is unset or the API rejected the request, only curated search links are provided — never fabricated publications.",
      "",
    );
  } else {
    for (const h of live) {
      lines.push(
        `### ${h.publicationNumber || h.id} — ${h.title}`,
        `- Publication date: ${h.publicationDate || "n/a"}`,
        `- Source: ${h.sourceUrl}`,
        `- Notes: ${h.similarityNotes}`,
        "",
      );
    }
  }
  lines.push("## Official search links", "");
  for (const h of links) {
    lines.push(`- [${h.title}](${h.sourceUrl})`);
  }
  return lines.join("\n");
}

export async function runPriorArtRadar(input: {
  fields: InventionFields;
  inventionId: string;
  extraQuestion?: string;
  imageConcepts?: string[];
}): Promise<PriorArtReport> {
  const imageConcepts = input.imageConcepts || [];
  const queries = buildPatentSearchQueries(input.fields, input.extraQuestion, imageConcepts);
  const queryText = [
    input.fields.title,
    input.fields.description,
    input.fields.problemSolved,
    input.extraQuestion || "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const live = await searchPatentsView(queries[0]);
  const links = linkHitsFromQueries(queries);
  const hits = [...live, ...links];

  return {
    id: `par_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    inventionId: input.inventionId,
    createdAt: new Date().toISOString(),
    queryText,
    generatedQueries: queries,
    imageConcepts,
    hits,
    reportMarkdown: buildPriorArtReportMarkdown(queryText, queries, hits, imageConcepts),
    disclaimer: PRIOR_ART_DISCLAIMER,
  };
}
