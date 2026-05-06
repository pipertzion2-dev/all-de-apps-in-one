import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

const SVIVVA_URL = 'https://svivva.com'

const MODES = [
  {
    slug: 'build',
    label: 'B.U.I.L.D. Flow',
    step: 'Brief → 3D model',
    desc: 'Turn a text description into a production-style 3D model placeholder in one step.',
    href: 'https://svivva.com/build',
  },
  {
    slug: 'hardware',
    label: 'Hardware Pipeline',
    step: 'Concept → Schematic',
    desc: 'Go from a hardware idea to a schematic preview with BOM generation and fabrication exports.',
    href: 'https://svivva.com/hardware',
  },
  {
    slug: 'play',
    label: 'Svivva Play',
    step: 'Intent → Audio clip',
    desc: 'Convert a creative intent into an audio clip preview with full performance routing.',
    href: 'https://svivva.com/play',
  },
  {
    slug: 'idea',
    label: 'Idea Engine',
    step: 'Idea → Report',
    desc: 'Validate any idea with a structured report covering costing, feasibility, and next steps.',
    href: 'https://svivva.com/idea',
  },
  {
    slug: 'team',
    label: 'Team Collaboration',
    step: 'Scenario → Setup map',
    desc: 'Map out team roles, permissions, and shared project structure in seconds.',
    href: 'https://svivva.com/team',
  },
  {
    slug: 'marketplace',
    label: 'API Marketplace',
    step: 'Publish → Flow',
    desc: 'Preview how your workflow publishes as a versioned, documented API endpoint.',
    href: 'https://svivva.com/marketplace',
  },
]

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Write a brief',
    body: 'Describe what you want to build in plain language. No special syntax, no 3D software knowledge required.',
  },
  {
    num: '02',
    title: 'Pick a mode',
    body: 'Choose from six workflow modes — Build, Hardware, Play, Idea, Team, or Marketplace. Each maps to a real Svivva pipeline step.',
  },
  {
    num: '03',
    title: 'Get your preview',
    body: 'In under 3 seconds you get a production-style preview with a readiness score and a clear path into the full Svivva workflow.',
  },
]

const OUTCOMES = [
  'Validate an idea before committing engineering time',
  'Share a production-style preview with collaborators instantly',
  'Understand exactly which Svivva workflow step solves your problem',
  'Go from zero to preview without installing any software',
  'Use the same pipeline step that Svivva runs in production',
]

function track(event: string, data?: Record<string, string>) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag('event', event, data)
  }
  console.log('[analytics]', event, data)
}

