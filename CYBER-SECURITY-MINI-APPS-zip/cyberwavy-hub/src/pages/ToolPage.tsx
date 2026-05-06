import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getToolBySlug } from "../data/toolsRegistry";
import { CyberWavyCTA } from "../components/CyberWavyCTA";
import { NavBar } from "../components/NavBar";
import { ThemedShell } from "../components/ThemedShell";
import { ToolBody } from "../tools/ToolBodies";
import { AiInsightPanel } from "../components/AiInsightPanel";

export function ToolPage() {
  const { slug } = useParams();
  const tool = slug ? getToolBySlug(slug) : undefined;
  if (!tool) {
    return (
      <ThemedShell theme={{ name: "", primary: "#4b5320", accent: "#c4cb9c", surface: "#2a2d20", ink: "#e8ebdd" }}>
        <NavBar />
        <p>Tool not found.</p>
        <Link to="/">Back to hub</Link>
      </ThemedShell>
    );
  }
  return (
    <ThemedShell theme={tool.theme}>
      <Helmet>
        <title>{tool.title} | CyberWavy Free Tools</title>
        <meta name="description" content={tool.shortDescription} />
        <meta name="keywords" content={tool.keywords} />
        <meta property="og:title" content={tool.title} />
        <meta property="og:description" content={tool.shortDescription} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: tool.title,
            description: tool.shortDescription,
            applicationCategory: "SecurityApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            operatingSystem: "Web",
          })}
        </script>
      </Helmet>
      <NavBar />
      <div className="card">
        <p className="breadcrumb">
          <Link to="/">Hub</Link> / tool / {tool.slug}
        </p>
        <h1 className="app-title" style={{ fontSize: "1.5rem", margin: "0 0 0.75rem", color: "var(--army-light)" }}>
          {tool.title}
        </h1>
        <p className="muted">{tool.shortDescription}</p>
        <div style={{ marginTop: "1.25rem" }}>
          <ToolBody slug={tool.slug} />
        </div>
        <AiInsightPanel toolSlug={tool.slug} toolTitle={tool.title} toolSummary={tool.shortDescription} />
      </div>
      <CyberWavyCTA />
    </ThemedShell>
  );
}
