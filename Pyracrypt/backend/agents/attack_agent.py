from __future__ import annotations

import json
from typing import Any

from models.schemas import SimulateResponse
from services import llm_service


def _as_text(hypothesis: str | dict[str, Any]) -> str:
    if isinstance(hypothesis, dict):
        return str(hypothesis.get("hypothesis") or hypothesis.get("text") or json.dumps(hypothesis, ensure_ascii=False))
    return str(hypothesis)


def _simulate_fallback(hyp: str) -> SimulateResponse:
    steps = [
        "Map the trust boundary implied by the hypothesis to concrete interfaces (HTTP routes, queues, admin tools).",
        "Acquire the minimum viable identity artifact (session cookie, JWT, API key) using normal user behavior.",
        "Replay or transplant the artifact onto a higher-impact endpoint with altered resource identifiers.",
        "Validate impact with a safe, non-destructive proof (read-only exfiltration or dry-run mutation).",
        "Chain lateral movement using any newly reachable internal services discovered in responses.",
    ]
    if "jwt" in hyp.lower():
        steps.insert(2, "Test token audience/issuer drift and cross-service signature validation gaps.")
    if "payment" in hyp.lower() or "webhook" in hyp.lower():
        steps.insert(2, "Forge or replay webhook deliveries while observing idempotency and signature enforcement.")
    return SimulateResponse(attack_steps=steps)


async def run_attack_simulation(hypothesis: str | dict[str, Any]) -> SimulateResponse:
    hyp = _as_text(hypothesis)
    system_prompt = (
        "You convert a security hypothesis into a responsible, realistic attack chain suitable for defenders. "
        "No weaponized payloads—describe steps conceptually. Return JSON: {\"attack_steps\":[string,...]}"
    )
    user_prompt = json.dumps({"hypothesis": hyp}, ensure_ascii=False)
    try:
        data = await llm_service.llm_json_completion(system_prompt, user_prompt)
        steps = data.get("attack_steps")
        if isinstance(steps, list) and steps:
            return SimulateResponse(attack_steps=[str(s) for s in steps])
    except Exception:
        pass
    return _simulate_fallback(hyp)
