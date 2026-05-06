import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LANDINGS, ROTHCO_THEMES, TOOLS } from "../data/toolsRegistry";
import { CyberWavyCTA } from "../components/CyberWavyCTA";
import { NavBar } from "../components/NavBar";
import { ThemedShell } from "../components/ThemedShell";

const hubTheme = ROTHCO_THEMES[0]!;

export function Hub() {
  return (
    <ThemedShell theme={hubTheme}>
      <Helmet>
        <title>Free Cybersecurity Tools Online | SSL, DNS, Headers, JWT — CyberWavy Hub</title>
        <meta
          name="description"
          content="40+ free online security tools: SSL certificate checker, DNS lookup, security headers test, JWT decoder, CORS checker, password strength, CVSS calculator, OWASP checklist. No sign-up. Powered by Pyracrypt."
        />
        <meta
          name="keywords"
          content="free cybersecurity tools, online security checker, SSL checker free, DNS lookup, security headers test, JWT decoder, password strength checker, website security scan"
        />
        <meta property="og:title" content="Free Cybersecurity Tools Online | CyberWavy Hub" />
        <meta
          property="og:description"
          content="Free SSL, DNS, headers, JWT, CORS, and password tools in one hub — powered by Pyracrypt AI security."
        />
      </Helmet>
      <NavBar />

      <div className="hub-hero">
        <div className="hub-hero-content">
          <div className="hub-hero-badge app-title">⬡ 40+ Free Tools · No Sign-Up Required</div>
          <h1 className="app-title">Free Cybersecurity Tools Online</h1>
          <p className="hub-hero-tagline">
            SSL checker, DNS lookup, security headers test, JWT decoder, CORS checker, password strength, CVSS calculator — all free, all in your browser. Bring findings into Pyracrypt for full AI-powered scanning.
          </p>
        </div>
      </div>

      <CyberWavyCTA headline="These tools find the clues. Pyracrypt finds the breach." />

      <h2 className="app-title section-heading">Mini apps</h2>
      <div className="hub-grid" style={{ marginBottom: "2.5rem" }}>
        {TOOLS.map((t) => (
          <Link key={t.slug} className="hub-link" to={`/tool/${t.slug}`}>
            <div className="hub-tile" style={{ borderLeftColor: t.theme.primary }}>
              <h3>{t.title}</h3>
              <p>{t.shortDescription}</p>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="app-title section-heading">Landing pages</h2>
      <div className="hub-grid">
        {LANDINGS.map((l) => (
          <Link key={l.slug} className="hub-link" to={`/lp/${l.slug}`}>
            <div className="hub-tile" style={{ borderLeftColor: "#6b7c3e" }}>
              <h3>{l.h1}</h3>
              <p className="muted" style={{ fontSize: 12 }}>
                /lp/{l.slug}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </ThemedShell>
  );
}
