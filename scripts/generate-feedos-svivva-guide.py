#!/usr/bin/env python3
from pathlib import Path

def make_pdf(path: Path, lines):
    contents = []
    obj_ids = []

    def add_obj(data):
        obj_id = len(contents) + 1
        contents.append(data)
        obj_ids.append(obj_id)
        return obj_id

    def encode_text(text):
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    page_width = 612
    page_height = 792
    margin_left = 44
    margin_top = 72
    line_height = 14
    max_lines = 44

    pages = []
    current_lines = []
    for line in lines:
        if len(current_lines) >= max_lines or line == "---PAGE---":
            pages.append(current_lines)
            current_lines = []
            continue
        current_lines.append(line)
    if current_lines:
        pages.append(current_lines)

    font_obj = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    page_obj_ids = []
    contents_obj_ids = []
    for page_lines in pages:
        text_lines = [f"BT /F1 12 Tf {margin_left} {page_height - margin_top} Td ({encode_text(page_lines[0])}) Tj" ]
        for line in page_lines[1:]:
            if not line:
                text_lines.append("T*")
            else:
                text_lines.append(f"T* ({encode_text(line)}) Tj")
        text_lines.append("ET")
        text_stream = "\n".join(text_lines).encode("latin1")
        stream = f"<< /Length {len(text_stream)} >>\nstream\n".encode("latin1") + text_stream + b"\nendstream"
        content_id = add_obj(stream.decode("latin1"))
        contents_obj_ids.append(content_id)

        page_obj = f"<< /Type /Page /Parent 0 0 R /MediaBox [0 0 {page_width} {page_height}] /Resources << /Font << /F1 {font_obj} 0 R >> >> /Contents {content_id} 0 R >>"
        page_obj_ids.append(add_obj(page_obj))

    kids = " ".join(f"{pid} 0 R" for pid in page_obj_ids)
    pages_id = add_obj(f"<< /Type /Pages /Kids [{kids}] /Count {len(page_obj_ids)} >>")
    catalog_id = add_obj(f"<< /Type /Catalog /Pages {pages_id} 0 R >>")

    offsets = []
    stream = [b"%PDF-1.4\n"]
    for obj_id, data in enumerate(contents, start=1):
        offsets.append(len(b"".join(stream)))
        stream.append(f"{obj_id} 0 obj\n{data}\nendobj\n".encode("latin1"))
    xref_offset = len(b"".join(stream))
    stream.append(b"xref\n0 %d\n0000000000 65535 f \n" % (len(contents) + 1))
    for offset in offsets:
        stream.append(f"{offset:010d} 00000 n \n".encode("latin1"))
    stream.append(f"trailer\n<< /Size {len(contents)+1} /Root {catalog_id} 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("latin1"))

    path.write_bytes(b"".join(stream))


guide_lines = [
    "FeedOS Guide for Svivva + Pyracrypt",
    "", 
    "Purpose:",
    "Use deployed Svivva as the app shell, growth engine, marketing engine, and mini-app creation platform.",
    "Use Pyracrypt as the secure AI intelligence orchestration layer, model host, and data privacy service.",
    "", 
    "How to use Svivva now:",
    "1. Open your deployed Svivva front end on Vercel or your active domain.",
    "2. Treat Svivva as a single platform, not a separate app: it becomes the container for FeedOS intelligence.",
    "3. Use Svivva's existing page structure and content modules to add new feed, mood, analysis, and mini-app flows.",
    "", 
    "Svivva roles for FeedOS:",
    "- Growth engine: landing pages, referral gates, waitlists, onboarding funnels, share mechanics.",
    "- Marketing engine: auto-generated landing pages, social copy, email campaign drafts, SEO pages, campaign hooks.",
    "- Mini-app creation engine: build trend trackers, niche feeds, creator dashboards, research tools, mood feeds.",
    "- Automation layer: background queues, scheduled intelligence updates, prompt-driven content generation.",
    "- Experimentation platform: A/B page variants, feature tests, recommendation variants, campaign metrics.",
    "- AI workflow layer: connect model outputs, embeddings, feed scoring, and x-ray explanations into Svivva UI.",
    "", 
    "How to use Pyracrypt now:",
    "1. Use Pyracrypt as the backend service that manages secure AI model access and local model orchestration.",
    "2. Point Svivva AI-driven routes at Pyracrypt-hosted endpoints for transcription, embeddings, vision, and generation.",
    "3. Use Pyracrypt to keep your stack low-cost by running local open-source models instead of expensive cloud APIs.",
    "4. Use Pyracrypt for secure storage of API keys, prompt templates, and model metadata in a safe backend service.",
    "", 
    "Key FeedOS components to activate in Svivva:",
    "- Feed page: ingest content, show ranked discoveries, and surface recommendations.",
    "- Mood selector: let users pick modes like Deep Focus, Learning, Calm, Music, Fashion, Creative.",
    "- X-ray panel: display intent, emotion, credibility, repost risk, and recommendation reason.",
    "- Taste graph: show evolving personalization signals across colors, style, pace, humor, music energy.",
    "- Mini-app builder: generate specialized feeds and research tools from templates.",
    "- Analytics dashboard: track retention, engagement, saves, shares, conversion, and mini-app usage.",
    "- Daily brief: surface trends, top ideas, emerging creators, and niche opportunities.",
    "", 
    "Feeds, ingestion, and data sources:",
    "Start by wiring Svivva to the sources you can already support: YouTube, Reddit, RSS, podcasts, and user uploads.",
    "For MVP, prioritize sources with available RSS or public APIs, then add TikTok / Instagram / X later.",
    "Extract the content fields Svivva needs: titles, captions, descriptions, comments, transcripts, frames, image features.",
    "", 
    "AI stack strategy (free / local first):",
    "- Transcription: whisper.cpp locally or Faster-Whisper for audio/video transcript extraction.",
    "- Embeddings: sentence-transformers / all-MiniLM-L6-v2 for semantic search and taste matching.",
    "- Vision: CLIP, SigLIP, or Florence-2 for image and frame understanding.",
    "- Generation: Ollama local models using Llama 3 3B for fast responses, Qwen 8B for reasoning, Mistral Small for better text.",
    "- Fallback: OpenRouter free models only when local models are unavailable.",
    "- Vector store: pgvector in Postgres for embeddings and similarity search.",
    "- Queue: BullMQ for background tasks and batch scoring.",
    "- Cache: Redis for session state, feed caches, and fast query results.",
    "- Database: PostgreSQL for user data, feeds, experiments, and analytics.",
    "- Auth: Clerk free tier for user sign-in and access control.",
    "", 
    "How to use Svivva to build FeedOS without coding the whole product from scratch:",
    "1. Identify the existing Svivva pages you can reuse and extend for the FeedOS experience.",
    "2. Add a dedicated integration module inside Svivva for FeedOS intelligence and Pyracrypt model orchestration.",
    "3. Build incrementally: first launch a feed page, mood selector, and X-ray panel; then add taste graphs and mini-app builder.",
    "4. Use Svivva's growth and marketing automation to launch each mini-app as a product experiment, not just a feature.",
    "", 
    "Mini-app ideas to deploy from Svivva:",
    "- Trend tracker: daily viral topic heatmap and content surge alerts.",
    "- Niche feed: curated recommendations for specific interests like fashion, streetwear, or micro-learning.",
    "- Creator dashboard: discovery score, audience fit, and creator growth signals.",
    "- Mood feed: personalized playlists for Creative Inspiration, Deep Focus, Calm, or Music Discovery.",
    "- Audience analyzer: sentiment, engagement style, and attention signals for a target segment.",
    "- Research lab: generate niche topic briefs, competitor summaries, and micro-trend insights.",
    "", 
    "Marketing and launch playbook:",
    "- Use Svivva to generate landing pages for each mini-app, then A/B test headlines and CTAs.",
    "- Create social content, email sequences, and TikTok scripts from the same AI engine that fuels FeedOS insights.",
    "- Build waitlists and referral incentives inside Svivva so each new mini-app can be promoted as a launch feature.",
    "- Track conversion events in the analytics dashboard and iterate on the highest-performing growth loop.",
    "", 
    "Practical MVP rollout in under 2 weeks:",
    "Week 1: wire data ingestion, launch one feed page, connect Pyracrypt AI generation, and set up user auth.",
    "Week 2: add mood selector, X-ray explanation layer, mini-app template, and marketing page with growth triggers.",
    "Keep scope narrow: one source, one mood feed, one marketing funnel, one analytics dashboard.",
    "", 
    "What to do immediately in the deployed app:",
    "- Use Svivva's existing deployment to host the front end and management UI.",
    "- Connect an active PostgreSQL + Redis environment via Vercel or Railway/Supabase to support FeedOS data and queues.",
    "- Use Pyracrypt for secure local model endpoints and prompt orchestration rather than expensive cloud AI services.",
    "", 
    "How to market this using Svivva and Pyracrypt together:",
    "- Sell FeedOS as an AI attention OS powered by Svivva's growth and mini-app engine.",
    "- Position Svivva as the platform and Pyracrypt as the intelligence / privacy layer.",
    "- Publish campaign pages, viral scripts, SEO tools, and creator showcases from Svivva's marketing engine.",
    "- Use mini-app releases to generate new launch moments and audience experiments.",
    "", 
    "Scale plan:",
    "- Keep the first launch cheap with local open-source models and Vercel free tier front end.",
    "- Use pgvector + Redis caching to make feed scoring fast without large cloud AI costs.",
    "- Add new sources and more advanced model variants only after the initial MVP shows engagement.",
    "- Expand to more Svivva mini-app templates and automation recipes as growth tools for users.",
    "", 
    "Key success path:",
    "Make Svivva the platform, not a separate app. Let FeedOS become the intelligence layer that adds value through content understanding, recommendations, and marketing automation.",
    "Use Pyracrypt to keep the AI stack low-cost, secure, and model-flexible.",
    "Focus first on product-market fit with one feed, one mood experience, and one mini-app launch story.",
]

out_path = Path(__file__).parent.parent / "FeedOS-Svivva-Pyracrypt-Guide.pdf"
make_pdf(out_path, guide_lines)
print(f"Created {out_path}")
