from __future__ import annotations

import json
from typing import Any

from models.schemas import HypothesisItem
from services import llm_service
from services.system_graph import build_graph, normalize_system_input


def _fallback_hypotheses(system: str) -> list[HypothesisItem]:
    g = build_graph(system)
    labels = [n["id"] for n in g["nodes"]]
    lower = system.lower()
    out: list[HypothesisItem] = []

    def add(text: str, c: float) -> None:
        out.append(HypothesisItem(hypothesis=text, confidence=c))

    if "jwt" in lower or "bearer" in lower:
        add(
            "If JWT validation is inconsistent across services or tokens are reused broadly, "
            "attackers may replay or swap tokens to reach unauthorized endpoints.",
            0.78,
        )
    if "payment" in lower or "card" in lower:
        add(
            "If payment webhooks lack signature verification or idempotency controls, "
            "forged events could manipulate balances or order state.",
            0.82,
        )
    if "profile" in lower or "user" in lower:
        add(
            "If object identifiers in profile routes are predictable and authorization checks are shallow, "
            "IDOR can leak or mutate other users' data.",
            0.76,
        )
    if "admin" in lower:
        add(
            "If admin actions share the same session surface as user traffic, "
            "CSRF or confused-deputy patterns can escalate ordinary sessions to privileged operations.",
            0.74,
        )
    if "upload" in lower or "file" in lower:
        add(
            "If uploads are stored executable or served back without content-type isolation, "
            "stored XSS or remote code execution paths may appear.",
            0.8,
        )
    add(
        f"Cross-component trust assumptions between {', '.join(labels[:4])} may hide lateral movement: "
        "one weak verifier can become a launch point for the rest of the graph.",
        0.66,
    )
    add(
        "If rate limits, abuse detection, and audit logs are absent on high-value flows, "
        "credential stuffing and blind data exfiltration become practical at scale.",
        0.62,
    )
    return out[:8]


async def run_hypothesis_engine(system: str | dict[str, Any]) -> list[HypothesisItem]:
    text, graph = normalize_system_input(system)
    system_prompt = (
        "You are a principal application security architect. Analyze relationships between components, "
        "trust boundaries, data flows, and authentication/authorization coupling—not keyword matching. "
        "Return strict JSON: {\"items\":[{\"hypothesis\":string,\"confidence\":number between 0 and 1}]}"
    )
    user_prompt = json.dumps({"system": text, "graph": graph}, ensure_ascii=False)
    try:
        data = await llm_service.llm_json_completion(system_prompt, user_prompt)
        items = data.get("items") or data.get("hypotheses")
        if not isinstance(items, list):
            raise ValueError("bad shape")
        parsed: list[HypothesisItem] = []
        for it in items:
            if isinstance(it, dict) and "hypothesis" in it:
                parsed.append(
                    HypothesisItem(
                        hypothesis=str(it["hypothesis"]),
                        confidence=float(it.get("confidence", 0.7)),
                    )
                )
        if parsed:
            return parsed[:12]
    except Exception:
        pass
    return _fallback_hypotheses(text)
