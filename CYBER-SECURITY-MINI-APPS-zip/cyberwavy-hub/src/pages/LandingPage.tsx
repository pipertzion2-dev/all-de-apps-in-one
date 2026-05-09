import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getLandingBySlug, getToolForLanding } from "../data/toolsRegistry";
import { CyberWavyCTA } from "../components/CyberWavyCTA";
import { NavBar } from "../components/NavBar";
import { ThemedShell } from "../components/ThemedShell";
import { ToolBody } from "../tools/ToolBodies";
import { AiInsightPanel } from "../components/AiInsightPanel";

export function LandingPage() {
  const { slug } = useParams();
  const landing = slug ? getLandingBySlug(slug) : undefined;
  const embed = landing ? getToolForLanding(landing) : undefined;
  const theme = embed?.theme ?? {
    name: "Default",
    primary: "#4b5320",
    accent: "#c4cb9c",
    surface: "#2a2d20",
    ink: "#e8ebdd",
  };

  if (!landing) {
    return (
      <ThemedShell theme={theme}>
        <NavBar />
        <p>Landing page not found.</p>
        <Link to="/">Back to hub</Link>
      </ThemedShell>
    );
  }

  return (
    <ThemedShell theme={theme}>
      <Helmet>
        <title>{landing.h1} | CyberWavy Free Tools</title>
        <meta name="description" content={landing.metaDescription} />
        {embed ? <meta name="keywords" content={embed.keywords} /> : null}
        <meta property="og:title" content={landing.h1} />
        <meta property="og:description" content={landing.metaDescription} />
      </Helmet>
      <NavBar />
      <article>
        <header className="card" style={{ marginBottom: "1rem" }}>
          <p className="breadcrumb">
            <Link to="/">Hub</Link> / lp / {landing.slug}
          </p>
          <h1
            className="app-title"
            style={{
              fontSize: "clamp(1.35rem, 3.5vw, 2rem)",
              margin: "0 0 0.5rem",
              color: "var(--army-light)",
            }}
          >
            {landing.h1}
          </h1>
          <p className="muted">{landing.metaDescription}</p>
        </header>

        <CyberWavyCTA headline="You found a free check. Want the full picture?" />

        <section className="card lp-section" style={{ marginTop: "1rem" }}>
          <h2>Problems we solve</h2>
          <ul>
            {landing.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <h2>How Pyracrypt helps</h2>
          <ul>
            {landing.solutions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <h2>How it works</h2>
          <ol>
            {landing.steps.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </section>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2
            className="app-title"
            style={{
              fontSize: "1.1rem",
              marginTop: 0,
              color: "var(--army-khaki)",
              letterSpacing: "0.05em",
            }}
          >
            Free interactive check
          </h2>
          {embed ? (
            <>
              <p className="muted">Embedded tool: {embed.title}</p>
              <ToolBody slug={embed.slug} />
              <AiInsightPanel
                toolSlug={embed.slug}
                toolTitle={embed.title}
                toolSummary={embed.shortDescription}
              />
            </>
          ) : (
            <p>Tool unavailable.</p>
          )}
        </section>

        <CyberWavyCTA />
      </article>
    </ThemedShell>
  );
}
