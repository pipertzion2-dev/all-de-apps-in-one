import { Link } from "react-router-dom";

const PYRACRYPT_URL = "https://pyracrypt.replit.app";

export function NavBar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="app-title navbar-title">⬡ CyberWavy Tools</span>
      </Link>
      <nav className="navbar-nav">
        <Link className="btn-ghost-nav" to="/">
          All Tools
        </Link>
        <a className="btn-cta-nav" href={PYRACRYPT_URL} target="_blank" rel="noreferrer">
          <img src="/pyracrypt-logo.png" alt="" style={{ height: 16, width: "auto" }} />
          Pyracrypt →
        </a>
      </nav>
    </header>
  );
}
