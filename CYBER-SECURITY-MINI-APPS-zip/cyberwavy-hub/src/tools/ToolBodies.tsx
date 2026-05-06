import { useCallback, useMemo, useState } from "react";
import { queryDns } from "../lib/dns";
import { sha256Hex } from "../lib/hash";
import { Spinner } from "../components/Spinner";

function entropyBits(pwd: string): number {
  const pool = new Set(pwd.split(""));
  const size = pool.size || 1;
  const len = pwd.length || 0;
  return Math.round(len * Math.log2(Math.min(95, Math.max(2, size))));
}

function PasswordStrength(): JSX.Element {
  const [pwd, setPwd] = useState("");
  const [len, setLen] = useState(20);
  const [gen, setGen] = useState("");
  const bits = entropyBits(pwd);
  const tier = bits > 80 ? "Strong" : bits > 55 ? "Moderate" : bits > 35 ? "Weak" : "Very weak";
  const genPass = useCallback(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}";
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    let s = "";
    for (let i = 0; i < len; i++) s += chars[arr[i]! % chars.length];
    setGen(s);
    setPwd(s);
  }, [len]);
  return (
    <div className="stack">
      <div>
        <label>Password (never sent to any server)</label>
        <input type="password" autoComplete="off" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Type or generate below" />
      </div>
      <div className="row">
        <span className="badge">{tier}</span>
        <span className="muted">~{bits} bits entropy (rough)</span>
      </div>
      <p className="muted">Prefer a password manager, long passphrases, and unique secrets per site.</p>
      <div className="card" style={{ background: "rgba(255,255,255,0.4)" }}>
        <label>Secure generator</label>
        <div className="row">
          <input type="number" min={12} max={64} value={len} onChange={(e) => setLen(+e.target.value)} style={{ maxWidth: "100px" }} />
          <button type="button" className="btn-primary" onClick={genPass}>
            Generate
          </button>
        </div>
        {gen ? (
          <pre style={{ marginTop: "0.5rem", wordBreak: "break-all", fontSize: 13 }}>{gen}</pre>
        ) : null}
      </div>
    </div>
  );
}

