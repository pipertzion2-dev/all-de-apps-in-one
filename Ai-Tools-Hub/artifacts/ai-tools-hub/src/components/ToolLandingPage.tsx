import { useEffect } from 'react';
import { Link } from 'wouter';
import { Tool, getRelatedTools, ALL_TOOLS } from '../data/tools';

interface Props {
  tool: Tool;
  onLaunch: () => void;
}

export default function ToolLandingPage({ tool, onLaunch }: Props) {
  const related = getRelatedTools(tool, 4);

  useEffect(() => {
    document.title = `${tool.name} — Free AI Tool | svivva-tools`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', tool.description);

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: tool.name,
      description: tool.description,
      applicationCategory: 'WebApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: `https://svivva.com/${tool.slug}`,
    };
    let script = document.getElementById('ld-json') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'ld-json';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(ld);

    return () => {
      document.title = 'svivva-tools — Free AI Tools';
    };
  }, [tool]);

  return (
    <div className="tool-landing">
      <section className="tool-hero">
        <span className="tool-category-badge">{tool.category}</span>
        <h1>{tool.name}</h1>
        <p className="tool-tagline">{tool.tagline}</p>
        <p className="tool-desc">{tool.description}</p>
        <div className="tool-hero-cta">
          <button className="btn-launch" onClick={onLaunch}>
            Try {tool.name} Free →
          </button>
          <a
            className="btn-upgrade"
            href="https://svivva.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Unlock All 50+ Tools
          </a>
        </div>
      </section>

      <section className="tool-features">
        <h2>What it does</h2>
        <ul className="features-grid">
          {tool.features.map((f) => (
            <li key={f}>
              <span className="feature-check">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="tool-steps">
        <h2>How to use it</h2>
        <ol className="steps-list">
          {tool.steps.map((s, i) => (
            <li key={i}>
              <span className="step-num">{i + 1}</span>
              <div>
                <strong>{s.step}</strong>
                <p>{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="tool-faq">
        <h2>Frequently asked questions</h2>
        <div className="faq-list">
          {tool.faqs.map((faq) => (
            <details key={faq.q} className="faq-item">
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="marketing-funnel">
        <div className="funnel-inner">
          <h2>Ready for the full Svivva suite?</h2>
          <p>
            These tools are a preview of what Svivva can do. The full platform gives you AI
            pipelines, team collaboration, production exports, and 50+ tools in one place.
          </p>
          <div className="funnel-ctas">
            <a
              href="https://svivva.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="funnel-btn primary"
            >
              Create Free Account →
            </a>
            <a
              href="https://svivva.com"
              target="_blank"
              rel="noopener noreferrer"
              className="funnel-btn secondary"
            >
              Learn about Svivva
            </a>
          </div>
          <p className="funnel-note">No credit card required · Free to start</p>
        </div>
      </section>

      <section className="related-tools">
        <h2>More free AI tools</h2>
        <div className="related-grid">
          {related.map((t) => (
            <Link key={t.slug} to={`/${t.slug}`} className="related-card">
              <span className="related-cat">{t.category}</span>
              <strong>{t.name}</strong>
              <p>{t.tagline}</p>
            </Link>
          ))}
        </div>
        <div className="all-tools-link">
          <Link to="/">← Browse all {ALL_TOOLS.length} free tools</Link>
        </div>
      </section>
    </div>
  );
}
