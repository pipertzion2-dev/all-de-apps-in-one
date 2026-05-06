from __future__ import annotations

import json
from typing import Any, Dict, List

from models.schemas import SuiteExtras
from services import llm_service
from services.system_graph import build_graph


def _fb(system: str, graph: Dict[str, Any]) -> SuiteExtras:
    labels = ", ".join(n.get("id", "") for n in graph.get("nodes", [])[:8])
    low = system.lower()
    has_pay = "payment" in low or "card" in low
    has_auth = "jwt" in low or "auth" in low or "oauth" in low
    has_data = "profile" in low or "user" in low or "database" in low or "db" in low

    return SuiteExtras(
        executive_summary=(
            f"Architecture involving {labels or 'multiple components'} should be treated as a moving trust boundary: "
            "controls must be explicit at every hop, not inherited implicitly across services."
        ),
        overall_risk_score=0.62 if (has_pay and has_auth) else 0.55,
        risk_factors=[
            "Cross-service token reuse and weak audience scoping amplify lateral movement.",
            "Operational shortcuts (shared admin paths, webhooks without signatures) expand blast radius.",
            "Insufficient telemetry on high-value mutations hides abuse until impact is visible.",
        ],
        stride_spoofing=[
            "Credential stuffing and session fixation against shared login surfaces.",
            "Subdomain takeover or stale DNS if external callbacks are used.",
        ],
        stride_tampering=[
            "Unsigned webhooks or mutable audit trails on payment-adjacent flows.",
            "Cache poisoning if CDN or edge caches normalize unsafe headers.",
        ],
        stride_repudiation=[
            "Missing dual-control on privileged actions weakens non-repudiation.",
            "Weak correlation IDs across async workers obscure causality.",
        ],
        stride_information_disclosure=[
            "Verbose errors and differential timing on profile lookups enable enumeration.",
            "Log redaction gaps may leak identifiers into SIEM exports.",
        ],
        stride_denial_of_service=[
            "Unbounded expensive queries on GraphQL/search endpoints.",
            "Webhook storms without rate limits or circuit breakers.",
        ],
        stride_elevation_of_privilege=[
            "Broken object-level authorization on profile or admin routes.",
            "Confused deputy if internal services trust broad bearer tokens.",
        ],
        nist_identify=[
            "Maintain a living asset inventory for APIs, queues, and data stores.",
            "Map trust boundaries between client, edge, and internal services.",
        ],
        nist_protect=[
            "Enforce least privilege IAM, short-lived credentials, and mTLS on east-west traffic.",
            "Centralize secrets in a KMS-backed store with rotation policy.",
        ],
        nist_detect=[
            "Deploy anomaly detection on auth velocity and payment mutation rates.",
            "Alert on policy drift (new public endpoints, relaxed CORS).",
        ],
        nist_respond=[
            "Pre-stage containment playbooks: disable keys, freeze payouts, preserve evidence.",
            "Run blameless post-incident reviews with measurable remediation SLAs.",
        ],
        nist_recover=[
            "Test backups and restore paths for databases and object stores quarterly.",
            "Define RTO/RPO for payment and identity subsystems.",
        ],
        soc2_ccf=[
            "CC6/CC7: logical access, change management, and vulnerability management for CI/CD.",
            "CC8: monitor intrusion and anomalous privileged sessions continuously.",
        ],
        iso27001_annex=[
            "A.8 asset management for keys, tokens, and third-party integrations.",
            "A.12 operations security: hardened baselines and patch SLAs.",
        ],
        phishing_and_bec=[
            "Finance and ops impersonation targeting payout approvers and vendor updates.",
            "OAuth consent phishing if users can add third-party apps to org tenants.",
        ],
        supply_chain_software=[
            "Pin dependencies, verify SBOM provenance, and scan CI artifacts before deploy.",
            "Review maintainer risk for packages touching crypto or auth.",
        ],
        api_cloud_hardening=[
            "Schema validation, strict content-types, and per-tenant rate limits on public APIs.",
            "Cloud IAM: deny-by-default network policies between VPC segments.",
        ],
        iam_zero_trust=[
            "Device posture checks before elevated sessions; continuous validation of tokens.",
            "Per-resource policies with ABAC attributes where RBAC is insufficient.",
        ],
        secrets_and_keys=[
            "No long-lived root keys in repos; use workload identity where possible.",
            "Automated secret scanning on PRs and pre-commit hooks.",
        ],
        detection_content=[
            "Sigma/YARA-style ideas: spikes in 401/403 ratio, unusual JWT kid rotation, webhook retries.",
            "UEBA: baseline admin hours and geographies for break-glass accounts.",
        ],
        soar_automation=[
            "Auto-ticket on failed auth bursts; auto-rotate suspected leaked API keys with approval gate.",
            "Orchestrate sandbox detonation for suspicious file uploads.",
        ],
        purple_team=[
            "Replay token abuse lab against staging with mirrored auth config.",
            "Tabletop: simultaneous webhook outage + credential stuffing drill.",
        ],
        red_team_objectives=[
            "Achieve object-level data access across tenants without new credentials.",
            "Demonstrate persistence via CI pipeline secret exfiltration.",
        ],
        blue_team_monitoring=[
            "Dashboards for auth path latency, webhook signature failures, and payout deltas.",
            "Retain tamper-evident logs for all admin and payment mutations.",
        ],
        cwe_touchpoints=[
            "CWE-639: authorization bypass through user-controlled key.",
            "CWE-352: CSRF on state-changing browser flows.",
            "CWE-918: SSRF if webhooks fetch user-supplied URLs.",
        ],
        privacy_gdpr=[
            "Data minimization on profiles; lawful basis documented for marketing vs transactional data.",
            "DPIA if automated decisioning impacts users materially.",
        ],
        business_continuity=[
            "Chaos tests for regional failover of payment and identity providers.",
            "Communication tree for customer-facing incidents.",
        ],
        metrics_slos=[
            "SLO: p99 auth validation < 120ms; error budget tied to release gates.",
            "Security KPI: MTTD/MTTR for critical alerts with quarterly targets.",
        ],
        vendor_risk=[
            "SSO/SAML metadata integrity; annual pen-test attestation for payment processors.",
            "Subprocessor change notification workflow.",
        ],
        tabletop_outline=[
            "Scenario: forged payout webhook during peak traffic; roles: eng, finance, legal, comms.",
            "Inject partial observability loss to stress manual correlation.",
        ],
        deception=[
            "Canary tokens in object storage and fake admin endpoints with high-fidelity logging.",
            "Honey API keys in CI that alert on any usage.",
        ],
        forensic_evidence=[
            "Immutable WORM storage for audit logs; chain-of-custody for disk snapshots.",
            "Standardized timeline export for regulators.",
        ],
        dlp_insider=[
            "Label-based controls on exports of PII from profile services.",
            "Just-in-time access for DB read replicas with session recording.",
        ],
        ransomware_resilience=[
            "Immutable backups, offline recovery drills, and golden images for rebuild.",
            "Network segmentation to prevent lateral spread from endpoints to data plane.",
        ],
        threat_intel_priorities=[
            "Prioritized hunt themes derived from your description (not live feeds): "
            f"focus on {'payment fraud patterns, ' if has_pay else ''}{'token/session abuse, ' if has_auth else ''}"
            f"{'data exfil via APIs' if has_data else 'generic lateral movement'} with continuous validation.",
        ],
        policy_drafts=[
            "Acceptable use for API clients including abuse handling and key rotation SLAs.",
            "Secure SDLC policy linking threat modeling to release approvals.",
        ],
        sbom_and_provenance=[
            "Generate CycloneDX/SPDX on each release; verify signatures with Sigstore/cosign policy.",
            "Block deploy if critical CVEs exceed SLA without documented exception.",
        ],
        continuous_compliance=[
            "Policy-as-code (OPA) for ingress and service mesh routes; drift detection in Terraform.",
            "Scheduled attestation of control effectiveness with evidence bundles.",
        ],
        ai_security_mlops=[
            "If ML is present: model supply chain, prompt-injection guards on LLM gateways, PII in training data review.",
            "Red-team jailbreaks against internal copilots with access to sensitive tools.",
        ],
        data_security=[
            "Field-level encryption for highly sensitive attributes; KMS envelope encryption at rest.",
            "Tokenization for PAN where applicable; minimize retention windows.",
        ],
        incident_command=[
            "RACI for SEV definitions; single incident commander per active incident.",
            "Customer comms templates pre-approved by legal for regulated sectors.",
        ],
    )