function SslInspector(): JSX.Element {
  const [host, setHost] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [records, setRecords] = useState<string[]>([]);
  const run = async () => {
    setLoading(true);
    setMsg(null);
    setRecords([]);
    try {
      const h = host.replace(/^https?:\/\//i, "").split("/")[0] ?? "";
      if (!h) throw new Error("Enter a hostname");
      const ans = await queryDns(h, "A");
      setRecords(ans.map((a) => a.data));
      setMsg("DNS A records resolved. For certificate expiry and chain, use the SSLLabs link below (server-side test).");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="stack">
      <label>Hostname</label>
      <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="example.com" />
      <button type="button" className="btn-primary" onClick={run} disabled={loading}>
        Resolve host
      </button>
      {loading ? <Spinner /> : null}
      {msg ? <p>{msg}</p> : null}
      {records.length > 0 ? (
        <ul>
          {records.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
      <a className="btn-primary btn-ghost" href={`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(host)}`} target="_blank" rel="noreferrer">
        Open SSL Labs test
      </a>
    </div>
  );
}

function parseHeaderBlock(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/);
  const out: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim().toLowerCase();
    const v = line.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = v;
  }
  return out;
}

function SecurityHeadersGrader(): JSX.Element {
  const [raw, setRaw] = useState("");
  const grade = useMemo(() => {
    const h = parseHeaderBlock(raw);
    let score = 0;
    const max = 6;
    if (h["strict-transport-security"]) score++;
    if (h["content-security-policy"] || h["content-security-policy-report-only"]) score++;
    if (h["x-frame-options"] || (h["content-security-policy"] && /frame-ancestors/i.test(h["content-security-policy"]!))) score++;
    if (h["x-content-type-options"]?.toLowerCase().includes("nosniff")) score++;
    if (h["referrer-policy"]) score++;
    if (h["permissions-policy"] || h["feature-policy"]) score++;
    const pct = (score / max) * 100;
    const g = pct >= 85 ? "A" : pct >= 70 ? "B" : pct >= 55 ? "C" : pct >= 40 ? "D" : "F";
    return { g, score, max, h };
  }, [raw]);
  return (
    <div className="stack">
      <label>Paste HTTP response headers</label>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="strict-transport-security: ..." />
      <div className="row">
        <span className="badge">Grade {grade.g}</span>
        <span className="muted">
          {grade.score}/{grade.max} core headers present
        </span>
      </div>
      <ul className="muted">
        <li>HSTS: {grade.h["strict-transport-security"] ? "present" : "missing"}</li>
        <li>CSP: {grade.h["content-security-policy"] ? "present" : "missing"}</li>
        <li>Framing: {grade.h["x-frame-options"] || /frame-ancestors/i.test(grade.h["content-security-policy"] || "") ? "present" : "missing"}</li>
      </ul>
    </div>
  );
}

function HttpHeadersAnalyzer(): JSX.Element {
  const [raw, setRaw] = useState("");
  const analysis = useMemo(() => {
    const h = parseHeaderBlock(raw);
    const flags: string[] = [];
    const lower = raw.toLowerCase();
    if (/received:/i.test(raw)) flags.push("SMTP Received chain detected — trace routing hops for spoofing.");
    if (/spf/i.test(lower) || h["authentication-results"]) flags.push("Authentication-Results / SPF hints present.");
    if (/return-path:/i.test(raw)) flags.push("Return-Path present — compare to From domain.");
    if (/(http|https):\/\//i.test(raw)) flags.push("URLs in source — hover carefully; prefer copying to a sandbox.");
    if (Object.keys(h).length === 0) flags.push("Paste raw message source or HTTP headers.");
    else flags.push(`Parsed ${Object.keys(h).length} header keys.`);
    return flags;
  }, [raw]);
  return (
    <div className="stack">
      <label>Paste raw email source or HTTP headers</label>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} />
      <ul>
        {analysis.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

function CorsChecker(): JSX.Element {
  const [raw, setRaw] = useState("");
  const res = useMemo(() => {
    const h = parseHeaderBlock(raw);
    const acao = h["access-control-allow-origin"];
    const acac = h["access-control-allow-credentials"];
    const acam = h["access-control-allow-methods"];
    const risks: string[] = [];
    if (acao === "*") risks.push("ACAO is * — any origin can read responses in permissive browsers.");
    if (acao && acac?.toLowerCase() === "true") risks.push("Credentials with explicit ACAO can be powerful — ensure tight origin allowlists.");
    if (!acao) risks.push("No ACAO observed — likely not CORS-enabled for cross-origin XHR (default same-origin).");
    if (acam?.includes("*")) risks.push("Wildcard methods may be overly broad.");
    return { acao, acac, acam, risks };
  }, [raw]);
  return (
    <div className="stack">
      <label>Paste CORS-related response headers</label>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="access-control-allow-origin: ..." />
      <ul className="muted">
        <li>access-control-allow-origin: {res.acao ?? "—"}</li>
        <li>access-control-allow-credentials: {res.acac ?? "—"}</li>
        <li>access-control-allow-methods: {res.acam ?? "—"}</li>
      </ul>
      <ul>
        {res.risks.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

function UrlSafetyScanner(): JSX.Element {
  const [u, setU] = useState("");
  const notes = useMemo(() => {
    const out: string[] = [];
    try {
      const url = new URL(u.includes("://") ? u : `https://${u}`);
      if (url.username || url.password) out.push("Embedded credentials in URL — high risk if shared or logged.");
      if (["http:"].includes(url.protocol)) out.push("HTTP cleartext — easy to intercept or tamper.");
      const host = url.hostname;
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) out.push("IP literal host — sometimes used in phishing.");
      if (host.split(".").length > 4) out.push("Long subdomain chain — inspect for homoglyphs.");
      if (/@(?!\/)/.test(url.pathname + url.search)) out.push("Unusual @ placement in path — classic phishing trick.");
      out.push(`Host: ${host} — verify registrable domain carefully.`);
    } catch {
      out.push("Invalid URL — check scheme and host.");
    }
    return out;
  }, [u]);
  return (
    <div className="stack">
      <label>URL</label>
      <input value={u} onChange={(e) => setU(e.target.value)} placeholder="https://example.com/path" />
      <ul>
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

function DnsRecordViewer(): JSX.Element {
  const [name, setName] = useState("");
  const [type, setType] = useState("A");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    setLoading(true);
    setErr(null);
    setRows([]);
    try {
      const ans = await queryDns(name, type);
      setRows(ans.map((a) => a.data));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="stack">
      <label>Domain</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="example.com" />
      <label>Record type</label>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {["A", "AAAA", "MX", "TXT", "NS", "CNAME"].map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button type="button" className="btn-primary" onClick={run} disabled={loading || !name}>
        Query (DNS-over-HTTPS)
      </button>
      {loading ? <Spinner /> : null}
      {err ? <p>{err}</p> : null}
      <ul>
        {rows.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

function IpReputation(): JSX.Element {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const run = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip.trim())}`);
      const j = (await res.json()) as Record<string, unknown>;
      setData(j);
    } catch {
      setData({ error: true });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="stack">
      <label>IPv4 / IPv6</label>
      <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="1.1.1.1" />
      <button type="button" className="btn-primary" onClick={run} disabled={loading || !ip}>
        Lookup
      </button>
      {loading ? <Spinner /> : null}
      {data && !data.error ? (
        <pre style={{ fontSize: 12, overflow: "auto" }}>{JSON.stringify(data, null, 2)}</pre>
      ) : null}
      {data?.error ? <p>Lookup failed (CORS or network).</p> : null}
    </div>
  );
}

function JwtDecoder(): JSX.Element {
  const [tok, setTok] = useState("");
  const parsed = useMemo(() => {
    const parts = tok.trim().split(".");
    if (parts.length < 2) return { err: "Need header.payload[.signature]" };
    try {
      const decode = (s: string) => JSON.parse(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")));
      const header = decode(parts[0]!);
      const payload = decode(parts[1]!);
      const alg = (header as { alg?: string }).alg;
      const warnings: string[] = [];
      if (alg?.toLowerCase() === "none") warnings.push('Algorithm "none" — never accept unsigned JWTs.');
      if (alg === "HS256" && (payload as { sub?: string }).sub) warnings.push("HS256 relies on shared secret — verify issuer key management.");
      return { header, payload, warnings };
    } catch {
      return { err: "Invalid Base64url segments" };
    }
  }, [tok]);
  return (
    <div className="stack">
      <label>Paste JWT</label>
      <textarea value={tok} onChange={(e) => setTok(e.target.value)} />
      {"err" in parsed && parsed.err ? (
        <p>{parsed.err}</p>
      ) : (
        <>
          <h3 className="app-title" style={{ fontSize: "1rem" }}>
            Header
          </h3>
          <pre style={{ fontSize: 12 }}>{JSON.stringify(parsed.header, null, 2)}</pre>
          <h3 className="app-title" style={{ fontSize: "1rem" }}>
            Payload
          </h3>
          <pre style={{ fontSize: 12 }}>{JSON.stringify(parsed.payload, null, 2)}</pre>
          <ul>
            {(parsed.warnings ?? []).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Base64HashToolkit(): JSX.Element {
  const [text, setText] = useState("");
  const [hash, setHash] = useState("");
  const enc = () => setHash(btoa(unescape(encodeURIComponent(text))));
  const dec = () => {
    try {
      setHash(decodeURIComponent(escape(atob(text))));
    } catch {
      setHash("Invalid base64");
    }
  };
  const h256 = async () => setHash(await sha256Hex(text));
  return (
    <div className="stack">
      <label>Text</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div className="row">
        <button type="button" className="btn-primary" onClick={enc}>
          To Base64
        </button>
        <button type="button" className="btn-primary btn-ghost" onClick={dec}>
          From Base64
        </button>
        <button type="button" className="btn-primary btn-ghost" onClick={h256}>
          SHA-256
        </button>
      </div>
      {hash ? <pre style={{ wordBreak: "break-all" }}>{hash}</pre> : null}
    </div>
  );
}

const SUBS = ["www", "api", "app", "dev", "staging", "admin", "vpn", "mail", "cdn", "test", "beta"];

function SubdomainFinderLite(): JSX.Element {
  const [apex, setApex] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const run = async () => {
    setLoading(true);
    setFound([]);
    const hits: string[] = [];
    try {
      for (const s of SUBS) {
        const name = `${s}.${apex.replace(/^\.+/, "")}`;
        try {
          const ans = await queryDns(name, "A");
          if (ans.length) hits.push(name);
        } catch {
          /* skip */
        }
      }
      setFound(hits);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="stack">
      <label>Apex domain</label>
      <input value={apex} onChange={(e) => setApex(e.target.value)} placeholder="example.com" />
      <button type="button" className="btn-primary" onClick={run} disabled={loading || !apex}>
        Probe common hostnames
      </button>
      {loading ? <Spinner /> : null}
      <ul>
        {found.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {found.length === 0 && !loading ? <p className="muted">No hits from the small built-in wordlist (not exhaustive).</p> : null}
    </div>
  );
}

const PORTS = [
  [21, "FTP"],
  [22, "SSH"],
  [23, "Telnet"],
  [25, "SMTP"],
  [53, "DNS"],
  [80, "HTTP"],
  [110, "POP3"],
  [135, "RPC"],
  [139, "NetBIOS"],
  [143, "IMAP"],
  [443, "HTTPS"],
  [445, "SMB"],
  [3306, "MySQL"],
  [3389, "RDP"],
  [5432, "PostgreSQL"],
  [5900, "VNC"],
  [6379, "Redis"],
  [8080, "HTTP-Alt"],
  [8443, "HTTPS-Alt"],
  [27017, "MongoDB"],
];

function OpenPortChecker(): JSX.Element {
  return (
    <div className="stack">
      <p className="muted">Browsers cannot port-scan arbitrary hosts. Use this table to audit your own infrastructure with a real scanner; CyberWavy maps full ranges server-side.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Port</th>
            <th style={{ textAlign: "left" }}>Service</th>
          </tr>
        </thead>
        <tbody>
          {PORTS.map(([p, s]) => (
            <tr key={p}>
              <td>{p}</td>
              <td>{s}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function fetchViaProxy(target: string): Promise<string> {
  const u = `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`;
  const res = await fetch(u);
  const j = (await res.json()) as { contents?: string };
  return j.contents ?? "";
}

function RobotsTxtAnalyzer(): JSX.Element {
  const [host, setHost] = useState("");
  const [paste, setPaste] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string[]>([]);
  const analyze = (text: string) => {
    const lines = text.split(/\r?\n/);
    const interesting = lines.filter((l) => /disallow|allow|sitemap|admin|api|\.env|backup/i.test(l));
    setOut(interesting.length ? interesting : lines.slice(0, 40));
  };
  const fetchRobots = async () => {
    setLoading(true);
    try {
      const url = host.startsWith("http") ? new URL(host).origin : `https://${host.replace(/\/$/, "")}`;
      const body = await fetchViaProxy(`${url}/robots.txt`);
      setPaste(body);
      analyze(body);
    } catch {
      setOut(["Fetch failed — paste robots.txt manually."]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="stack">
      <label>Site origin (fetch via proxy)</label>
      <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="https://example.com" />
      <button type="button" className="btn-primary" onClick={fetchRobots} disabled={loading || !host}>
        Fetch robots.txt
      </button>
      {loading ? <Spinner /> : null}
      <label>Or paste robots.txt</label>
      <textarea value={paste} onChange={(e) => setPaste(e.target.value)} />
      <button type="button" className="btn-primary btn-ghost" onClick={() => analyze(paste)}>
        Analyze
      </button>
      <ul>
        {out.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function SitemapParser(): JSX.Element {
  const [xml, setXml] = useState("");
  const urls = useMemo(() => {
    try {
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      const locs = [...doc.querySelectorAll("loc")].map((n) => n.textContent?.trim()).filter(Boolean) as string[];
      return locs;
    } catch {
      return [];
    }
  }, [xml]);
  return (
    <div className="stack">
      <label>Paste sitemap XML</label>
      <textarea value={xml} onChange={(e) => setXml(e.target.value)} />
      <p className="muted">URLs found: {urls.length}</p>
      <ul style={{ maxHeight: 240, overflow: "auto", fontSize: 13 }}>
        {urls.slice(0, 200).map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
    </div>
  );
}

function EmailBreachChecker(): JSX.Element {
  const [email, setEmail] = useState("");
  const [mx, setMx] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    setMx([]);
    try {
      const domain = email.split("@")[1];
      if (!domain) return;
      const ans = await queryDns(domain, "MX");
      setMx(ans.map((a) => a.data.replace(/\.$/, "")));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hibp = `https://haveibeenpwned.com/account/${encodeURIComponent(email)}`;
  return (
    <div className="stack">
      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />
      <button type="button" className="btn-primary" onClick={run} disabled={!valid || loading}>
        Lookup MX records
      </button>
      {loading ? <Spinner /> : null}
      <ul>
        {mx.map((m) => (
          <li key={m}>MX: {m}</li>
        ))}
      </ul>
      <p className="muted">Breach data is checked on Have I Been Pwned in your browser (we never store your email).</p>
      <a className="btn-primary" href={hibp} target="_blank" rel="noreferrer">
        Open Have I Been Pwned
      </a>
    </div>
  );
}

const SECRET_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "AWS key", re: /AKIA[0-9A-Z]{16}/g },
  { label: "GitHub PAT (classic)", re: /ghp_[A-Za-z0-9]{20,}/g },
  { label: "Slack token", re: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { label: "Google API key", re: /AIza[0-9A-Za-z\-_]{20,}/g },
  { label: "Private key block", re: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g },
];

function GithubSecretScanner(): JSX.Element {
  const [text, setText] = useState("");
  const hits = useMemo(() => {
    const out: { label: string; match: string }[] = [];
    for (const { label, re } of SECRET_PATTERNS) {
      const m = text.match(re);
      if (m) m.forEach((x) => out.push({ label, match: x }));
    }
    return out;
  }, [text]);
  return (
    <div className="stack">
      <label>Paste text (logs, CI output, snippet)</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <p className="muted">Matches {hits.length} suspicious patterns (rotate any real secrets immediately).</p>
      <ul>
        {hits.map((h, i) => (
          <li key={`${i}-${h.match}`}>
            {h.label}: <code>{h.match}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CookieAnalyzer(): JSX.Element {
  const [raw, setRaw] = useState("");
  const cookies = useMemo(() => {
    return raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const semi = line.split(";");
        const [nv] = semi;
        const name = nv?.split("=")[0]?.trim() ?? "";
        const rest = semi.slice(1).join(";");
        const secure = /;\s*Secure/i.test(`;${rest}`);
        const httpOnly = /;\s*HttpOnly/i.test(`;${rest}`);
        const sameSite = /;\s*SameSite=(\w+)/i.exec(`;${rest}`)?.[1] ?? "—";
        let score = 0;
        if (secure) score++;
        if (httpOnly) score++;
        if (sameSite.toLowerCase() === "strict" || sameSite.toLowerCase() === "lax") score++;
        const grade = score >= 3 ? "A" : score === 2 ? "B" : score === 1 ? "C" : "F";
        return { name, secure, httpOnly, sameSite, grade };
      });
  }, [raw]);
  return (
    <div className="stack">
      <label>Paste Set-Cookie lines</label>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} />
      <ul>
        {cookies.map((c) => (
          <li key={c.name}>
            <strong>{c.name}</strong> — grade {c.grade} (Secure: {c.secure ? "yes" : "no"}, HttpOnly: {c.httpOnly ? "yes" : "no"}, SameSite: {c.sameSite})
          </li>
        ))}
      </ul>
    </div>
  );
}

function ApiKeyTester(): JSX.Element {
  const [key, setKey] = useState("");
  const res = useMemo(() => {
    const k = key.trim();
    if (!k) return ["Enter a key snippet to classify (do not share production secrets)."];
    const out: string[] = [];
    if (/^sk_live_/i.test(k)) out.push("Stripe live secret pattern — revoke if real.");
    if (/^AKIA/i.test(k)) out.push("AWS access key id shape — pair with secret; rotate if exposed.");
    if (/^ghp_/i.test(k)) out.push("GitHub PAT shape — revoke in org settings if real.");
    if (/^xox/i.test(k)) out.push("Slack token shape — rotate if real.");
    if (out.length === 0) out.push("No common high-risk prefix detected — still treat as secret.");
    return out;
  }, [key]);
  return (
    <div className="stack">
      <label>Key material (stays in browser)</label>
      <input value={key} onChange={(e) => setKey(e.target.value)} type="password" autoComplete="off" />
      <ul>
        {res.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

function TlsVersionChecker(): JSX.Element {
  return (
    <div className="stack">
      <p>Modern services should support TLS 1.2+ and disable SSLv3, TLS 1.0, and TLS 1.1. Paste notes from SSL Labs or your scanner below.</p>
      <label>Notes</label>
      <textarea placeholder="TLS 1.3 enabled, TLS 1.0 disabled, ..." />
      <a className="btn-primary btn-ghost" href="https://www.ssllabs.com/ssltest/" target="_blank" rel="noreferrer">
        SSL Labs
      </a>
    </div>
  );
}

function CertTransparency(): JSX.Element {
  const [json, setJson] = useState("");
  const rows = useMemo(() => {
    try {
      const data = JSON.parse(json) as { issuer_name?: string; name_value?: string }[];
      if (!Array.isArray(data)) return [];
      return data.slice(0, 50).map((r) => `${r.issuer_name ?? "?"} — ${r.name_value ?? ""}`);
    } catch {
      return [];
    }
  }, [json]);
  return (
    <div className="stack">
      <label>Paste JSON from crt.sh (?q=domain&amp;output=json)</label>
      <textarea value={json} onChange={(e) => setJson(e.target.value)} />
      <p className="muted">
        Tip: run{" "}
        <code>
          curl -s &quot;https://crt.sh/?q=%25.example.com&amp;output=json&quot;
        </code>{" "}
        from a trusted environment, then paste here.
      </p>
      <ul>
        {rows.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

function round1(x: number) {
  return Math.round(x * 10) / 10;
}

function cvss31Base(vector: string): { score: number; sev: string } | { err: string } {
  const parts = Object.fromEntries(
    vector
      .split("/")
      .filter((p) => p.includes(":"))
      .map((p) => p.split(":") as [string, string])
  ) as Record<string, string>;
  const AV = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }[parts.AV ?? ""];
  const AC = { L: 0.77, H: 0.44 }[parts.AC ?? ""];
  const PR = { N: 0.85, L: 0.62, H: 0.27 }[parts.PR ?? ""];
  const UI = { N: 0.85, R: 0.62 }[parts.UI ?? ""];
  if (AV === undefined || AC === undefined || PR === undefined || UI === undefined) return { err: "bad" };
  const S = parts.S === "C" ? "C" : "U";
  const C = { H: 0.56, L: 0.22, N: 0 }[parts.C ?? "N"] ?? 0;
  const I = { H: 0.56, L: 0.22, N: 0 }[parts.I ?? "N"] ?? 0;
  const A = { H: 0.56, L: 0.22, N: 0 }[parts.A ?? "N"] ?? 0;
  const exploitability = 8.22 * AV * AC * PR * UI;
  let impactSub = 1 - (1 - C) * (1 - I) * (1 - A);
  if (S === "C") impactSub = 7.52 * (impactSub - 0.029) - 3.25 * Math.pow(impactSub - 0.02, 15);
  else impactSub = 6.42 * impactSub;
  const base = S === "C" ? Math.min(10, round1(Math.min(1.08 * (impactSub + exploitability), 10))) : Math.min(10, round1(Math.min(impactSub + exploitability, 10)));
  if (Number.isNaN(base)) return { err: "bad" };
  const sev = base >= 9 ? "Critical" : base >= 7 ? "High" : base >= 4 ? "Medium" : base > 0 ? "Low" : "None";
  return { score: base, sev };
}

function CvssCalculator(): JSX.Element {
  const [vec, setVec] = useState("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
  const res = useMemo(() => cvss31Base(vec.trim()), [vec]);
  return (
    <div className="stack">
      <label>CVSS:3.1 vector</label>
      <input value={vec} onChange={(e) => setVec(e.target.value)} />
      {"err" in res ? (
        <p>Could not parse vector — use form like CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</p>
      ) : (
        <p>
          <span className="badge">
            {res.score} ({res.sev})
          </span>
        </p>
      )}
    </div>
  );
}

const OWASP_Q = [
  "Broken access control reviewed in APIs?",
  "Cryptographic failures addressed (TLS, secrets)?",
  "Injection defenses (param queries, sanitization)?",
  "Insecure design threat-modeled?",
  "Security misconfiguration baselines enforced?",
  "Vulnerable/outdated components tracked?",
  "Identification/authentication failures mitigated?",
  "Software/data integrity failures guarded?",
  "Logging/monitoring/alerting adequate?",
  "SSRF protections on fetches and webhooks?",
];

function OwaspSelfAssessment(): JSX.Element {
  const [ans, setAns] = useState<boolean[]>(() => OWASP_Q.map(() => false));
  const score = ans.filter(Boolean).length;
  const rating = score >= 8 ? "Strong" : score >= 5 ? "Needs work" : "High risk";
  return (
    <div className="stack">
      {OWASP_Q.map((q, i) => (
        <label key={q} className="row" style={{ alignItems: "center", gap: "0.5rem" }}>
          <input type="checkbox" checked={ans[i]} onChange={(e) => setAns((p) => p.map((v, j) => (j === i ? e.target.checked : v)))} />
          {q}
        </label>
      ))}
      <p>
        Score {score}/10 — <span className="badge">{rating}</span>
      </p>
    </div>
  );
}

const SQLI = {
  MySQL: ["' OR '1'='1", "' UNION SELECT NULL--", "admin'--"],
  PostgreSQL: ["' OR 1=1--", "'; SELECT pg_sleep(10)--"],
  MSSQL: ["'; EXEC xp_cmdshell('dir')--", "' OR 1=1--"],
};

function SqliLibrary(): JSX.Element {
  const [db, setDb] = useState<keyof typeof SQLI>("MySQL");
  return (
    <div className="stack">
      <label>Family</label>
      <select value={db} onChange={(e) => setDb(e.target.value as keyof typeof SQLI)}>
        {Object.keys(SQLI).map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <p className="muted">For authorized testing only.</p>
      <ul>
        {SQLI[db].map((p) => (
          <li key={p}>
            <code>{p}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function XssGenerator(): JSX.Element {
  const [mode, setMode] = useState<"reflected" | "dom">("reflected");
  const payload = mode === "reflected" ? `<script>alert(1)</script>` : `javascript:alert(1)`;
  return (
    <div className="stack">
      <label>Mode</label>
      <select value={mode} onChange={(e) => setMode(e.target.value as "reflected" | "dom")}>
        <option value="reflected">Reflected (html context)</option>
        <option value="dom">DOM / URL context</option>
      </select>
      <pre>{payload}</pre>
      <p className="muted">Use only on systems you own or have permission to test.</p>
    </div>
  );
}

function OpenRedirectTester(): JSX.Element {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const note = useMemo(() => {
    try {
      const u1 = new URL(a.includes("://") ? a : `https://x/${a}`);
      const u2 = new URL(b.includes("://") ? b : `https://x/${b}`);
      const q = new URLSearchParams(u1.search);
      const redir = q.get("redirect") || q.get("url") || q.get("next");
      if (redir && b.includes(redir)) return "Redirect parameter appears to forward to target — verify server-side allowlists.";
      return "Compare host, scheme, and encoded parameters manually; look for open redirect parameters.";
    } catch {
      return "Enter full URLs with query strings to compare.";
    }
  }, [a, b]);
  return (
    <div className="stack">
      <label>URL A</label>
      <input value={a} onChange={(e) => setA(e.target.value)} />
      <label>URL B (landing)</label>
      <input value={b} onChange={(e) => setB(e.target.value)} />
      <p>{note}</p>
    </div>
  );
}

function CspEvaluator(): JSX.Element {
  const [csp, setCsp] = useState("");
  const grade = useMemo(() => {
    const issues: string[] = [];
    if (!csp.trim()) return { g: "F", issues: ["Empty CSP"] };
    if (/unsafe-inline/i.test(csp)) issues.push("unsafe-inline weakens XSS defenses.");
    if (/unsafe-eval/i.test(csp)) issues.push("unsafe-eval enables dynamic code execution.");
    if (/\*\./.test(csp) && /script-src/i.test(csp)) issues.push("Broad script-src wildcards are risky.");
    const g = issues.length === 0 ? "A" : issues.length === 1 ? "B" : issues.length === 2 ? "C" : "D";
    return { g, issues };
  }, [csp]);
  return (
    <div className="stack">
      <label>Content-Security-Policy value</label>
      <textarea value={csp} onChange={(e) => setCsp(e.target.value)} />
      <span className="badge">Grade {grade.g}</span>
      <ul>
        {grade.issues.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function ClickjackingTester(): JSX.Element {
  const [raw, setRaw] = useState("");
  const res = useMemo(() => {
    const h = parseHeaderBlock(raw);
    const xfo = h["x-frame-options"];
    const csp = h["content-security-policy"] || "";
    const fa = /frame-ancestors\s+([^;]+)/i.exec(csp)?.[1];
    if (fa) return `CSP frame-ancestors: ${fa}`;
    if (xfo) return `X-Frame-Options: ${xfo}`;
    return "No strong frame protection detected in pasted headers.";
  }, [raw]);
  return (
    <div className="stack">
      <label>Paste response headers</label>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} />
      <p>{res}</p>
    </div>
  );
}

function SsrfPayloadBuilder(): JSX.Element {
  const targets = ["http://169.254.169.254/latest/meta-data/", "http://127.0.0.1:80", "http://localhost:8080/admin", "file:///etc/passwd"];
  return (
    <div className="stack">
      <p className="muted">For authorized assessments only — copy common probe targets:</p>
      <ul>
        {targets.map((t) => (
          <li key={t}>
            <code>{t}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrototypePollutionChecker(): JSX.Element {
  const [code, setCode] = useState("");
  const flags = useMemo(() => {
    const f: string[] = [];
    if (/__proto__/i.test(code)) f.push("__proto__ key — classic pollution gadget.");
    if (/constructor\s*\.prototype/i.test(code)) f.push("constructor.prototype access.");
    if (/merge\s*\(/i.test(code) && /JSON\.parse/i.test(code)) f.push("Deep merge on parsed JSON — verify key allowlists.");
    return f.length ? f : ["No obvious pollution patterns — still review merge utilities."];
  }, [code]);
  return (
    <div className="stack">
      <label>Paste JSON or JavaScript snippet</label>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} />
      <ul>
        {flags.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function DependencyVulnLookup(): JSX.Element {
  const [raw, setRaw] = useState("");
  const pkgs = useMemo(() => {
    try {
      const j = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const names = [...Object.keys(j.dependencies ?? {}), ...Object.keys(j.devDependencies ?? {})];
      return names;
    } catch {
      return [];
    }
  }, [raw]);
  return (
    <div className="stack">
      <label>Paste package.json</label>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} />
      <ul>
        {pkgs.map((p) => (
          <li key={p}>
            {p} —{" "}
            <a href={`https://www.npmjs.com/package/${p}`} target="_blank" rel="noreferrer">
              npm
            </a>{" "}
            ·{" "}
            <a href={`https://github.com/advisories?query=${encodeURIComponent(p)}`} target="_blank" rel="noreferrer">
              advisories
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const NIST_Q = Array.from({ length: 20 }, (_, i) => `Control theme ${i + 1}: formalized policy & ownership?`);

function NistScorecard(): JSX.Element {
  const [yes, setYes] = useState(0);
  return (
    <div className="stack">
      <label>How many can you answer &quot;yes&quot; to? (0–20)</label>
      <input type="range" min={0} max={20} value={yes} onChange={(e) => setYes(+e.target.value)} />
      <p>
        Score {yes}/20 — {yes >= 16 ? "Mature" : yes >= 10 ? "Building" : "Early"}
      </p>
      <ul className="muted" style={{ fontSize: 12 }}>
        {NIST_Q.slice(0, 5).map((q) => (
          <li key={q}>{q}</li>
        ))}
        <li>… plus 15 more governance &amp; technical themes to document.</li>
      </ul>
    </div>
  );
}

function ZeroTrustChecker(): JSX.Element {
  const [id, setId] = useState(3);
  const [dev, setDev] = useState(3);
  const [net, setNet] = useState(3);
  const [data, setData] = useState(3);
  const score = Math.round(((id + dev + net + data) / 20) * 100);
  return (
    <div className="stack">
      <div>
        <label>Identity MFA &amp; SSO strength (1–5)</label>
        <input type="range" min={1} max={5} value={id} onChange={(e) => setId(+e.target.value)} />
      </div>
      <div>
        <label>Device compliance / MDM (1–5)</label>
        <input type="range" min={1} max={5} value={dev} onChange={(e) => setDev(+e.target.value)} />
      </div>
      <div>
        <label>Network segmentation / ZTNA (1–5)</label>
        <input type="range" min={1} max={5} value={net} onChange={(e) => setNet(+e.target.value)} />
      </div>
      <div>
        <label>Data classification &amp; DLP (1–5)</label>
        <input type="range" min={1} max={5} value={data} onChange={(e) => setData(+e.target.value)} />
      </div>
      <p>
        Readiness index: <span className="badge">{score}%</span>
      </p>
      <p className="muted">MFA comparison: prefer WebAuthn/FIDO2 and TOTP over SMS for high-risk users.</p>
    </div>
  );
}

const SOC2 = ["CC1 control environment", "CC2 communication", "CC3 risk assessment", "CC4 monitoring", "CC5 control activities", "CC6 logical access", "CC7 system operations", "CC8 change management", "CC9 risk mitigation", "A1 availability"];

function Soc2Checklist(): JSX.Element {
  const [chk, setChk] = useState<boolean[]>(() => SOC2.map(() => false));
  const done = chk.filter(Boolean).length;
  return (
    <div className="stack">
      {SOC2.map((item, i) => (
        <label key={item} className="row" style={{ alignItems: "center", gap: "0.5rem" }}>
          <input type="checkbox" checked={chk[i]} onChange={(e) => setChk((p) => p.map((v, j) => (j === i ? e.target.checked : v)))} />
          {item}
        </label>
      ))}
      <p>
        Completed {done}/{SOC2.length}
      </p>
    </div>
  );
}

function RansomwareRisk(): JSX.Element {
  const [b, setB] = useState(3);
  const [e, setE] = useState(3);
  const [m, setM] = useState(3);
  const [s, setS] = useState(3);
  const exposure = 20 - (b + e + m + s);
  return (
    <div className="stack">
      <label>Backup immutability (1 weak – 5 strong)</label>
      <input type="range" min={1} max={5} value={b} onChange={(e) => setB(+e.target.value)} />
      <label>EDR coverage</label>
      <input type="range" min={1} max={5} value={e} onChange={(e) => setE(+e.target.value)} />
      <label>MFA coverage</label>
      <input type="range" min={1} max={5} value={m} onChange={(e) => setM(+e.target.value)} />
      <label>Segmentation</label>
      <input type="range" min={1} max={5} value={s} onChange={(e) => setS(+e.target.value)} />
      <p>
        Exposure score: <span className="badge">{exposure}</span> (lower is better)
      </p>
    </div>
  );
}

const IR_TYPES: Record<string, string[]> = {
  Ransomware: ["Isolate affected hosts", "Preserve logs", "Engage legal/PR", "Restore from immutable backups", "Post-incident review"],
  "Data breach": ["Contain exfil paths", "Notify stakeholders", "Rotate secrets", "Forensics imaging", "Regulatory reporting"],
  Phishing: ["Triage mailbox rules", "Reset creds for targets", "Hunt similar messages", "Update awareness", "Adjust email auth (SPF/DKIM/DMARC)"],
};

function IrPlaybookBuilder(): JSX.Element {
  const [t, setT] = useState<keyof typeof IR_TYPES>("Ransomware");
  return (
    <div className="stack">
      <label>Incident type</label>
      <select value={t} onChange={(e) => setT(e.target.value as keyof typeof IR_TYPES)}>
        {Object.keys(IR_TYPES).map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <ol>
        {IR_TYPES[t].map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

function AttackSurfaceCalculator(): JSX.Element {
  const [saas, setSaas] = useState(3);
  const [apis, setApis] = useState(3);
  const [users, setUsers] = useState(3);
  const sqft = saas * 120 + apis * 200 + users * 40;
  return (
    <div className="stack">
      <label>SaaS sprawl (1–5)</label>
      <input type="range" min={1} max={5} value={saas} onChange={(e) => setSaas(+e.target.value)} />
      <label>Public APIs (1–5)</label>
      <input type="range" min={1} max={5} value={apis} onChange={(e) => setApis(+e.target.value)} />
      <label>Workforce size tier (1–5)</label>
      <input type="range" min={1} max={5} value={users} onChange={(e) => setUsers(+e.target.value)} />
      <p>
        Metaphorical exposure: <span className="badge">{sqft} sqft</span> of &quot;attack floor&quot;
      </p>
      <p className="muted">Replace metaphor with CyberWavy&apos;s real asset graph.</p>
    </div>
  );
}

function BugBountyScope(): JSX.Element {
  const [text, setText] = useState("");
  const { ins, outs } = useMemo(() => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const ins: string[] = [];
    const outs: string[] = [];
    for (const l of lines) {
      if (/out of scope|OOS|exclude/i.test(l)) outs.push(l);
      else if (/in scope|scope:/i.test(l)) ins.push(l);
      else ins.push(l);
    }
    return { ins, outs };
  }, [text]);
  return (
    <div className="stack">
      <label>Paste program scope text</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <p>In-scope lines: {ins.length}</p>
      <p>Out-of-scope lines: {outs.length}</p>
    </div>
  );
}

const QUIZ = [
  { q: "Unexpected CFO email asks for gift cards — what do you do?", a: ["Buy cards quickly", "Reply with employee ID", "Report via security channel"], ok: 2 },
  { q: "Password policy best default?", a: ["8 chars quarterly rotation", "Long unique passphrases + MFA", "Reuse with numbers"], ok: 1 },
];

function SecurityAwarenessQuiz(): JSX.Element {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const pick = (i: number) => {
    if (i === QUIZ[idx]?.ok) setScore((s) => s + 1);
    setIdx((x) => x + 1);
  };
  if (idx >= QUIZ.length) return <p>Score {score}/{QUIZ.length}</p>;
  const cur = QUIZ[idx]!;
  return (
    <div className="stack">
      <p>{cur.q}</p>
      {cur.a.map((opt, i) => (
        <button key={opt} type="button" className="btn-primary btn-ghost" style={{ width: "100%" }} onClick={() => pick(i)}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function PentestRoadmap(): JSX.Element {
  const [scope, setScope] = useState("web");
  const [maturity, setMaturity] = useState("first");
  const outline = useMemo(() => {
    return [
      `Kickoff: confirm rules of engagement for ${scope}.`,
      maturity === "first" ? "Baseline passive recon and asset inventory." : "Expand to authenticated testing and lateral movement.",
      "Report: critical findings within 24h, full report with CVSS and fix guidance.",
    ];
  }, [scope, maturity]);
  return (
    <div className="stack">
      <label>Primary scope</label>
      <select value={scope} onChange={(e) => setScope(e.target.value)}>
        <option value="web">Web / API</option>
        <option value="cloud">Cloud</option>
        <option value="mobile">Mobile</option>
      </select>
      <label>Program maturity</label>
      <select value={maturity} onChange={(e) => setMaturity(e.target.value)}>
        <option value="first">First test</option>
        <option value="repeat">Repeat program</option>
      </select>
      <ol>
        {outline.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ol>
    </div>
  );
}

function VendorRiskScorecard(): JSX.Element {
  const [v, setV] = useState(3);
  const [c, setC] = useState(3);
  const [i, setI] = useState(3);
  const total = v + c + i;
  const tier = total >= 10 ? "Low vendor risk" : total >= 7 ? "Medium" : "High";
  return (
    <div className="stack">
      <label>Vendor publishes security page / SOC report?</label>
      <input type="range" min={1} max={5} value={v} onChange={(e) => setV(+e.target.value)} />
      <label>Contractual DPA / subprocessors listed?</label>
      <input type="range" min={1} max={5} value={c} onChange={(e) => setC(+e.target.value)} />
      <label>Integration depth (API keys, data volume)</label>
      <input type="range" min={1} max={5} value={i} onChange={(e) => setI(+e.target.value)} />
      <p>
        <span className="badge">{tier}</span> ({total}/15)
      </p>
    </div>
  );
}

export const TOOL_BODIES: Record<string, () => JSX.Element> = {
  "password-strength": PasswordStrength,
  "ssl-inspector": SslInspector,
  "security-headers-grader": SecurityHeadersGrader,
  "http-headers-analyzer": HttpHeadersAnalyzer,
  "cors-checker": CorsChecker,
  "url-safety-scanner": UrlSafetyScanner,
  "dns-record-viewer": DnsRecordViewer,
  "ip-reputation": IpReputation,
  "jwt-decoder": JwtDecoder,
  "base64-hash-toolkit": Base64HashToolkit,
  "subdomain-finder-lite": SubdomainFinderLite,
  "open-port-checker": OpenPortChecker,
  "robots-txt-analyzer": RobotsTxtAnalyzer,
  "sitemap-parser": SitemapParser,
  "email-breach-checker": EmailBreachChecker,
  "github-secret-scanner": GithubSecretScanner,
  "cookie-analyzer": CookieAnalyzer,
  "api-key-tester": ApiKeyTester,
  "tls-version-checker": TlsVersionChecker,
  "cert-transparency": CertTransparency,
  "cvss-calculator": CvssCalculator,
  "owasp-self-assessment": OwaspSelfAssessment,
  "sqli-payload-library": SqliLibrary,
  "xss-payload-generator": XssGenerator,
  "open-redirect-tester": OpenRedirectTester,
  "csp-evaluator": CspEvaluator,
  "clickjacking-tester": ClickjackingTester,
  "ssrf-payload-builder": SsrfPayloadBuilder,
  "prototype-pollution-checker": PrototypePollutionChecker,
  "dependency-vuln-lookup": DependencyVulnLookup,
  "nist-csf-scorecard": NistScorecard,
  "zero-trust-checker": ZeroTrustChecker,
  "soc2-checklist": Soc2Checklist,
  "ransomware-risk": RansomwareRisk,
  "ir-playbook-builder": IrPlaybookBuilder,
  "attack-surface-calculator": AttackSurfaceCalculator,
  "bug-bounty-scope": BugBountyScope,
  "security-awareness-quiz": SecurityAwarenessQuiz,
  "pentest-roadmap": PentestRoadmap,
  "vendor-risk-scorecard": VendorRiskScorecard,
};

export function ToolBody({ slug }: { slug: string }) {
  const C = TOOL_BODIES[slug];
  if (!C) return <p>Unknown tool.</p>;
  return <C />;
}
