const LIST_SECTIONS = [
  { key: 'risk_factors', title: 'Risk factors' },
  { key: 'stride_spoofing', title: 'STRIDE · Spoofing' },
  { key: 'stride_tampering', title: 'STRIDE · Tampering' },
  { key: 'stride_repudiation', title: 'STRIDE · Repudiation' },
  { key: 'stride_information_disclosure', title: 'STRIDE · Information disclosure' },
  { key: 'stride_denial_of_service', title: 'STRIDE · Denial of service' },
  { key: 'stride_elevation_of_privilege', title: 'STRIDE · Elevation of privilege' },
  { key: 'nist_identify', title: 'NIST CSF · Identify' },
  { key: 'nist_protect', title: 'NIST CSF · Protect' },
  { key: 'nist_detect', title: 'NIST CSF · Detect' },
  { key: 'nist_respond', title: 'NIST CSF · Respond' },
  { key: 'nist_recover', title: 'NIST CSF · Recover' },
  { key: 'soc2_ccf', title: 'SOC 2 / CCF' },
  { key: 'iso27001_annex', title: 'ISO 27001-style controls' },
  { key: 'phishing_and_bec', title: 'Phishing & BEC' },
  { key: 'supply_chain_software', title: 'Software supply chain' },
  { key: 'api_cloud_hardening', title: 'API & cloud hardening' },
  { key: 'iam_zero_trust', title: 'IAM & zero trust' },
  { key: 'secrets_and_keys', title: 'Secrets & keys' },
  { key: 'detection_content', title: 'Detection engineering' },
  { key: 'soar_automation', title: 'SOAR & automation' },
  { key: 'purple_team', title: 'Purple team' },
  { key: 'red_team_objectives', title: 'Red team objectives' },
  { key: 'blue_team_monitoring', title: 'Blue team monitoring' },
  { key: 'cwe_touchpoints', title: 'CWE touchpoints' },
  { key: 'privacy_gdpr', title: 'Privacy & GDPR' },
  { key: 'business_continuity', title: 'Business continuity & DR' },
  { key: 'metrics_slos', title: 'Metrics & SLOs' },
  { key: 'vendor_risk', title: 'Vendor / third-party risk' },
  { key: 'tabletop_outline', title: 'Tabletop exercise outline' },
  { key: 'deception', title: 'Deception & canaries' },
  { key: 'forensic_evidence', title: 'Forensics readiness' },
  { key: 'dlp_insider', title: 'DLP & insider risk' },
  { key: 'ransomware_resilience', title: 'Ransomware resilience' },
  { key: 'threat_intel_priorities', title: 'Threat intel priorities (hunt themes)' },
  { key: 'policy_drafts', title: 'Policy drafts' },
  { key: 'sbom_and_provenance', title: 'SBOM & provenance' },
  { key: 'continuous_compliance', title: 'Continuous compliance' },
  { key: 'ai_security_mlops', title: 'AI / MLSec' },
  { key: 'data_security', title: 'Data security' },
  { key: 'incident_command', title: 'Incident command' },
]

function ListBlock({ title, items }) {
  if (!items?.length) return null
  return (
    <details className="group rounded-lg border u-border u-card">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold u-text marker:u-muted">
        {title}
      </summary>
      <ul className="list-disc space-y-1 px-5 pb-3 pl-7 text-sm u-muted">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </details>
  )
}

export function SecuritySuitePanel({ suite }) {
  if (!suite?.extras) return null
  const x = suite.extras
  const pct = Math.round((x.overall_risk_score || 0) * 100)

  return (
    <section className="u-card u-border u-ring-primary rounded-xl p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-semibold u-text">Complete security suite</h2>
        <span className="text-xs u-muted">POST /suite — parallel pipeline + modern SOC / GRC modules</span>
      </header>

      <div className="mb-4 rounded-lg u-bg-danger-soft p-3">
        <p className="text-xs font-semibold u-danger">Overall risk (model estimate)</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full u-border border u-bg">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: 'var(--danger)',
            }}
          />
        </div>
        <p className="mt-1 text-xs u-muted">
          {pct}% — interpret with your threat model; not a penetration test or compliance attestation.
        </p>
      </div>

      {x.executive_summary ? (
        <div className="mb-4 rounded-lg u-bg-primary-soft p-3">
          <p className="text-xs font-semibold u-primary">Executive summary</p>
          <p className="mt-1 text-sm u-text">{x.executive_summary}</p>
        </div>
      ) : null}

      <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
        {LIST_SECTIONS.map(({ key, title }) => (
          <ListBlock key={key} title={title} items={x[key]} />
        ))}
      </div>
    </section>
  )
}
