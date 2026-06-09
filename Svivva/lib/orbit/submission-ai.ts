import { openai, getDefaultModel, isOrbitFreeAIConfigured } from "@/lib/llm/openai";
import { getSvivvaProductProfile } from "@/lib/orbit/product-profile";
import type { SubmissionItemDef } from "@/lib/orbit/submission-schemas";
import {
  generateSocialPack,
  generateMiniParasite,
  generateOutreach,
} from "@/lib/orbit/content-templates";

function templateFields(item: SubmissionItemDef): Record<string, string> {
  const p = getSvivvaProductProfile();
  const out: Record<string, string> = {};

  if (item.kind === "directory") {
    out.productName = p.name;
    out.websiteUrl = item.directoryId === "producthunt" ? p.toolsHubUrl : p.url;
    out.tagline = p.tagline.slice(0, 60);
    out.shortDescription = p.shortDescription;
    out.longDescription = `${p.description}\n\nFree AI tools hub: ${p.toolsHubUrl}`;
    out.category = p.category;
    out.tags = p.keywords.join(", ");
    out.pricing = p.pricing;
    out.alternatives = p.competitors.slice(0, 4).join(", ");
    if (item.directoryId === "crunchbase") {
      out.foundedYear = String(new Date().getFullYear());
      out.headquarters = "Remote";
    }
    return out;
  }

  const social = generateSocialPack();
  const parasite = generateMiniParasite();
  const outreach = generateOutreach();

  if (item.id === "pub-devto") {
    const dev = parasite.find((x) => x.platform.toLowerCase().includes("dev"));
    out.title = dev?.title || `Building ${p.name}: AI APIs without the backend team`;
    out.tags = "ai, tools, javascript, startup";
    out.body = `${dev?.content || p.description}\n\nTry free tools: ${p.toolsHubUrl}`;
  } else if (item.id === "pub-medium") {
    const m = parasite.find((x) => x.platform.toLowerCase().includes("medium"));
    out.title = m?.title || `What we learned shipping AI tools with ${p.name}`;
    out.subtitle = "Practical notes for founders";
    out.body = `${m?.content || p.description}\n\n${p.toolsHubUrl}`;
  } else if (item.id === "pub-hashnode") {
    const h = parasite.find((x) => x.platform.toLowerCase().includes("hashnode"));
    out.title = h?.title || "Ship AI features in a weekend";
    out.tags = "ai, productivity";
    out.body = `${h?.content || p.description}\n\n${p.url}`;
  } else if (item.id === "pub-reddit") {
    out.subreddit = "SideProject";
    out.title =
      social.redditPosts[0]?.title || `I built ${p.name} — natural language to production APIs`;
    out.body = social.redditPosts[0]?.body || `${p.description}\n\n${p.toolsHubUrl}`;
  } else if (item.id === "pub-showhn") {
    out.title = `Show HN: ${p.name} – ${p.tagline}`;
    out.url = p.toolsHubUrl;
    out.body = social.showHN;
  } else if (item.id === "pub-producthunt") {
    out.tagline = p.tagline.slice(0, 60);
    out.description = p.shortDescription;
    out.firstComment = `We built 50+ free AI tools on ${p.toolsHubUrl} using ${p.name}. Happy to answer questions!`;
  } else if (item.id === "pub-twitter") {
    out.thread = social.twitterThread.join("\n---\n");
  } else if (item.id === "pub-linkedin") {
    out.headline = `${p.name}: ${p.tagline}`;
    out.body = social.linkedInPost;
  } else if (item.id === "pub-indiehackers") {
    out.tagline = p.tagline;
    out.description = p.description;
    out.milestone = `Launched ${p.toolsHubUrl} — 50 free tools, zero ad spend, built on our own API platform.`;
  } else if (item.id === "pub-newsletter") {
    const n = outreach.newsletters[0];
    out.recipient = "tips@tldr.tech";
    out.subject = `Story: ${p.name} — AI APIs in minutes`;
    out.body = n?.pitch || p.description;
  } else if (item.id === "pub-podcast") {
    const pod = outreach.podcasts[0];
    out.subject = `Guest pitch: building ${p.name}`;
    out.body = pod?.pitch || p.description;
  } else if (item.id === "acc-beehiiv") {
    out.newsletterName = `${p.name} Weekly`;
    out.welcomeEmail = `Thanks for subscribing! Each week we share one AI tool tactic from building ${p.toolsHubUrl}.`;
    out.homepageBlurb = "Get weekly AI shipping tips — free newsletter.";
  } else if (item.id === "acc-twitter-bio") {
    out.bio = `${p.tagline} · ${p.toolsHubUrl}`.slice(0, 160);
    out.pinnedTweet = social.twitterThread[0] || p.shortDescription;
  } else if (item.id === "acc-linkedin-co") {
    out.companyName = p.name;
    out.tagline = p.tagline.slice(0, 120);
    out.about = p.description;
  }

  return out;
}

export async function generateSubmissionFields(
  item: SubmissionItemDef,
): Promise<Record<string, string>> {
  const p = getSvivvaProductProfile();
  const fieldList = item.fields.map((f) => `${f.key}: ${f.label}`).join(", ");

  if (isOrbitFreeAIConfigured()) {
    try {
      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write platform-native listing and launch copy for Svivva. Be specific, not generic. Return only JSON object with the requested field keys.",
          },
          {
            role: "user",
            content: `Platform: ${item.label}
Submit URL: ${item.submitUrl}
Tip: ${item.tip || "none"}
Product: ${JSON.stringify(p)}

Return JSON with these keys only: ${fieldList}
Tailor tone and length to what ${item.label}'s form expects.`,
          },
        ],
        temperature: 0.75,
        max_tokens: 1200,
      });
      const parsed = JSON.parse(gen.choices[0].message.content || "{}") as Record<string, string>;
      const out: Record<string, string> = {};
      for (const f of item.fields) {
        if (parsed[f.key]) out[f.key] = String(parsed[f.key]);
      }
      if (Object.keys(out).length >= 2) return out;
    } catch (e) {
      console.warn("[submission-ai] AI fill failed:", String(e).slice(0, 100));
    }
  }

  return templateFields(item);
}
