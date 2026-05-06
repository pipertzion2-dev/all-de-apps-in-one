from __future__ import annotations

from fastapi import APIRouter

from models.schemas import FeatureMeta

router = APIRouter()

_FEATURES: list[FeatureMeta] = [
    FeatureMeta(
        id="hypothesis",
        name="Hypothesis engine",
        description="LLM-driven vulnerability hypotheses from component relationships and trust boundaries.",
        kind="core_engine",
    ),
    FeatureMeta(
        id="combine",
        name="System combination engine",
        description="Rewires structured graphs to expose emergent risk from novel component coupling.",
        kind="core_engine",
    ),
    FeatureMeta(
        id="mutate",
        name="System mutation engine",
        description="Stress-tests the architecture with realistic permission, ordering, and validation mutations.",
        kind="core_engine",
    ),
    FeatureMeta(
        id="simulate",
        name="Attack simulation",
        description="Turns hypotheses into defender-safe, stepwise attack narratives for validation.",
        kind="core_engine",
    ),
    FeatureMeta(
        id="remedy",
        name="Remedy engine",
        description="Produces fixes, root-cause explanations, and improved architecture guidance.",
        kind="core_engine",
    ),
    FeatureMeta(
        id="pipeline",
        name="Full pipeline",
        description="Runs hypothesis → combine → mutate → simulate → remedy in one orchestrated pass.",
        kind="core_engine",
    ),
    FeatureMeta(
        id="suite",
        name="Complete security suite",
        description="Runs the full pipeline plus STRIDE, NIST CSF, SOC2/ISO hints, SOC content, GRC, and more in parallel.",
        kind="suite",
    ),
    FeatureMeta(
        id="viz3d",
        name="Living 3D defense field",
        description="react-three-fiber scene: nodes, animated flows, barbed wire states, particles, shield, core pulse.",
        kind="visualization",
    ),
    FeatureMeta(
        id="risk",
        name="Risk scoring & factors",
        description="Overall risk score with ranked organizational risk factors.",
        kind="analysis",
    ),
    FeatureMeta(
        id="stride",
        name="STRIDE modeling",
        description="Spoofing through elevation-of-privilege attack pattern catalog for the described system.",
        kind="analysis",
    ),
    FeatureMeta(
        id="nist_csf",
        name="NIST CSF alignment",
        description="Identify / Protect / Detect / Respond / Recover guidance mapped to your system.",
        kind="analysis",
    ),
    FeatureMeta(
        id="grc",
        name="GRC & frameworks",
        description="SOC2 CCF and ISO 27001-style control hints for audit readiness.",
        kind="analysis",
    ),
    FeatureMeta(
        id="phishing",
        name="Phishing & BEC",
        description="Social engineering scenarios relevant to finance, OAuth, and operations workflows.",
        kind="analysis",
    ),
    FeatureMeta(
        id="supply_chain",
        name="Software supply chain",
        description="Dependency, SBOM, provenance, and CI/CD integrity recommendations.",
        kind="analysis",
    ),
    FeatureMeta(
        id="api_cloud",
        name="API & cloud hardening",
        description="Edge, API gateway, and cloud IAM/network posture guidance.",
        kind="analysis",
    ),
    FeatureMeta(
        id="iam_zt",
        name="IAM & zero trust",
        description="Continuous validation, least privilege, and session hardening patterns.",
        kind="analysis",
    ),
    FeatureMeta(
        id="secrets",
        name="Secrets & key hygiene",
        description="Rotation, scanning, KMS, and workload identity practices.",
        kind="analysis",
    ),
    FeatureMeta(
        id="detection",
        name="Detection engineering",
        description="Content ideas for SIEM/EDR/Sigma-style detection and UEBA baselines.",
        kind="analysis",
    ),
    FeatureMeta(
        id="soar",
        name="SOAR & automation",
        description="Playbook hooks and automated response patterns with human-in-the-loop gates.",
        kind="analysis",
    ),
    FeatureMeta(
        id="purple_red_blue",
        name="Purple / red / blue team",
        description="Collaborative exercises, adversary objectives, and defensive monitoring priorities.",
        kind="analysis",
    ),
    FeatureMeta(
        id="cwe",
        name="CWE touchpoints",
        description="Common weakness classes likely relevant to the described architecture.",
        kind="analysis",
    ),
    FeatureMeta(
        id="privacy",
        name="Privacy & GDPR",
        description="Data minimization, DPIA triggers, and lawful-basis reminders.",
        kind="analysis",
    ),
    FeatureMeta(
        id="bc_dr",
        name="Business continuity & DR",
        description="RTO/RPO, chaos testing, and crisis communications alignment.",
        kind="analysis",
    ),
    FeatureMeta(
        id="metrics",
        name="Security metrics & SLOs",
        description="KPIs, SLIs, and error-budget tie-ins for reliability and security.",
        kind="analysis",
    ),
    FeatureMeta(
        id="vendor",
        name="Third-party / vendor risk",
        description="Due diligence questions and subprocessor governance.",
        kind="analysis",
    ),
    FeatureMeta(
        id="tabletop",
        name="Incident tabletop",
        description="Scenario outlines for cross-functional drills.",
        kind="analysis",
    ),
    FeatureMeta(
        id="deception",
        name="Deception & canaries",
        description="Honeytokens, decoys, and high-signal tripwires.",
        kind="analysis",
    ),
    FeatureMeta(
        id="forensics",
        name="Forensics readiness",
        description="Evidence preservation, WORM logging, and regulatory timelines.",
        kind="analysis",
    ),
    FeatureMeta(
        id="dlp",
        name="DLP & insider risk",
        description="Data labeling, export controls, and privileged access reviews.",
        kind="analysis",
    ),
    FeatureMeta(
        id="ransomware",
        name="Ransomware resilience",
        description="Segmentation, immutable backups, and recovery drills.",
        kind="analysis",
    ),
    FeatureMeta(
        id="threat_intel",
        name="Threat intel priorities",
        description="Hunt themes derived from your narrative (not a live TI feed—prioritized defensive focus).",
        kind="analysis",
    ),
    FeatureMeta(
        id="policy",
        name="Policy drafting",
        description="Starter policy clauses for acceptable use, SDLC, and API clients.",
        kind="analysis",
    ),
    FeatureMeta(
        id="sbom",
        name="SBOM & provenance",
        description="CycloneDX/SPDX, signing, and deploy-time CVE gates.",
        kind="analysis",
    ),
    FeatureMeta(
        id="continuous_compliance",
        name="Continuous compliance",
        description="Policy-as-code, drift detection, and evidence automation.",
        kind="analysis",
    ),
    FeatureMeta(
        id="ai_mlsec",
        name="AI / MLSec",
        description="Model supply chain, prompt-injection surfaces, and copilot governance.",
        kind="analysis",
    ),
    FeatureMeta(
        id="data_security",
        name="Data security",
        description="Encryption, tokenization, retention, and field-level controls.",
        kind="analysis",
    ),
    FeatureMeta(
        id="incident_command",
        name="Incident command structure",
        description="RACI, severity definitions, and customer comms alignment.",
        kind="analysis",
    ),
]


@router.get("/features", response_model=list[FeatureMeta])
async def list_features() -> list[FeatureMeta]:
    return _FEATURES
