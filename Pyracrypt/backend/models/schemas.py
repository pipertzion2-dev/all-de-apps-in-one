from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class HypothesisItem(BaseModel):
    hypothesis: str
    confidence: float = Field(ge=0.0, le=1.0)


class HypothesisRequest(BaseModel):
    system: str


class CombineRequest(BaseModel):
    system: Union[str, Dict[str, Any]]


class CombineResponse(BaseModel):
    new_structure: Dict[str, Any]
    explanation: str


class MutateRequest(BaseModel):
    system: Union[str, Dict[str, Any]]


class MutationFinding(BaseModel):
    mutation: str
    failure: Optional[str] = None
    vulnerable: bool = False


class MutateResponse(BaseModel):
    mutations: List[str]
    findings: List[MutationFinding]


class SimulateRequest(BaseModel):
    hypothesis: Union[str, Dict[str, Any]]


class SimulateResponse(BaseModel):
    attack_steps: List[str]


class RemedyRequest(BaseModel):
    attack: Union[str, Dict[str, Any]]


class RemedyResponse(BaseModel):
    fix: str
    explanation: str
    improved_architecture: str


class PipelineRequest(BaseModel):
    system: str


class PipelineResponse(BaseModel):
    hypotheses: List[HypothesisItem]
    combined: CombineResponse
    mutated: MutateResponse
    simulated: SimulateResponse
    remedy: RemedyResponse


class SuiteRequest(BaseModel):
    system: str


class SuiteExtras(BaseModel):
    """Extended analyses typical of modern cybersecurity AI copilots (defensive, governance, SOC)."""

    model_config = ConfigDict(extra="ignore")

    executive_summary: str = ""
    overall_risk_score: float = Field(0.5, ge=0.0, le=1.0)
    risk_factors: List[str] = Field(default_factory=list)
    stride_spoofing: List[str] = Field(default_factory=list)
    stride_tampering: List[str] = Field(default_factory=list)
    stride_repudiation: List[str] = Field(default_factory=list)
    stride_information_disclosure: List[str] = Field(default_factory=list)
    stride_denial_of_service: List[str] = Field(default_factory=list)
    stride_elevation_of_privilege: List[str] = Field(default_factory=list)
    nist_identify: List[str] = Field(default_factory=list)
    nist_protect: List[str] = Field(default_factory=list)
    nist_detect: List[str] = Field(default_factory=list)
    nist_respond: List[str] = Field(default_factory=list)
    nist_recover: List[str] = Field(default_factory=list)
    soc2_ccf: List[str] = Field(default_factory=list)
    iso27001_annex: List[str] = Field(default_factory=list)
    phishing_and_bec: List[str] = Field(default_factory=list)
    supply_chain_software: List[str] = Field(default_factory=list)
    api_cloud_hardening: List[str] = Field(default_factory=list)
    iam_zero_trust: List[str] = Field(default_factory=list)
    secrets_and_keys: List[str] = Field(default_factory=list)
    detection_content: List[str] = Field(default_factory=list)
    soar_automation: List[str] = Field(default_factory=list)
    purple_team: List[str] = Field(default_factory=list)
    red_team_objectives: List[str] = Field(default_factory=list)
    blue_team_monitoring: List[str] = Field(default_factory=list)
    cwe_touchpoints: List[str] = Field(default_factory=list)
    privacy_gdpr: List[str] = Field(default_factory=list)
    business_continuity: List[str] = Field(default_factory=list)
    metrics_slos: List[str] = Field(default_factory=list)
    vendor_risk: List[str] = Field(default_factory=list)
    tabletop_outline: List[str] = Field(default_factory=list)
    deception: List[str] = Field(default_factory=list)
    forensic_evidence: List[str] = Field(default_factory=list)
    dlp_insider: List[str] = Field(default_factory=list)
    ransomware_resilience: List[str] = Field(default_factory=list)
    threat_intel_priorities: List[str] = Field(default_factory=list)
    policy_drafts: List[str] = Field(default_factory=list)
    sbom_and_provenance: List[str] = Field(default_factory=list)
    continuous_compliance: List[str] = Field(default_factory=list)
    ai_security_mlops: List[str] = Field(default_factory=list)
    data_security: List[str] = Field(default_factory=list)
    incident_command: List[str] = Field(default_factory=list)


class SuiteResponse(BaseModel):
    pipeline: PipelineResponse
    extras: SuiteExtras


class FeatureMeta(BaseModel):
    id: str
    name: str
    description: str
    kind: str