export default function LandingPage() {
  const navigate = useNavigate()

  const goToTool = useCallback(() => {
    track('landing CTA click', { type: 'tool' })
    navigate('/tool')
  }, [navigate])

  const goToSvivva = useCallback(() => {
    track('landing CTA click', { type: 'svivva' })
    window.open(SVIVVA_URL, '_blank')
  }, [])

  return (
    <div className="lp">

      <nav className="lp-nav">
        <a href={SVIVVA_URL} className="lp-nav-logo" target="_blank" rel="noopener noreferrer">Svivva</a>
        <div className="lp-nav-actions">
          <button type="button" className="lp-nav-tool" onClick={goToTool}>Try the free tool</button>
          <button type="button" className="lp-nav-cta" onClick={goToSvivva}>Start on Svivva →</button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">Free · No account · Instant</div>
          <h1 className="lp-h1">Free Text to 3D Model Generator Online</h1>
          <p className="lp-sub">
            Type a brief description. Get a production-style 3D model preview in under 3 seconds.
            One step of Svivva's real AI pipeline — no software, no sign-up, no friction.
          </p>
          <div className="lp-hero-ctas">
            <button type="button" className="lp-btn-primary" onClick={goToTool}>
              Generate your 3D preview free
            </button>
            <button type="button" className="lp-btn-secondary" onClick={goToSvivva}>
              Start the full workflow on Svivva →
            </button>
          </div>
          <div className="lp-trust">
            <span>No credit card</span>
            <span aria-hidden="true">·</span>
            <span>No software to install</span>
            <span aria-hidden="true">·</span>
            <span>Results in &lt;3 seconds</span>
            <span aria-hidden="true">·</span>
            <span>Powered by Svivva</span>
          </div>
        </div>
      </section>

      <section className="lp-problem">
        <div className="lp-section-inner">
          <div className="lp-problem-grid">
            <div className="lp-problem-col">
              <h2 className="lp-section-h2">The old way</h2>
              <ul className="lp-problem-list">
                <li>Open Blender, Fusion 360, or similar</li>
                <li>Spend hours learning the interface</li>
                <li>Build from scratch before you know if the idea is worth it</li>
                <li>Export, share, iterate — all before a single validation</li>
              </ul>
            </div>
            <div className="lp-problem-divider" aria-hidden="true">vs</div>
            <div className="lp-problem-col lp-problem-col--right">
              <h2 className="lp-section-h2 lp-section-h2--accent">With this tool</h2>
              <ul className="lp-problem-list lp-problem-list--accent">
                <li>Type a description in plain language</li>
                <li>Pick a mode and click Generate</li>
                <li>Get a production-style preview in under 3 seconds</li>
                <li>Validate, share, and open the full Svivva workflow when ready</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-how">
        <div className="lp-section-inner">
          <h2 className="lp-section-h2 lp-center">How it works</h2>
          <p className="lp-section-sub lp-center">Three steps. Under 3 seconds. No account required.</p>
          <div className="lp-steps">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.num} className="lp-step">
                <span className="lp-step-num">{s.num}</span>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-body">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="lp-how-cta">
            <button type="button" className="lp-btn-primary" onClick={goToTool}>
              Try it now — free
            </button>
          </div>
        </div>
      </section>

      <section className="lp-outcomes">
        <div className="lp-section-inner">
          <h2 className="lp-section-h2">What you can do with your preview</h2>
          <ul className="lp-outcome-list">
            {OUTCOMES.map((o) => (
              <li key={o} className="lp-outcome-item">
                <span className="lp-outcome-check" aria-hidden="true">✓</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-modes">
        <div className="lp-section-inner">
          <h2 className="lp-section-h2 lp-center">Six workflow modes. One tool.</h2>
          <p className="lp-section-sub lp-center">
            Each mode maps to a real step inside <a href={SVIVVA_URL} target="_blank" rel="noopener noreferrer">Svivva's platform</a>.
            Preview any one of them for free, then unlock the full pipeline.
          </p>
          <div className="lp-modes-grid">
            {MODES.map((m) => (
              <a
                key={m.slug}
                href={m.href}
                className="lp-mode-card"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('mode card click', { mode: m.slug })}
              >
                <span className="lp-mode-step">{m.step}</span>
                <h3 className="lp-mode-label">{m.label}</h3>
                <p className="lp-mode-desc">{m.desc}</p>
                <span className="lp-mode-link">Explore on Svivva →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-final-cta">
        <div className="lp-section-inner lp-center">
          <h2 className="lp-final-h2">Ready to skip the preview and build for real?</h2>
          <p className="lp-final-sub">
            The free tool shows you one step. Svivva gives you the entire pipeline — versioning, collaboration, cost tracking, and production-ready exports for hardware, audio, product, and team workflows.
          </p>
          <div className="lp-final-ctas">
            <button type="button" className="lp-btn-primary lp-btn-large" onClick={goToSvivva}>
              Start free on Svivva →
            </button>
            <button type="button" className="lp-btn-ghost" onClick={goToTool}>
              Or try the free preview tool first
            </button>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <a href={SVIVVA_URL} target="_blank" rel="noopener noreferrer">Svivva</a>
            <span>AI-assisted workflows for hardware, music, product, and team.</span>
          </div>
          <div className="lp-footer-links">
            <a href="https://svivva.com/build" target="_blank" rel="noopener noreferrer">B.U.I.L.D.</a>
            <a href="https://svivva.com/hardware" target="_blank" rel="noopener noreferrer">Hardware</a>
            <a href="https://svivva.com/play" target="_blank" rel="noopener noreferrer">Play</a>
            <a href="https://svivva.com/idea" target="_blank" rel="noopener noreferrer">Idea Engine</a>
            <a href="https://svivva.com/team" target="_blank" rel="noopener noreferrer">Team</a>
            <a href="https://svivva.com/marketplace" target="_blank" rel="noopener noreferrer">Marketplace</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
