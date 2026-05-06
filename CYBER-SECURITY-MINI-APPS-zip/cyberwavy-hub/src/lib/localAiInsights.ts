/** Rule-based “smart tips” when OpenAI is not configured — still feels helpful and instant. */
const BY_SLUG: Record<string, string> = {
  "password-strength":
    "• Longer passwords beat complex short ones — aim for 12+ from a password manager.\n• Reusing one password across sites is the #1 driver of account takeover.\n• Add the generator above, then store the secret only in a trusted vault.",
  "ssl-inspector":
    "• Certificate expiry and chain issues are easy wins — calendar renewals before 30 days.\n• Pair this DNS check with SSL Labs for full TLS/cipher detail (server-side test).\n• Watch for hostname mismatches on CDNs and multi-SAN certs.",
  "security-headers-grader":
    "• HSTS + CSP are the highest-impact headers for web apps; fix gradually with report-only first.\n• X-Frame-Options or CSP frame-ancestors stops most clickjacking.\n• Re-scan after each deploy — headers drift in edge configs.",
  "http-headers-analyzer":
    "• Email phishing often shows up in Received chains and Return-Path vs From mismatches.\n• For HTTP, look for caching headers leaking session identifiers.\n• Paste minimal excerpts when asking for help — redact tokens.",
  "cors-checker":
    "• Access-Control-Allow-Origin: * with credentials is a critical misconfiguration pattern.\n• Prefer explicit origin allowlists over reflection of arbitrary Origin headers.\n• Test preflight (OPTIONS) separately for APIs.",
  "url-safety-scanner":
    "• Look-alike domains and URL encoding tricks are common in phishing.\n• Prefer typing banking and SSO URLs or using bookmarks.\n• IP-literal and unusual ports warrant extra scrutiny.",
  "dns-record-viewer":
    "• MX + SPF/DMARC TXT records are central to email spoofing resistance.\n• Unexpected A/AAAA to cloud IPs may show shadow infrastructure.\n• Use this as a first pass; full SPF/DMARC syntax validation needs dedicated parsers.",
  "ip-reputation":
    "• Geolocation is approximate — combine with your logs and ASN context.\n• Residential proxies blur “bad IP” lists; behaviour beats geography.\n• Block at the edge only with change control and false-positive review.",
  "jwt-decoder":
    "• Never trust a JWT without signature verification with the issuer’s key.\n• alg=none and algorithm confusion are classic implementation bugs.\n• Short exp + rotation beats long-lived bearer tokens.",
  "base64-hash-toolkit":
    "• SHA-256 is for integrity fingerprints, not password storage — use Argon2/bcrypt on servers.\n• Treat Base64 as encoding, not encryption.\n• Compare hashes in constant time on the server when checking secrets.",
  "subdomain-finder-lite":
    "• This probes a tiny wordlist — real attackers use large dictionaries and certificate transparency.\n• Shadow IT often lives on dev.* and staging.*.\n• Remove DNS for decommissioned hosts to shrink surface area.",
  "open-port-checker":
    "• Exposed RDP, SMB, and database ports are ransomware entry favourites.\n• Cloud SG drift happens — schedule periodic internal port audits.\n• Browsers can’t port-scan arbitrary hosts; use authorised scanners internally.",
  "robots-txt-analyzer":
    "• robots.txt is not access control — it only guides well-behaved crawlers.\n• Disallow entries sometimes advertise sensitive paths to humans.\n• Combine with authenticated crawling for real coverage.",
  "sitemap-parser":
    "• Large sitemaps may include admin or debug URLs — verify auth on every route.\n• Use sitemaps for inventory, not as a security boundary.\n• Diff sitemaps across releases to catch accidental exposure.",
  "email-breach-checker":
    "• Have I Been Pwned is the standard public breach lookup — use it directly in your browser.\n• MX checks confirm mail routing but not mailbox security.\n• Rotate passwords where reuse might have occurred.",
  "github-secret-scanner":
    "• Assume any leaked key in git history is compromised — rotate, don’t just delete the file.\n• Enable secret scanning and push protection in GitHub/GitLab.\n• Prefer short-lived tokens and OIDC in CI over long PATs.",
  "cookie-analyzer":
    "• Session cookies should be HttpOnly + Secure + SameSite=Lax/Strict where possible.\n• Wildcard domain cookies widen XSS blast radius.\n• Prefer __Host- prefix cookies for high-security sessions when applicable.",
  "api-key-tester":
    "• Format detection is heuristic — treat any suspicious string as secret until proven otherwise.\n• Scope API keys minimally and monitor usage for anomalies.\n• Never commit keys; use vault + environment injection.",
  "tls-version-checker":
    "• Disable TLS 1.0/1.1 and weak ciphers for public-facing services.\n• Test staging the same as production — misconfigurations often differ.\n• Document exceptions for legacy clients with compensating controls.",
  "cert-transparency":
    "• Unexpected certs for your domain may indicate mis-issuance or shadow infrastructure.\n• Monitor CT logs for your brand and typo-domains.\n• Combine with CAA DNS records to restrict allowed CAs.",
  "cvss-calculator":
    "• CVSS base is one input — pair with exploitability in your environment and asset value.\n• Use the vector string in tickets so scores are reproducible.\n• Patch critical internet-facing issues first, then high lateral-movement paths.",
  "owasp-self-assessment":
    "• OWASP Top 10 is a lens, not a complete program — add threat modelling and SDLC checks.\n• Failing “access control” often dwarfs flashy XSS in real breaches.\n• Re-run after major architecture changes.",
  "sqli-payload-library":
    "• Only use payloads on systems you own or have written permission to test.\n• Parameterised queries + least-privilege DB users mitigate most SQLi.\n• Log and alert on database errors returned to users.",
  "xss-payload-generator":
    "• Context matters: HTML, attribute, and JS contexts need different payloads.\n• CSP narrows XSS but misconfigured unsafe-inline defeats it.\n• Encode output by context; validate input types strictly.",
  "open-redirect-tester":
    "• Open redirects fuel phishing and OAuth abuse — allowlist destinations server-side.\n• Validate both decoded and double-encoded URLs.\n• Prefer opaque tokens over passing raw URLs in parameters.",
  "csp-evaluator":
    "• Start with report-only CSP, fix violations, then enforce.\n• unsafe-inline and wildcard script-src are common bypass enablers.\n• Use nonces or hashes for required inline scripts.",
  "clickjacking-tester":
    "• Prefer CSP frame-ancestors over X-Frame-Options for modern browsers.\n• Some flows still need framing — use explicit allowlists.\n• Test payment and SSO flows especially.",
  "ssrf-payload-builder":
    "• SSRF can reach cloud metadata endpoints — network egress controls matter.\n• Validate and resolve URLs server-side with blocklists for internal ranges.\n• Only test with explicit authorisation and scoped environments.",
  "prototype-pollution-checker":
    "• Deep merge utilities are a frequent source of prototype pollution.\n• Prefer allowlisted keys when combining objects.\n• Freeze prototypes where your runtime allows and audit dependencies.",
  "dependency-vuln-lookup":
    "• Link npm names to GitHub Advisory Database and your SCA tool of choice.\n• Transitive dependencies dominate CVE count — automate lockfile PRs.\n• Prioritise reachable vulnerabilities in production code paths.",
  "nist-csf-scorecard":
    "• NIST CSF is outcome-oriented — map controls to Identify, Protect, Detect, Respond, Recover.\n• Start with asset inventory and governance before buying tools.\n• Revisit quarterly or after incidents.",
  "zero-trust-checker":
    "• MFA everywhere for humans; phishing-resistant factors for admins.\n• Micro-segmentation limits lateral movement more than perimeter VPNs.\n• Device trust should reflect real compliance state, not just MDM enrollment.",
  "soc2-checklist":
    "• Evidence beats policy PDFs — collect tickets, logs, and screenshots.\n• CC6/CC7 often need the most engineering time.\n• Align scope (system description) before the audit window.",
  "ransomware-risk":
    "• Immutable/offline backups are the main recovery lever — test restores.\n• EDR + MFA + email filtering reduce initial access.\n• Tabletop exercises beat a playbook nobody has read.",
  "ir-playbook-builder":
    "• Assign single incident commander and comms lead early.\n• Preserve logs before containment changes ephemeral evidence.\n• Regulatory clocks start fast — know your notification counsel contacts.",
  "attack-surface-calculator":
    "• This score is a metaphor — real surface needs continuous asset discovery.\n• SaaS sprawl and forgotten APIs dominate modern exposure.\n• Tie findings to owners and review quarterly.",
  "bug-bounty-scope":
    "• When in doubt, ask the program — out-of-scope reports burn trust.\n• Note wildcard vs single-host scope carefully.\n• Save scope text; it changes with acquisitions.",
  "security-awareness-quiz":
    "• Short frequent drills beat annual click-through videos.\n• Reward reporting near-misses, not only catches.\n• Measure click rates on simulations and improve, don’t shame.",
  "pentest-roadmap":
    "• Scope drives depth — clarify APIs, cloud roles, and excluded production.\n• First tests should maximise coverage; later ones go deeper on logic flaws.\n• Feed every finding into a tracked remediation SLA.",
  "vendor-risk-scorecard":
    "• High integration vendors need SOC 2 / ISO evidence, not just a logo.\n• Subprocessors and data residency belong in the contract review.\n• Re-score after major product or ownership changes.",
};

export function getLocalInsight(slug: string, title: string): string {
  return (
    BY_SLUG[slug] ??
    `• Use this free online ${title} as a quick sanity check — not a full audit.\n• Combine multiple tools (DNS + headers + TLS) for a fuller picture.\n• For continuous testing and remediation, run a deeper scan on your primary security platform.`
  );
}