async def run_suite_extras(system: str) -> SuiteExtras:
    graph = build_graph(system)
    system_prompt = (
        "You are a world-class virtual CISO assistant. Given a system description and graph, produce a comprehensive "
        "defensive analysis as strict JSON matching the requested keys exactly. Use concise bullet phrases in arrays. "
        "overall_risk_score is 0..1. threat_intel_priorities must clarify these are derived priorities, not live intel."
    )
    schema_hint = {
        "executive_summary": "string",
        "overall_risk_score": "number",
        "risk_factors": ["string"],
        "stride_spoofing": ["string"],
        "stride_tampering": ["string"],
        "stride_repudiation": ["string"],
        "stride_information_disclosure": ["string"],
        "stride_denial_of_service": ["string"],
        "stride_elevation_of_privilege": ["string"],
        "nist_identify": ["string"],
        "nist_protect": ["string"],
        "nist_detect": ["string"],
        "nist_respond": ["string"],
        "nist_recover": ["string"],
        "soc2_ccf": ["string"],
        "iso27001_annex": ["string"],
        "phishing_and_bec": ["string"],
        "supply_chain_software": ["string"],
        "api_cloud_hardening": ["string"],
        "iam_zero_trust": ["string"],
        "secrets_and_keys": ["string"],
        "detection_content": ["string"],
        "soar_automation": ["string"],
        "purple_team": ["string"],
        "red_team_objectives": ["string"],
        "blue_team_monitoring": ["string"],
        "cwe_touchpoints": ["string"],
        "privacy_gdpr": ["string"],
        "business_continuity": ["string"],
        "metrics_slos": ["string"],
        "vendor_risk": ["string"],
        "tabletop_outline": ["string"],
        "deception": ["string"],
        "forensic_evidence": ["string"],
        "dlp_insider": ["string"],
        "ransomware_resilience": ["string"],
        "threat_intel_priorities": ["string"],
        "policy_drafts": ["string"],
        "sbom_and_provenance": ["string"],
        "continuous_compliance": ["string"],
        "ai_security_mlops": ["string"],
        "data_security": ["string"],
        "incident_command": ["string"],
    }
    user_prompt = json.dumps({"system": system, "graph": graph, "schema": schema_hint}, ensure_ascii=False)
    try:
        data = await llm_service.llm_json_completion(system_prompt, user_prompt)
        try:
            return SuiteExtras.model_validate(data)
        except Exception:
            return _fb(system, graph)
    except Exception:
        return _fb(system, graph)
